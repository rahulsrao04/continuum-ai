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

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['continuum_auth_token'], (result) => {
      resolve(result.continuum_auth_token || null);
    });
  });
}

async function setAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ continuum_auth_token: token }, () => {
      resolve();
    });
  });
}

async function clearAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['continuum_auth_token'], () => {
      resolve();
    });
  });
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || { autoSave: true, showIndicator: true });
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => {
      resolve();
    });
  });
}
