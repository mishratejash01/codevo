import { useState, useEffect, useRef, useCallback } from 'react';

interface WorkerMessage {
  type: 'READY' | 'OUTPUT' | 'INPUT_REQUEST' | 'FINISHED' | 'ERROR';
  text?: string;
  message?: string;
}

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);
  const inputLineRef = useRef<string>("");
  const collectedInputsRef = useRef<string[]>([]);
  const currentCodeRef = useRef<string>("");

  // Initialize the Web Worker
  useEffect(() => {
    const worker = new Worker('/pyodide.worker.js');
    workerRef.current = worker;
    
    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, text, message } = event.data;
      
      switch (type) {
        case 'READY':
          setIsReady(true);
          break;
          
        case 'OUTPUT':
          if (text) {
            setOutput(prev => prev + text);
          }
          break;
          
        case 'INPUT_REQUEST':
          setIsWaitingForInput(true);
          break;
          
        case 'FINISHED':
          setIsRunning(false);
          setIsWaitingForInput(false);
          break;
          
        case 'ERROR':
          setOutput(prev => prev + `\nError: ${message}\n`);
          setIsRunning(false);
          break;
      }
    };
    
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setOutput(prev => prev + `\nWorker Error: ${error.message}\n`);
      setIsRunning(false);
    };
    
    // Initialize the worker (no SharedArrayBuffer needed)
    worker.postMessage({ type: 'INIT' });
    
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Re-run code with collected inputs
  const rerunWithInputs = useCallback(() => {
    if (!workerRef.current || !currentCodeRef.current) return;
    
    // Wrap code with pre-collected inputs
    const inputs = collectedInputsRef.current;
    const inputSetup = `_input_values = ${JSON.stringify(inputs)}\n_input_index = 0\n`;
    
    // Create wrapped code that uses our input values
    const wrappedCode = `
import builtins

_input_values = ${JSON.stringify(inputs)}
_input_index = 0

def _custom_input(prompt=""):
    global _input_index
    if prompt:
        print(prompt, end="", flush=True)
    if _input_index < len(_input_values):
        val = _input_values[_input_index]
        _input_index += 1
        print(val)  # Echo the input
        return val
    raise EOFError("__NEED_INPUT__")

builtins.input = _custom_input

${currentCodeRef.current}
`;
    
    setOutput(""); // Clear output for re-run
    workerRef.current.postMessage({ type: 'RUN', code: wrappedCode });
  }, []);

  // Run Python code
  const runCode = useCallback((code: string) => {
    if (!workerRef.current || !isReady) {
      console.warn('Worker not ready');
      return;
    }
    
    // Reset state for new run
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    inputLineRef.current = "";
    collectedInputsRef.current = [];
    currentCodeRef.current = code;
    
    // Create wrapped code with custom input handler
    const wrappedCode = `
import builtins

_input_values = []
_input_index = 0

def _custom_input(prompt=""):
    global _input_index
    if prompt:
        print(prompt, end="", flush=True)
    if _input_index < len(_input_values):
        val = _input_values[_input_index]
        _input_index += 1
        print(val)  # Echo the input
        return val
    raise EOFError("__NEED_INPUT__")

builtins.input = _custom_input

${code}
`;
    
    workerRef.current.postMessage({ type: 'RUN', code: wrappedCode });
  }, [isReady]);

  // Write input character to the Python process
  const writeInputToWorker = useCallback((char: string) => {
    // Handle Enter key - submit the input line
    if (char === '\r' || char === '\n') {
      const inputText = inputLineRef.current;
      inputLineRef.current = "";
      
      // Add to collected inputs
      collectedInputsRef.current.push(inputText);
      
      // Re-run with all collected inputs
      setIsWaitingForInput(false);
      rerunWithInputs();
    } 
    // Handle Backspace
    else if (char === '\x7f' || char === '\b') {
      inputLineRef.current = inputLineRef.current.slice(0, -1);
    }
    // Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      workerRef.current?.postMessage({ type: 'INTERRUPT' });
      inputLineRef.current = "";
      collectedInputsRef.current = [];
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
    // Regular character
    else {
      inputLineRef.current += char;
    }
  }, [rerunWithInputs]);

  // Stop execution
  const stopExecution = useCallback(() => {
    workerRef.current?.postMessage({ type: 'INTERRUPT' });
    setIsRunning(false);
    setIsWaitingForInput(false);
  }, []);

  return { 
    runCode, 
    output, 
    isRunning, 
    isReady, 
    isWaitingForInput,
    writeInputToWorker,
    stopExecution,
    hasSharedArrayBuffer: false // No longer needed
  };
};
