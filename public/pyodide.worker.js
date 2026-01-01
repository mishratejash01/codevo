/**
 * Pyodide Web Worker with Message-Based Interactive Input
 * 
 * This worker runs Python code in isolation and handles interactive input()
 * using an async message-based approach that works WITHOUT SharedArrayBuffer.
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let micropip = null;

// Message-based input queue (no SharedArrayBuffer needed)
let inputQueue = [];
let inputResolver = null;
let isWaitingForInput = false;

const CLEAR_GLOBALS_CODE = `
import sys
# Clear user-defined variables
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['__builtins__', '__name__', '__doc__']:
        del globals()[name]
`;

function extractMissingModuleName(message) {
  const msg = String(message || "");
  const patterns = [
    /The module\s+['"]([^'"]+)['"]\s+is included/,
    /No module named\s+['"]([^'"]+)['"]/,
    /No module named\s+([\w\.]+)/
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Async input function that waits for message from main thread
function getInputAsync() {
  return new Promise((resolve) => {
    if (inputQueue.length > 0) {
      resolve(inputQueue.shift());
    } else {
      isWaitingForInput = true;
      inputResolver = resolve;
      self.postMessage({ type: 'INPUT_REQUEST' });
    }
  });
}

async function initPyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    await pyodide.loadPackage("micropip");
    micropip = pyodide.pyimport("micropip");

    // Use RAW mode for character-by-character output
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

function setupMessageBasedStdin() {
  // Create a custom input function in Python that calls our async JS function
  pyodide.runPython(`
import sys
import js
from pyodide.ffi import to_js

# Store original input
_original_input = input

# Create async-compatible input replacement
def _custom_input(prompt=""):
    if prompt:
        print(prompt, end="", flush=True)
    # This will be replaced by our wrapper
    raise EOFError("Input requested")
  `);
}

async function runCodeWithAsyncInput(code) {
  // Wrap user code to handle input() calls
  const wrappedCode = `
import builtins
import sys

# Custom input that signals need for input
_input_values = []
_input_index = 0

def _async_input(prompt=""):
    global _input_index
    if prompt:
        print(prompt, end="", flush=True)
    if _input_index < len(_input_values):
        val = _input_values[_input_index]
        _input_index += 1
        return val
    raise EOFError("__NEED_INPUT__")

builtins.input = _async_input

${code}
`;
  
  try {
    await pyodide.runPythonAsync(wrappedCode);
    return { needsInput: false, error: null };
  } catch (err) {
    const errorMsg = err?.message ?? String(err);
    if (errorMsg.includes("__NEED_INPUT__")) {
      return { needsInput: true, error: null };
    }
    return { needsInput: false, error: errorMsg };
  }
}

self.onmessage = async (event) => {
  const { type, code, text } = event.data;
  
  if (type === 'INIT') {
    const success = await initPyodide();
    if (success) {
      self.postMessage({ type: 'READY' });
    }
  }
  
  if (type === 'INPUT_RESPONSE') {
    // Handle input from main thread
    if (inputResolver) {
      inputResolver(text);
      inputResolver = null;
      isWaitingForInput = false;
    } else {
      inputQueue.push(text);
    }
  }
  
  if (type === 'RUN') {
    if (!pyodide) {
      self.postMessage({ type: 'ERROR', message: 'Pyodide not initialized' });
      self.postMessage({ type: 'FINISHED' });
      return;
    }
    
    // Reset input state
    inputQueue = [];
    inputResolver = null;
    isWaitingForInput = false;
    
    try {
      await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
      
      // Set up input values from collected inputs
      await pyodide.runPythonAsync(`
_input_values = []
_input_index = 0
`);
      
      await pyodide.runPythonAsync(code);

    } catch (err) {
      const rawError = err?.message ?? String(err);
      let errorMessage = rawError;

      // Handle Missing Modules via Micropip
      const missingModule = extractMissingModuleName(errorMessage);
      if (missingModule) {
        const pkg = missingModule.split('.')[0];
        let packageLoaded = false;

        try {
          self.postMessage({ type: 'OUTPUT', text: `\n📦 Installing '${pkg}' via micropip...\n` });
          await micropip.install(pkg);
          packageLoaded = true;
          self.postMessage({ type: 'OUTPUT', text: `✅ Installed '${pkg}'. Retrying code...\n\n` });

          await pyodide.runPythonAsync(CLEAR_GLOBALS_CODE);
          await pyodide.runPythonAsync(code);
          self.postMessage({ type: 'FINISHED' });
          return;

        } catch (loadOrRetryErr) {
          if (packageLoaded) {
            errorMessage = loadOrRetryErr?.message ?? String(loadOrRetryErr);
          } else {
            errorMessage = `ModuleNotFoundError: '${pkg}'\n` +
              `💡 '${pkg}' failed to install.\n` +
              `Reason: It might require C-extensions or network sockets not supported in the browser.`;
          }
        }
      }

      // User-Friendly Error Formatting
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
    // Signal interrupt - will be caught on next Python operation
    isWaitingForInput = false;
    if (inputResolver) {
      inputResolver('');
      inputResolver = null;
    }
  }
};
