/**
 * Pyodide Web Worker with SharedArrayBuffer for Interactive Input
 * 
 * This worker runs Python code in isolation and handles interactive input()
 * by blocking with Atomics.wait() until the main thread provides input.
 * 
 * Protocol:
 * - Main thread sends: { type: 'INIT', sharedBuffer, textBuffer }
 * - Main thread sends: { type: 'RUN', code: string }
 * - Worker sends: { type: 'OUTPUT', text: string }
 * - Worker sends: { type: 'INPUT_REQUEST' } when waiting for input
 * - Worker sends: { type: 'READY' } when initialized
 * - Worker sends: { type: 'FINISHED' } when code execution completes
 * - Worker sends: { type: 'ERROR', message: string } on errors
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

async function initPyodide() {
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    // Configure stdout to send to main thread character by character
    pyodide.setStdout({
      batched: (text) => {
        self.postMessage({ type: 'OUTPUT', text: text + '\n' });
      }
    });
    
    pyodide.setStderr({
      batched: (text) => {
        self.postMessage({ type: 'OUTPUT', text: text + '\n' });
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
      // Clear previous globals for a fresh run
      await pyodide.runPythonAsync(`
import sys
# Clear user-defined variables
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['__builtins__', '__name__', '__doc__']:
        del globals()[name]
`);
      
      // Run the user's code
      await pyodide.runPythonAsync(code);
      
    } catch (err) {
      let errorMessage = err.message || String(err);
      
      // Make errors more user-friendly
      if (errorMessage.includes('EOFError')) {
        errorMessage = 'EOFError: Not enough input provided.\n💡 Type your input in the terminal and press Enter.';
      } else if (errorMessage.includes('KeyboardInterrupt')) {
        errorMessage = 'Program interrupted by user (Ctrl+C)';
      } else if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('No module named')) {
        const moduleName = errorMessage.match(/No module named '([^']+)'/)?.[1] || 'unknown';
        errorMessage = `ModuleNotFoundError: '${moduleName}'\n💡 This module is not available in the browser. Try using Python standard library modules.`;
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
