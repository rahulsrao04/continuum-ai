const API_URL = 'PRODUCTION_API_URL'; // Replace with actual Render URL after deployment
const PLATFORM_URLS = {
  chatgpt: 'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.com',
  perplexity: 'https://www.perplexity.ai'
};

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['continuum_auth_token'], (result) => {
      resolve(result.continuum_auth_token || null);
    });
  });
}

async function createCheckpoint(projectId, platform, rawConversationSummary) {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/api/checkpoints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_id: projectId,
      platform: platform,
      raw_conversation_summary: rawConversationSummary,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create checkpoint');
  }

  return response.json();
}

async function generateHandoff(projectId, targetPlatform) {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/api/handoff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_id: projectId,
      target_platform: targetPlatform,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to generate handoff');
  }

  return response.json();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    settings: { autoSave: true, showIndicator: true }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LIMIT_DETECTED') {
    handleLimitDetected(message.payload, sender.tab);
  } else if (message.type === 'SAVE_CHECKPOINT') {
    handleSaveCheckpoint(message.payload, sender.tab);
  } else if (message.type === 'INJECT_HANDOFF') {
    handleInjectHandoff(message.payload);
  } else if (message.type === 'GENERATE_HANDOFF') {
    handleGenerateHandoff(message.payload).then(sendResponse);
    return true;
  } else if (message.type === 'STORE_AUTH_TOKEN') {
    handleStoreAuthToken(message.token);
    sendResponse({ success: true });
  }
  return true;
});

async function handleLimitDetected(payload, tab) {
  const { platform, projectId, conversationText } = payload;
  
  chrome.storage.session.set({ 
    pending_handoff: { 
      platform, 
      projectId, 
      conversationText 
    } 
  });

  chrome.runtime.sendMessage({ type: 'SHOW_PLATFORM_SELECTOR' });
}

async function handleSaveCheckpoint(payload, tab) {
  const { platform, projectId, conversationText } = payload;
  
  try {
    await createCheckpoint(projectId, platform, conversationText);
    chrome.tabs.sendMessage(tab.id, { type: 'CHECKPOINT_SAVED' });
  } catch (error) {
    showErrorBadge();
    chrome.tabs.sendMessage(tab.id, { 
      type: 'CHECKPOINT_ERROR', 
      error: error.message 
    });
  }
}

async function handleInjectHandoff(payload) {
  const { tabId, handoffText } = payload;
  
  chrome.scripting.executeScript({
    target: { tabId },
    func: injectHandoffText,
    args: [handoffText]
  });
}

async function handleGenerateHandoff(payload) {
  const { projectId, targetPlatform } = payload;
  try {
    const handoff = await generateHandoff(projectId, targetPlatform);
    return { success: true, handoff };
  } catch (error) {
    showErrorBadge();
    return { success: false, error: error.message };
  }
}

async function handleStoreAuthToken(token) {
  chrome.storage.local.set({ continuum_auth_token: token });
  clearErrorBadge();
}

function showErrorBadge() {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF4444' });
  chrome.storage.local.set({ last_error: new Date().toISOString() });
}

function clearErrorBadge() {
  chrome.action.setBadgeText({ text: '' });
  chrome.storage.local.remove(['last_error']);
}

function injectHandoffText(handoffText) {
  const input = document.querySelector('[role="textbox"], textarea, div[contenteditable="true"]');
  if (input) {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 
        'value'
      ).set;
      nativeInputValueSetter.call(input, handoffText);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      input.textContent = handoffText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const pendingHandoff = await chrome.storage.session.get('pending_handoff');
    
    if (pendingHandoff && pendingHandoff.pending_handoff) {
      const { platform, projectId, conversationText } = pendingHandoff.pending_handoff;
      
      const currentPlatform = Object.keys(PLATFORM_URLS).find(
        key => tab.url.includes(PLATFORM_URLS[key])
      );

      if (currentPlatform) {
        try {
          const handoff = await generateHandoff(projectId, currentPlatform);
          
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId },
              func: injectHandoffText,
              args: [handoff.handoff_package]
            });
          }, 2000);

          chrome.storage.session.remove('pending_handoff');
        } catch (error) {
          console.error('Failed to generate handoff:', error);
        }
      }
    }
  }
});
