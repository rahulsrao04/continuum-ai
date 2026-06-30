const API_URL = 'PRODUCTION_API_URL'; // Replace with actual Render URL after deployment
const PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.com',
  perplexity: 'https://www.perplexity.ai'
};

// DOM Elements
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const loginSuccess = document.getElementById('login-success');
const projectSelect = document.getElementById('project-select');
const saveCheckpointBtn = document.getElementById('save-checkpoint-btn');
const statusMessage = document.getElementById('status-message');
const userEmail = document.getElementById('user-email');

// Initialize
async function init() {
  const token = await getAuthToken();
  
  if (token) {
    showMainView();
    loadProjects();
    loadUserEmail();
  } else {
    showLoginView();
  }
  
  setupEventListeners();
  setupStorageListeners();
}

function setupStorageListeners() {
  // Listen for changes to auth token
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.continuum_auth_token) {
        const newToken = changes.continuum_auth_token.newValue;
        if (newToken) {
          showMainView();
          loadProjects();
          loadUserEmail();
        } else {
          showLoginView();
        }
      }
      
      if (changes.active_project) {
        const newProject = changes.active_project.newValue;
        if (newProject) {
          updateProjectSelect(newProject);
        }
      }
    }
  });
}

function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);
  
  // Project selection
  projectSelect.addEventListener('change', handleProjectChange);
  
  // Save checkpoint
  saveCheckpointBtn.addEventListener('click', handleSaveCheckpoint);
  
  // Platform buttons
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', handlePlatformSwitch);
  });
}

// View Management
function showLoginView() {
  loginView.classList.remove('hidden');
  mainView.classList.add('hidden');
}

function showMainView() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
}

// Login Flow
async function handleLogin(e) {
  e.preventDefault();
  const email = emailInput.value;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (response.ok) {
      loginForm.classList.add('hidden');
      loginSuccess.classList.remove('hidden');
    } else {
      setStatus('Error signing in. Please try again.');
    }
  } catch (error) {
    setStatus('Error connecting to server.');
  }
}

// Main UI Logic
async function loadProjects() {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const projects = await response.json();
      
      // Clear existing options except first
      while (projectSelect.options.length > 1) {
        projectSelect.remove(1);
      }
      
      // Add project options
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
      });
      
      // Load active project
      const activeProject = await getActiveProject();
      if (activeProject) {
        projectSelect.value = activeProject.id;
      }
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

async function handleProjectChange(e) {
  const projectId = e.target.value;
  const projectName = e.target.options[e.target.selectedIndex].textContent;
  
  if (projectId) {
    await setActiveProject(projectId, projectName);
    setStatus(`Project: ${projectName}`);
  }
}

function updateProjectSelect(project) {
  projectSelect.value = project.id;
  setStatus(`Project: ${project.name}`);
}

async function handleSaveCheckpoint() {
  const projectId = projectSelect.value;
  
  if (!projectId) {
    setStatus('Please select a project first.');
    return;
  }
  
  saveCheckpointBtn.disabled = true;
  saveCheckpointBtn.textContent = 'Saving...';
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab');
    }
    
    // Send message to content script to get conversation
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CONVERSATION' });
    
    if (response && response.conversation) {
      const token = await getAuthToken();
      const apiResponse = await fetch(`${API_URL}/api/checkpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          platform: response.platform,
          raw_conversation_summary: response.conversation
        })
      });
      
      if (apiResponse.ok) {
        setStatus('Checkpoint saved!');
        setTimeout(() => setStatus(''), 2000);
      } else {
        setStatus('Error saving checkpoint.');
      }
    } else {
      setStatus('Could not read conversation. Make sure you\'re on a supported AI platform.');
    }
  } catch (error) {
    console.error('Failed to save checkpoint:', error);
    setStatus('Error saving checkpoint.');
  } finally {
    saveCheckpointBtn.disabled = false;
    saveCheckpointBtn.textContent = 'Save Checkpoint';
  }
}

async function handlePlatformSwitch(e) {
  const platform = e.currentTarget.getAttribute('data-platform');
  const projectId = projectSelect.value;
  
  if (!projectId) {
    setStatus('Please select a project first.');
    return;
  }
  
  setStatus('Generating handoff...');
  
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/handoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project_id: projectId,
        target_platform: platform
      })
    });
    
    if (response.ok) {
      const handoff = await response.json();
      
      // Store for auto-injection
      await chrome.storage.session.set({
        pending_handoff: {
          platform,
          projectId,
          handoffPackage: handoff.handoff_package
        }
      });
      
      // Open new tab
      chrome.tabs.create({ url: PLATFORM_URLS[platform] });
      setStatus('Opening ' + platform + '...');
    } else {
      setStatus('Error generating handoff.');
    }
  } catch (error) {
    console.error('Failed to generate handoff:', error);
    setStatus('Error generating handoff.');
  }
}

// Helper Functions
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['continuum_auth_token'], (result) => {
      resolve(result.continuum_auth_token || null);
    });
  });
}

async function getActiveProject() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['active_project'], (result) => {
      resolve(result.active_project || null);
    });
  });
}

async function setActiveProject(id, name) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ active_project: { id, name } }, () => {
      resolve();
    });
  });
}

async function loadUserEmail() {
  // For now, we'll just show a placeholder
  // In a real app, you'd fetch user info from the backend
  userEmail.textContent = 'user@example.com';
}

function setStatus(message) {
  statusMessage.textContent = message;
  if (message) {
    statusMessage.classList.remove('hidden');
  } else {
    statusMessage.classList.add('hidden');
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
