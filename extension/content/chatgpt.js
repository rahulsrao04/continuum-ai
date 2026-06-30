const PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.com',
  perplexity: 'https://www.perplexity.ai'
};

// SECTION 1: Conversation Reader
function readConversation() {
  const messages = [];
  
  // ChatGPT's conversation structure - multiple fallback selectors
  const selectors = [
    '[data-message-author-role]',
    '[data-testid*="message"]',
    '.text-base',
    '[class*="message-content"]',
    'article',
    '[class*="prose"]'
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
    const role = el.getAttribute('data-message-author-role');
    const text = el.textContent?.trim();
    
    if (text && text.length > 10) {
      if (role === 'user') {
        messages.push(`Human: ${text}`);
      } else if (role === 'assistant') {
        messages.push(`ChatGPT: ${text}`);
      } else {
        // Fallback: check for common patterns
        if (el.closest('[class*="user"]') || el.closest('[data-testid*="user"]')) {
          messages.push(`Human: ${text}`);
        } else if (el.closest('[class*="assistant"]') || el.closest('[data-testid*="assistant"]')) {
          messages.push(`ChatGPT: ${text}`);
        } else {
          // Default to ChatGPT if we can't determine
          messages.push(`ChatGPT: ${text}`);
        }
      }
    }
  });
  
  return messages.join('\n\n');
}

// SECTION 2: Limit Detection
function detectLimit() {
  const limitPhrases = [
    "You've reached your limit",
    "GPT-4 limit",
    "rate limit",
    "usage limit",
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
        platform: 'chatgpt',
        projectId: activeProject.id,
        conversationText: conversation
      }
    });
    
    showLimitPopup();
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
            platform: 'chatgpt',
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
          ChatGPT has reached its limit
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
          <button data-platform="claude" style="
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
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #CC785C;"></div>
            Claude
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

// SECTION 4: Auto-injection
async function checkPendingHandoff() {
  const pendingHandoff = await chrome.storage.session.get('pending_handoff');
  
  if (pendingHandoff && pendingHandoff.pending_handoff) {
    const { platform, handoffPackage } = pendingHandoff.pending_handoff;
    
    if (platform === 'chatgpt' && handoffPackage) {
      try {
        // Try multiple selectors for the input box
        const selectors = [
          '#prompt-textarea',
          '[data-id="root"] textarea',
          'form textarea',
          '[role="textbox"]',
          'textarea'
        ];
        
        let input = null;
        for (const selector of selectors) {
          try {
            input = await waitForElement(selector, 5000);
            if (input) break;
          } catch (e) {
            continue;
          }
        }
        
        if (input) {
          // Try React synthetic event approach first
          let injected = false;
          
          try {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 
              'value'
            ).set;
            nativeInputValueSetter.call(input, handoffPackage);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Verify the value was set
            if (input.value === handoffPackage || input.textContent === handoffPackage) {
              injected = true;
            }
          } catch (e) {
            console.log('React synthetic event approach failed:', e);
          }
          
          // Fall back to clipboard paste simulation
          if (!injected) {
            try {
              await navigator.clipboard.writeText(handoffPackage);
              input.focus();
              document.execCommand('paste');
              injected = true;
            } catch (e) {
              console.log('Clipboard paste approach failed:', e);
            }
          }
          
          // Final fallback: direct value setting
          if (!injected) {
            input.value = handoffPackage;
            input.textContent = handoffPackage;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          // Wait 1 second for React to process the input
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try multiple selectors for send button
          const sendSelectors = [
            'button[data-testid="send-button"]',
            'button[aria-label="Send message"]',
            'button[aria-label*="Send"]',
            'button[type="submit"]'
          ];
          
          let sendButton = null;
          for (const selector of sendSelectors) {
            try {
              sendButton = await waitForElement(selector, 3000);
              if (sendButton && !sendButton.disabled) break;
            } catch (e) {
              continue;
            }
          }
          
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          } else if (sendButton) {
            // Wait for button to become enabled
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!sendButton.disabled) {
              sendButton.click();
            }
          }
          
          chrome.storage.session.remove('pending_handoff');
        }
      } catch (error) {
        console.error('Failed to inject handoff:', error);
      }
    }
  }
}

// SECTION 5: waitForElement helper
async function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout'));
    }, timeout);
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
  checkPendingHandoff();
  
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
        platform: 'chatgpt'
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
