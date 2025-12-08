// public/pyodide.worker.js
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let pythonInputBuffer = null; // Shared buffer for stdin

async function loadPyodideAndPackages() {
  pyodide = await loadPyodide();
  // Redirect stdout/stderr to postMessage
  pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
  pyodide.setStderr({ batched: (msg) => self.postMessage({ type: 'OUTPUT', text: msg + "\n" }) });
}

self.onmessage = async (event) => {
  const { type, code, inputBuffer } = event.data;

  if (type === 'INIT') {
    await loadPyodideAndPackages();
    // Store the shared buffer
    pythonInputBuffer = new Int32Array(inputBuffer);
    
    // Register the custom stdin handler
    pyodide.setStdin({
      stdin: () => {
        // 1. Notify Main thread we are waiting for input
        self.postMessage({ type: 'INPUT_REQUEST' });
        
        // 2. BLOCK here using Atomics.wait until Main thread wakes us
        // Index 0: 0 = waiting, 1 = ready
        Atomics.wait(pythonInputBuffer, 0, 0); 
        
        // 3. Read the character code put in index 1
        const charCode = pythonInputBuffer[1];
        
        // 4. Reset wait flag for next char
        Atomics.store(pythonInputBuffer, 0, 0); 
        
        return String.fromCharCode(charCode);
      }
    });
    self.postMessage({ type: 'READY' });
  }

  if (type === 'RUN') {
    try {
      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'FINISHED' });
    } catch (err) {
      self.postMessage({ type: 'OUTPUT', text: err.toString() });
      self.postMessage({ type: 'FINISHED' });
    }
  }
};
