/**
 * Pyodide Web Worker with SharedArrayBuffer for Interactive Input
 * 
 * This worker runs Python code in isolation and handles interactive input()
 * by blocking with Atomics.wait() until the main thread provides input.
 * 
 * KEY FIX: Uses raw stdout mode for real-time character-by-character output
 * so that input() prompts appear BEFORE blocking for input.
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
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
  // Examples:
  // - "ModuleNotFoundError: No module named 'numpy'"
  // - "No module named numpy"
  // - "ModuleNotFoundError: numpy"
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
    
    // CRITICAL: Use RAW mode for character-by-character output
    // This ensures prompts like "Enter your name: " appear BEFORE input() blocks
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
        // Without SharedArrayBuffer, we can't block. Return empty string.
        return "";
      }
    });
    return;
  }
  
  pyodide.setStdin({
    stdin: () => {
      // Signal to main thread that we need input
      self.postMessage({ type: 'INPUT_REQUEST' });
      
      // Reset the status to waiting
      Atomics.store(sharedSignalArray, 0, STATUS_WAITING);
      
      // Block and wait for input (timeout after 5 minutes)
      const result = Atomics.wait(sharedSignalArray, 0, STATUS_WAITING, 300000);
      
      // Check the status
      const status = Atomics.load(sharedSignalArray, 0);
      
      if (status === STATUS_INTERRUPT) {
        throw new Error('KeyboardInterrupt');
      }
      
      if (result === 'timed-out') {
        throw new Error('EOFError: Input timeout - no input received within 5 minutes');
      }
      
      // Read the input length
      const length = Atomics.load(sharedSignalArray, 1);
      
      if (length <= 0) {
        return "";
      }
      
      // Read the text from the shared buffer
      const textBytes = sharedTextArray.slice(0, length);
      const text = new TextDecoder().decode(textBytes);
      
      return text;
    }
  });
}

self.onmessage = async (event) => {
  const { type, code, sharedBuffer, textBuffer } = event.data;
  
  if (type === 'INIT') {
    // Store the shared buffers
    if (sharedBuffer && textBuffer) {
      sharedSignalArray = new Int32Array(sharedBuffer);
      sharedTextArray = new Uint8Array(textBuffer);
    }
    
    // Initialize Pyodide
    const success = await initPyodide();
    
    if (success) {
      // Setup stdin with the shared buffers
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
      const runWithFreshGlobals = async () => {
        await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
        await pyodide.runPythonAsync(code);
      };

      await runWithFreshGlobals();

    } catch (err) {
      const rawError = err?.message ?? (typeof err?.toString === 'function' ? err.toString() : '') ?? String(err);
      let errorMessage = String(rawError || err || 'Unknown error');

      // If a module is missing, try to auto-load it from Pyodide's package repo
      const missingModule = extractMissingModuleName(errorMessage);
      if (missingModule) {
        const pkg = missingModule.split('.')[0];
        let packageLoaded = false;

        try {
          self.postMessage({ type: 'OUTPUT', text: `\nLoading Python package '${pkg}'...\n` });
          await pyodide.loadPackage(pkg);
          packageLoaded = true;

          // Retry after loading
          await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
          await pyodide.runPythonAsync(code);
          return;
        } catch (loadOrRetryErr) {
          // If load succeeded but the retry failed, show the retry error instead
          if (packageLoaded) {
            errorMessage = loadOrRetryErr?.message ?? String(loadOrRetryErr);
          } else {
            const details = loadOrRetryErr?.message ? `\nDetails: ${loadOrRetryErr.message}` : '';
            errorMessage = `ModuleNotFoundError: '${pkg}'\n` +
              `💡 '${pkg}' couldn't be loaded in this browser-based Python environment.${details}\n` +
              `Tip: Only Pyodide-supported packages can be used here.`;
          }
        }
      }

      // Make errors more user-friendly
      if (errorMessage.includes('EOFError')) {
        errorMessage = 'EOFError: Not enough input provided.\n💡 Type your input in the terminal and press Enter.';
      } else if (errorMessage.includes('KeyboardInterrupt')) {
        errorMessage = 'Program interrupted by user (Ctrl+C)';
      } else if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('No module named')) {
        const moduleName = extractMissingModuleName(errorMessage);
        if (moduleName) {
          const pkg = moduleName.split('.')[0];
          errorMessage = `ModuleNotFoundError: '${pkg}'\n` +
            `💡 This package isn't available here (or failed to download).\n` +
            `Tip: Browser Python supports only Pyodide packages.`;
        } else {
          // If we can't parse the module name, show the raw traceback for debugging.
          errorMessage = String(rawError || errorMessage) +
            `\n\n💡 Could not detect which package is missing. Please re-run and share the full traceback above.`;
        }
      }

      self.postMessage({ type: 'OUTPUT', text: '\n' + errorMessage + '\n' });
    } finally {
      self.postMessage({ type: 'FINISHED' });
    }
  }
  
  if (type === 'INTERRUPT') {
    // Signal interrupt to the waiting stdin
    if (sharedSignalArray) {
      Atomics.store(sharedSignalArray, 0, STATUS_INTERRUPT);
      Atomics.notify(sharedSignalArray, 0, 1);
    }
  }
};
