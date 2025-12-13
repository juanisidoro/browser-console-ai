// Injected into main world - hooks real console
(function() {
  if (window.__browserConsoleAI_injected) return;
  window.__browserConsoleAI_injected = true;

  const LOG_TYPES = ['log', 'warn', 'error', 'info', 'debug'];
  const originalConsole = {};

  LOG_TYPES.forEach(type => {
    originalConsole[type] = console[type].bind(console);
  });

  function serializeArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);

    if (arg instanceof Error) {
      return arg.name + ': ' + arg.message + (arg.stack ? '\n' + arg.stack : '');
    }

    if (typeof arg === 'function') {
      return '[Function: ' + (arg.name || 'anonymous') + ']';
    }

    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }

  function getSource() {
    try {
      const stack = new Error().stack;
      if (!stack) return null;

      const lines = stack.split('\n');
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('chrome-extension://')) continue;
        if (line.includes('extensions::')) continue;
        if (line.includes('injected.js')) continue;

        const match = line.match(/(?:at\s+)?(?:.*?\s+\()?(.+?):(\d+)(?::\d+)?\)?$/);
        if (match) {
          let file = match[1];
          const lineNum = match[2];
          file = file.replace(/^webpack-internal:\/\/\//, '');
          file = file.replace(/^webpack:\/\/\//, '');
          const parts = file.split('/');
          return parts[parts.length - 1] + ':' + lineNum;
        }
      }
    } catch (e) {}
    return null;
  }

  function sendLog(type, args) {
    const log = {
      type: type,
      args: Array.from(args).map(serializeArg),
      timestamp: Date.now(),
      url: window.location.href,
      source: getSource()
    };

    window.dispatchEvent(new CustomEvent('__browserConsoleAI_log', {
      detail: log
    }));
  }

  LOG_TYPES.forEach(type => {
    console[type] = function() {
      originalConsole[type].apply(console, arguments);
      sendLog(type, arguments);
    };
  });

  window.addEventListener('error', function(event) {
    sendLog('error', ['Uncaught ' + (event.error || event.message)]);
  });

  window.addEventListener('unhandledrejection', function(event) {
    sendLog('error', ['Unhandled Promise Rejection: ' + event.reason]);
  });

})();
