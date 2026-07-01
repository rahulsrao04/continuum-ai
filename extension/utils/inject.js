// Shared handoff injection utilities for content scripts

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
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

async function findChatInput() {
  const selectors = [
    '#prompt-textarea',
    'textarea[data-id="root"]',
    'div[contenteditable="true"][data-placeholder]',
    'div.ProseMirror[contenteditable="true"]',
    '[data-testid="chat-input"] textarea',
    '[data-testid="chat-input"] [contenteditable="true"]',
    'form textarea',
    '[role="textbox"]',
    'textarea',
    'div[contenteditable="true"]',
  ];

  for (const selector of selectors) {
    try {
      const el = await waitForElement(selector, 4000);
      if (el) return el;
    } catch {
      continue;
    }
  }
  return null;
}

async function setInputValue(input, text) {
  input.focus();

  if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
    const proto = input.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(input, text);
    } else {
      input.value = text;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (input.value === text) return true;
  }

  if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
    input.textContent = text;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    if (input.textContent.includes(text.substring(0, 50))) return true;
  }

  try {
    await navigator.clipboard.writeText(text);
    input.focus();
    document.execCommand('paste');
    return true;
  } catch {
    return false;
  }
}

async function clickSendButton() {
  const sendSelectors = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send message"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button[data-testid="composer-send-button"]',
    'button[type="submit"]',
  ];

  for (const selector of sendSelectors) {
    try {
      const btn = await waitForElement(selector, 3000);
      if (btn) {
        if (btn.disabled) {
          await new Promise((r) => setTimeout(r, 800));
        }
        if (!btn.disabled) {
          btn.click();
          return true;
        }
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function injectAndSubmitHandoff(handoffPackage) {
  const input = await findChatInput();
  if (!input) {
    throw new Error('Could not find chat input');
  }

  await setInputValue(input, handoffPackage);
  await new Promise((r) => setTimeout(r, 1000));
  await clickSendButton();
  return true;
}
