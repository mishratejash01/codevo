/**
 * Pyodide Web Worker with Message-Based Interactive Input
 * 
 * This worker runs Python code in isolation and handles interactive input()
 * using an async message-based approach that works WITHOUT SharedArrayBuffer.
 * 
 * Protocol:
 * - RUN: Start executing code
 * - INPUT_REQUEST: Worker needs input from user
 * - INPUT_RESPONSE: Main thread sends user input
 * - OUTPUT: Worker sends output text
 * - FINISHED: Execution complete
 * - ERROR: Error occurred
 * - READY: Worker initialized
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let micropip = null;

// State for input handling
let userCode = "";
let collectedInputs = [];
let previousOutput = "";
let isExecuting = false;

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

async function initPyodide() {
  try {
    self.postMessage({ type: 'OUTPUT', text: '⏳ Loading Python runtime...\n' });
    
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
    });
    
    await pyodide.loadPackage("micropip");
    micropip = pyodide.pyimport("micropip");

    // Collect output in buffer for delta calculation
    let outputBuffer = "";
    
    pyodide.setStdout({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        outputBuffer += char;
        // Only send new output (delta from previous run)
        if (outputBuffer.length > previousOutput.length) {
          self.postMessage({ type: 'OUTPUT', text: char });
        }
      }
    });
    
    pyodide.setStderr({
      raw: (byte) => {
        const char = String.fromCharCode(byte);
        outputBuffer += char;
        if (outputBuffer.length > previousOutput.length) {
          self.postMessage({ type: 'OUTPUT', text: char });
        }
      }
    });
    
    // Store buffer reference for access in run
    self.outputBuffer = outputBuffer;
    self.getOutputBuffer = () => outputBuffer;
    self.resetOutputBuffer = () => { outputBuffer = ""; };
    self.setOutputBuffer = (val) => { outputBuffer = val; };
    
    return true;
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: 'Failed to load Python: ' + err.message });
    return false;
  }
}

async function executeWithInputs(code, inputs) {
  // Build the wrapped code with input values
  const inputsJson = JSON.stringify(inputs);
  
  const wrappedCode = `
import builtins
import sys

_collected_inputs = ${inputsJson}
_input_index = 0

def _patched_input(prompt=""):
    global _input_index
    if prompt:
        print(prompt, end="", flush=True)
    if _input_index < len(_collected_inputs):
        val = _collected_inputs[_input_index]
        _input_index += 1
        print(val)  # Echo input
        return val
    raise EOFError("__NEED_MORE_INPUT__")

builtins.input = _patched_input

# User code starts here
${code}
`;

  try {
    // Clear previous state
    await pyodide.runPythonAsync(`
import sys
for name in list(globals().keys()):
    if not name.startswith('_') and name not in ['__builtins__', '__name__', '__doc__']:
        try:
            del globals()[name]
        except:
            pass
`);
    
    await pyodide.runPythonAsync(wrappedCode);
    return { needsInput: false, error: null };
  } catch (err) {
    const errorMsg = err?.message ?? String(err);
    
    if (errorMsg.includes("__NEED_MORE_INPUT__")) {
      return { needsInput: true, error: null };
    }
    
    // Check for missing module
    const missingModule = extractMissingModuleName(errorMsg);
    if (missingModule) {
      return { needsInput: false, error: errorMsg, missingModule };
    }
    
    return { needsInput: false, error: errorMsg };
  }
}

async function runCode() {
  if (!pyodide) {
    self.postMessage({ type: 'ERROR', message: 'Python not initialized' });
    self.postMessage({ type: 'FINISHED' });
    return;
  }
  
  isExecuting = true;
  
  // Reset output tracking for this run
  let currentOutput = "";
  
  // Custom stdout that tracks output
  pyodide.setStdout({
    raw: (byte) => {
      const char = String.fromCharCode(byte);
      currentOutput += char;
      // Only emit characters beyond what we've already shown
      if (currentOutput.length > previousOutput.length) {
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    }
  });
  
  pyodide.setStderr({
    raw: (byte) => {
      const char = String.fromCharCode(byte);
      currentOutput += char;
      if (currentOutput.length > previousOutput.length) {
        self.postMessage({ type: 'OUTPUT', text: char });
      }
    }
  });
  
  const result = await executeWithInputs(userCode, collectedInputs);
  
  if (result.needsInput) {
    // Save current output so we don't repeat it on re-run
    previousOutput = currentOutput;
    // Request input from user
    self.postMessage({ type: 'INPUT_REQUEST' });
    // Don't send FINISHED - we're waiting for input
    return;
  }
  
  if (result.error) {
    // Try to install missing module and retry
    if (result.missingModule) {
      const pkg = result.missingModule.split('.')[0];
      try {
        self.postMessage({ type: 'OUTPUT', text: `\n📦 Installing '${pkg}'...\n` });
        await micropip.install(pkg);
        self.postMessage({ type: 'OUTPUT', text: `✅ Installed. Retrying...\n\n` });
        
        // Reset and retry
        previousOutput = "";
        currentOutput = "";
        const retryResult = await executeWithInputs(userCode, collectedInputs);
        
        if (retryResult.needsInput) {
          previousOutput = currentOutput;
          self.postMessage({ type: 'INPUT_REQUEST' });
          return;
        }
        
        if (retryResult.error) {
          self.postMessage({ type: 'OUTPUT', text: '\n❌ ' + retryResult.error + '\n' });
        }
      } catch (installErr) {
        self.postMessage({ type: 'OUTPUT', text: `\n❌ Failed to install '${pkg}': ${installErr.message}\n` });
      }
    } else {
      // Format error message nicely
      let errorMsg = result.error;
      if (errorMsg.includes('KeyboardInterrupt')) {
        errorMsg = '⚠️ Program interrupted';
      }
      self.postMessage({ type: 'OUTPUT', text: '\n' + errorMsg + '\n' });
    }
  }
  
  isExecuting = false;
  self.postMessage({ type: 'FINISHED' });
}

self.onmessage = async (event) => {
  const { type, code, text } = event.data;
  
  if (type === 'INIT') {
    const success = await initPyodide();
    if (success) {
      self.postMessage({ type: 'OUTPUT', text: '✅ Python ready!\n\n' });
      self.postMessage({ type: 'READY' });
    }
  }
  
  if (type === 'RUN') {
    // New execution - reset state
    userCode = code;
    collectedInputs = [];
    previousOutput = "";
    
    await runCode();
  }
  
  if (type === 'INPUT_RESPONSE') {
    if (!isExecuting) return;
    
    // Add the new input to our collection
    collectedInputs.push(text);
    
    // Re-run with all collected inputs
    await runCode();
  }
  
  if (type === 'INTERRUPT') {
    isExecuting = false;
    collectedInputs = [];
    previousOutput = "";
    self.postMessage({ type: 'OUTPUT', text: '\n⚠️ Interrupted\n' });
    self.postMessage({ type: 'FINISHED' });
  }
};
