/**
 * Pyodide Web Worker with SharedArrayBuffer for Interactive Input
 * * This worker runs Python code in isolation and handles interactive input()
 * by blocking with Atomics.wait() until the main thread provides input.
 * * KEY FIX: Uses 'micropip' to install libraries (both PyPI and Pyodide standard libs).
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let micropip = null;
let sharedSignalArray = null; // Int32Array for signaling
let sharedTextArray = null;   // Uint8Array for text data

// Buffer layout:
// sharedSignalArray[0] = status: 0 = waiting, 1 = input ready, -1 = interrupt
// sharedSignalArray[1] = input length

const STATUS_WAITING = 0;
const STATUS_INPUT_READY = 1;
const STATUS_INTERRUPT = -1;

const CLEAR_GLOBALS_CODE = `
import sys
# Clear user-defined variables
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['__builtins__', '__name__', '__doc__']:
        del globals()[name]
`;

function extractMissingModuleName(message) {
  const msg = String(message || "");

  // Common Pyodide traceback includes the module name somewhere in the text.
  const patterns = [
    /ModuleNotFoundError:\s*No module named ['\"]([^'\"\s]+)['\"]/,
    /No module named ['\"]([^'\"\s]+)['\"]/,
    /No module named\s+([A-Za-z0-9_\.]+)/,
    /ModuleNotFoundError:\s*['\"]?([^'\"\s]+)['\"]?/,
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function initPyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    // --- NEW: Load Micropip immediately ---
    await pyodide.loadPackage("micropip");
    micropip = pyodide.pyimport("micropip");

    // CRITICAL: Use RAW mode for character-by-character output
    pyodide.setStdout({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    });
    
    pyodide.setStderr({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    });
    
    return true;
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: 'Failed to load Pyodide: ' + err.message });
    return false;
  }
}

function setupInteractiveStdin() {
  if (!sharedSignalArray || !sharedTextArray) {
    // Fallback: No SharedArrayBuffer available
    pyodide.setStdin({
      stdin: () => {
        self.postMessage({ type: 'INPUT_REQUEST' });
        return "";
      }
    });
    return;
  }
  
  pyodide.setStdin({
    stdin: () => {
      self.postMessage({ type: 'INPUT_REQUEST' });
      Atomics.store(sharedSignalArray, 0, STATUS_WAITING);
      const result = Atomics.wait(sharedSignalArray, 0, STATUS_WAITING, 300000);
      
      const status = Atomics.load(sharedSignalArray, 0);
      if (status === STATUS_INTERRUPT) {
        throw new Error('KeyboardInterrupt');
      }
      if (result === 'timed-out') {
        throw new Error('EOFError: Input timeout - no input received within 5 minutes');
      }
      
      const length = Atomics.load(sharedSignalArray, 1);
      if (length <= 0) return "";
      
      const textBytes = sharedTextArray.slice(0, length);
      return new TextDecoder().decode(textBytes);
    }
  });
}

self.onmessage = async (event) => {
  const { type, code, sharedBuffer, textBuffer } = event.data;
  
  if (type === 'INIT') {
    if (sharedBuffer && textBuffer) {
      sharedSignalArray = new Int32Array(sharedBuffer);
      sharedTextArray = new Uint8Array(textBuffer);
    }
    const success = await initPyodide();
    if (success) {
      setupInteractiveStdin();
      self.postMessage({ type: 'READY' });
    }
  }
  
  if (type === 'RUN') {
    if (!pyodide) {
      self.postMessage({ type: 'ERROR', message: 'Pyodide not initialized' });
      self.postMessage({ type: 'FINISHED' });
      return;
    }
    
    try {
      // 1. Clear globals and run user code
      await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
      await pyodide.runPythonAsync(code);

    } catch (err) {
      const rawError = err?.message ?? String(err);
      let errorMessage = rawError;

      // 2. Handle Missing Modules via Micropip
      const missingModule = extractMissingModuleName(errorMessage);
      if (missingModule) {
        const pkg = missingModule.split('.')[0];
        let packageLoaded = false;

        try {
          self.postMessage({ type: 'OUTPUT', text: `\n📦 Installing '${pkg}' via micropip...\n` });
          
          // Micropip is smart: it checks PyPI AND Pyodide's internal repo
          await micropip.install(pkg);
          
          packageLoaded = true;
          self.postMessage({ type: 'OUTPUT', text: `✅ Installed '${pkg}'. Retrying code...\n\n` });

          // Retry execution
          await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
          await pyodide.runPythonAsync(code);
          return; // Success on retry, exit the error handler

        } catch (loadOrRetryErr) {
          if (packageLoaded) {
            // If install worked but code still failed, show the new error
            errorMessage = loadOrRetryErr?.message ?? String(loadOrRetryErr);
          } else {
            // Install failed (likely C-extension not supported in browser)
            errorMessage = `ModuleNotFoundError: '${pkg}'\n` +
              `💡 '${pkg}' failed to install.\n` +
              `Reason: It might require C-extensions or network sockets not supported in the browser.`;
          }
        }
      }

      // 3. User-Friendly Error Formatting
      if (errorMessage.includes('EOFError')) {
        errorMessage = 'EOFError: Input required.\n💡 Type your input in the terminal and press Enter.';
      } else if (errorMessage.includes('KeyboardInterrupt')) {
        errorMessage = 'Program interrupted (Ctrl+C)';
      }

      self.postMessage({ type: 'OUTPUT', text: '\n' + errorMessage + '\n' });
    } finally {
      self.postMessage({ type: 'FINISHED' });
    }
  }
  
  if (type === 'INTERRUPT') {
    if (sharedSignalArray) {
      Atomics.store(sharedSignalArray, 0, STATUS_INTERRUPT);
      Atomics.notify(sharedSignalArray, 0, 1);
    }
  }
};
