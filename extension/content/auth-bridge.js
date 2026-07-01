// Receives auth token from the frontend extension-bridge page and stores it in the extension
(function () {
  if (!window.location.pathname.includes('/auth/extension-bridge')) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return;

  chrome.runtime.sendMessage({ type: 'STORE_AUTH_TOKEN', token }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Continuum: could not store auth token', chrome.runtime.lastError.message);
      return;
    }
    window.dispatchEvent(new CustomEvent('continuum-auth-connected'));
  });
})();
