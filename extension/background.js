importScripts('config.js');

const API_URL = CONTINUUM_CONFIG.API_URL;
const FRONTEND_URL = CONTINUUM_CONFIG.FRONTEND_URL;
const PLATFORM_URLS = {
  claude: 'https://claude.ai',
  chatgpt: 'https://chat.openai.com',
  // chatgpt.com redirects to chat.openai.com but match both in URL checks
  gemini: 'https://gemini.google.com',
  grok: 'https://grok.x.com',
  perplexity: 'https://www.perplexity.ai'
};

// Platforms with content scripts that handle their own injection
const CONTENT_SCRIPT_PLATFORMS = new Set(['claude', 'chatgpt']);

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

  const checkpoint = await response.json();
  chrome.storage.local.set({
    last_checkpoint: {
      projectId,
      platform,
      checkpointId: checkpoint.id,
      savedAt: new Date().toISOString(),
    },
  });
  return checkpoint;
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

function matchPlatformFromUrl(url) {
  if (!url) return null;
  if (url.includes('claude.ai')) return 'claude';
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) return 'chatgpt';
  for (const [key, platformUrl] of Object.entries(PLATFORM_URLS)) {
    if (url.includes(platformUrl.replace('https://', ''))) return key;
  }
  return null;
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
    handleSaveCheckpoint(message.payload, sender.tab).then(sendResponse);
    return true;
  } else if (message.type === 'INJECT_HANDOFF') {
    handleInjectHandoff(message.payload);
  } else if (message.type === 'GENERATE_HANDOFF') {
    handleGenerateHandoff(message.payload).then(sendResponse);
    return true;
  } else if (message.type === 'OPEN_PLATFORM_WITH_HANDOFF') {
    handleOpenPlatformWithHandoff(message.payload).then(sendResponse);
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
    const checkpoint = await createCheckpoint(projectId, platform, conversationText);
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'CHECKPOINT_SAVED' });
    }
    return { success: true, checkpoint };
  } catch (error) {
    showErrorBadge();
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'CHECKPOINT_ERROR',
        error: error.message
      });
    }
    return { success: false, error: error.message };
  }
}

async function handleOpenPlatformWithHandoff(payload) {
  const { platform, projectId, handoffPackage, targetPlatform } = payload;
  const destPlatform = targetPlatform || platform;

  await chrome.storage.session.set({
    pending_handoff: {
      platform: destPlatform,
      projectId,
      handoffPackage,
    },
  });

  const url = PLATFORM_URLS[destPlatform];
  if (!url) {
    return { success: false, error: `Unknown platform: ${destPlatform}` };
  }

  chrome.tabs.create({ url });
  return { success: true };
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
  const selectors = [
    '#prompt-textarea',
    'textarea',
    '[role="textbox"]',
    'div[contenteditable="true"]',
  ];
  let input = null;
  for (const sel of selectors) {
    input = document.querySelector(sel);
    if (input) break;
  }
  if (!input) return;

  if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;
    if (setter) setter.call(input, handoffText);
    else input.value = handoffText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    input.textContent = handoffText;
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  setTimeout(() => {
    const sendBtn = document.querySelector(
      'button[data-testid="send-button"], button[aria-label*="Send"], button[type="submit"]'
    );
    if (sendBtn && !sendBtn.disabled) sendBtn.click();
  }, 1000);
}

// Fallback injection for platforms without content scripts (gemini, grok, perplexity)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const result = await chrome.storage.session.get('pending_handoff');
  const pending = result.pending_handoff;
  if (!pending?.handoffPackage) return;

  const currentPlatform = matchPlatformFromUrl(tab.url);
  if (!currentPlatform || CONTENT_SCRIPT_PLATFORMS.has(currentPlatform)) return;
  if (pending.platform !== currentPlatform) return;

  try {
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId },
        func: injectHandoffText,
        args: [pending.handoffPackage],
      });
    }, 2500);
    chrome.storage.session.remove('pending_handoff');
  } catch (error) {
    console.error('Failed to inject handoff:', error);
  }
});
