const PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.com',
  perplexity: 'https://www.perplexity.ai'
};

// SECTION 1: Conversation Reader
function readConversation() {
  const messages = [];
  
  // Claude's conversation structure - multiple fallback selectors
  const selectors = [
    '[data-testid="message-content"]',
    '[role="main"] div[class*="message"]',
    '[data-message-author-role]',
    '.font-claude-message',
    '[class*="prose"]',
    'article',
    '.markdown'
  ];
  
  let messageElements = [];
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      messageElements = Array.from(elements);
      break;
    }
  }
  
  // If no specific elements found, try broader search
  if (messageElements.length === 0) {
    messageElements = Array.from(document.querySelectorAll('div')).filter(el => {
      const text = el.textContent?.trim();
      return text && text.length > 20 && text.length < 10000;
    });
  }
  
  messageElements.forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 10) {
      // Try to determine if it's human or assistant based on context
      const parent = el.closest('[data-message-author-role]');
      if (parent) {
        const role = parent.getAttribute('data-message-author-role');
        if (role === 'user') {
          messages.push(`Human: ${text}`);
        } else if (role === 'assistant') {
          messages.push(`Claude: ${text}`);
        }
      } else {
        // Fallback: check for common patterns
        if (el.closest('[class*="user"]') || el.closest('[data-testid*="user"]')) {
          messages.push(`Human: ${text}`);
        } else if (el.closest('[class*="assistant"]') || el.closest('[data-testid*="assistant"]')) {
          messages.push(`Claude: ${text}`);
        } else {
          // Default to Claude if we can't determine
          messages.push(`Claude: ${text}`);
        }
      }
    }
  });
  
  return messages.join('\n\n');
}

// SECTION 2: Limit Detection
function detectLimit() {
  const limitPhrases = [
    "You've reached your usage limit",
    "message limit",
    "usage limit",
    "rate limit",
    "limit reached"
  ];
  
  const bodyText = document.body.textContent?.toLowerCase() || '';
  return limitPhrases.some(phrase => bodyText.includes(phrase.toLowerCase()));
}

function startLimitDetection() {
  const observer = new MutationObserver(() => {
    if (detectLimit()) {
      handleLimitDetected();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

async function handleLimitDetected() {
  const conversation = readConversation();
  const activeProject = await getActiveProject();
  
  if (activeProject) {
    chrome.runtime.sendMessage({
      type: 'LIMIT_DETECTED',
      payload: {
        platform: 'claude',
        projectId: activeProject.id,
        conversationText: conversation
      }
    });
    
    showLimitPopup();
  } else {
    showNoProjectPopup();
  }
}

// SECTION 3: Continuum Indicator
function injectIndicator() {
  if (document.getElementById('continuum-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'continuum-indicator';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #6C63FF;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      C∞ Active
    </div>
  `;
  
  indicator.addEventListener('click', showMiniPanel);
  document.body.appendChild(indicator);
}

function showMiniPanel() {
  const existingPanel = document.getElementById('continuum-mini-panel');
  if (existingPanel) {
    existingPanel.remove();
    return;
  }
  
  getActiveProject().then(project => {
    const panel = document.createElement('div');
    panel.id = 'continuum-mini-panel';
    panel.innerHTML = `
      <div style="
        position: fixed;
        bottom: 60px;
        right: 20px;
        background: #12121A;
        border: 1px solid #1E1E2E;
        border-radius: 12px;
        padding: 16px;
        width: 280px;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="color: #F0F0FF; font-weight: 600; margin-bottom: 12px;">
          ${project ? project.name : 'No project selected'}
        </div>
        <button id="continuum-save-btn" style="
          width: 100%;
          background: #6C63FF;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 8px;
        ">
          Save Checkpoint
        </button>
        <button id="continuum-switch-btn" style="
          width: 100%;
          background: transparent;
          color: #F0F0FF;
          border: 1px solid #1E1E2E;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Switch AI
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('continuum-save-btn').addEventListener('click', async () => {
      const btn = document.getElementById('continuum-save-btn');
      btn.textContent = 'Saving...';
      
      const conversation = readConversation();
      if (project) {
        chrome.runtime.sendMessage({
          type: 'SAVE_CHECKPOINT',
          payload: {
            platform: 'claude',
            projectId: project.id,
            conversationText: conversation
          }
        });
        
        btn.textContent = 'Saved!';
        setTimeout(() => {
          btn.textContent = 'Save Checkpoint';
          panel.remove();
        }, 1500);
      }
    });
    
    document.getElementById('continuum-switch-btn').addEventListener('click', () => {
      panel.remove();
      showLimitPopup();
    });
  });
}

// SECTION 4: Limit Popup
function showLimitPopup() {
  const existingPopup = document.getElementById('continuum-limit-popup');
  if (existingPopup) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'continuum-limit-popup';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: #12121A;
        border: 1px solid #1E1E2E;
        border-radius: 16px;
        padding: 32px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      ">
        <h2 style="
          color: #F0F0FF;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          Claude has reached its limit
        </h2>
        <p style="
          color: #8888AA;
          margin-bottom: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          Continue your project on:
        </p>
        <div id="platform-buttons" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        ">
          <button data-platform="chatgpt" style="
            background: #0A0A0F;
            border: 1px solid #1E1E2E;
            color: #F0F0FF;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            transition: all 0.2s;
          ">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #10A37F;"></div>
            ChatGPT
          </button>
          <button data-platform="gemini" style="
            background: #0A0A0F;
            border: 1px solid #1E1E2E;
            color: #F0F0FF;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            transition: all 0.2s;
          ">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #4285F4;"></div>
            Gemini
          </button>
          <button data-platform="grok" style="
            background: #0A0A0F;
            border: 1px solid #1E1E2E;
            color: #F0F0FF;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            transition: all 0.2s;
          ">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #FFFFFF;"></div>
            Grok
          </button>
          <button data-platform="perplexity" style="
            background: #0A0A0F;
            border: 1px solid #1E1E2E;
            color: #F0F0FF;
            padding: 16px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            transition: all 0.2s;
          ">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #20B2AA;"></div>
            Perplexity
          </button>
        </div>
        <div id="loading-state" style="
          display: none;
          text-align: center;
          padding: 24px;
          color: #8888AA;
        ">
          Preparing your context...
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Add hover effects
  overlay.querySelectorAll('button[data-platform]').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = '#00D4FF';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = '#1E1E2E';
    });
  });
  
  // Handle platform selection
  overlay.querySelectorAll('button[data-platform]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const platform = btn.getAttribute('data-platform');
      const buttonsContainer = document.getElementById('platform-buttons');
      const loadingState = document.getElementById('loading-state');
      
      buttonsContainer.style.display = 'none';
      loadingState.style.display = 'block';
      
      const activeProject = await getActiveProject();
      if (activeProject) {
        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_HANDOFF',
          payload: {
            projectId: activeProject.id,
            targetPlatform: platform
          }
        });
        
        if (response.success) {
          chrome.storage.session.set({
            pending_handoff: {
              platform,
              projectId: activeProject.id,
              handoffPackage: response.handoff.handoff_package
            }
          });
          
          chrome.tabs.create({ url: PLATFORM_URLS[platform] });
          overlay.remove();
        } else {
          loadingState.textContent = 'Error: ' + response.error;
          setTimeout(() => {
            buttonsContainer.style.display = 'grid';
            loadingState.style.display = 'none';
          }, 2000);
        }
      }
    });
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

function showNoProjectPopup() {
  const existingPopup = document.getElementById('continuum-no-project-popup');
  if (existingPopup) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'continuum-no-project-popup';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: #12121A;
        border: 1px solid #1E1E2E;
        border-radius: 16px;
        padding: 32px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      ">
        <h2 style="
          color: #F0F0FF;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          No Project Selected
        </h2>
        <p style="
          color: #8888AA;
          margin-bottom: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          To save your conversation and continue on another AI, you need to select or create a project first.
        </p>
        <button id="open-extension-popup" style="
          width: 100%;
          background: #6C63FF;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        ">
          Open Continuum Extension
        </button>
        <button id="close-popup" style="
          width: 100%;
          background: transparent;
          color: #8888AA;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
          transition: all 0.2s;
        ">
          Cancel
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Add hover effect
  document.getElementById('open-extension-popup').addEventListener('mouseenter', () => {
    document.getElementById('open-extension-popup').style.background = '#5a52e6';
  });
  document.getElementById('open-extension-popup').addEventListener('mouseleave', () => {
    document.getElementById('open-extension-popup').style.background = '#6C63FF';
  });
  
  // Handle open extension popup
  document.getElementById('open-extension-popup').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_EXTENSION_POPUP' });
    overlay.remove();
  });
  
  // Handle close
  document.getElementById('close-popup').addEventListener('click', () => {
    overlay.remove();
  });
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// Helper functions
async function getActiveProject() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['active_project'], (result) => {
      resolve(result.active_project || null);
    });
  });
}

// Initialize
function init() {
  injectIndicator();
  startLimitDetection();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CHECKPOINT_SAVED') {
      const indicator = document.getElementById('continuum-indicator');
      if (indicator) {
        indicator.style.background = '#10A37F';
        setTimeout(() => {
          indicator.style.background = '#6C63FF';
        }, 2000);
      }
    } else if (message.type === 'GET_CONVERSATION') {
      const conversation = readConversation();
      return Promise.resolve({
        conversation,
        platform: 'claude'
      });
    }
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
