// Console Capture - Content Script
// Bridge between main world and background service worker

(function() {
  'use strict';

  if (window.__browserConsoleAI_bridge) return;
  window.__browserConsoleAI_bridge = true;

  // Listen for logs from the injected script (main world)
  window.addEventListener('__browserConsoleAI_log', function(event) {
    const log = event.detail;

    try {
      chrome.runtime.sendMessage({
        action: 'LOG_CAPTURED',
        log: log
      });
    } catch (e) {
      // Extension context invalidated
    }
  });

  // Notify background that we're ready for injection
  chrome.runtime.sendMessage({ action: 'CONTENT_READY' });

})();
