import { useState, useEffect, useRef, useCallback } from 'react';

interface WorkerMessage {
  type: 'READY' | 'OUTPUT' | 'INPUT_REQUEST' | 'FINISHED' | 'ERROR';
  text?: string;
  message?: string;
}

const INIT_TIMEOUT_MS = 20000; // 20 seconds timeout for initialization

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const inputLineRef = useRef<string>("");
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the Web Worker
  const initWorker = useCallback(() => {
    // Clean up existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    // Reset state
    setIsReady(false);
    setInitError(null);
    setOutput("");
    setIsRunning(false);
    setIsWaitingForInput(false);
    
    try {
      const worker = new Worker('/pyodide.worker.js');
      workerRef.current = worker;
      
      // Set initialization timeout
      initTimeoutRef.current = setTimeout(() => {
        if (!isReady) {
          setInitError('Python initialization timed out. Please refresh the page.');
        }
      }, INIT_TIMEOUT_MS);
      
      // Handle messages from worker
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, text, message } = event.data;
        
        switch (type) {
          case 'READY':
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            setIsReady(true);
            setInitError(null);
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
            inputLineRef.current = "";
            break;
            
          case 'ERROR':
            if (message) {
              setOutput(prev => prev + `\n❌ ${message}\n`);
            }
            if (!isReady) {
              setInitError(message || 'Failed to initialize Python');
            }
            setIsRunning(false);
            setIsWaitingForInput(false);
            break;
        }
      };
      
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        setOutput(prev => prev + `\n❌ Worker Error: ${error.message}\n`);
        setIsRunning(false);
        setInitError('Worker failed to load. Please refresh the page.');
      };
      
      // Initialize the worker
      worker.postMessage({ type: 'INIT' });
      
    } catch (err) {
      setInitError('Failed to create Python worker');
      console.error('Failed to create worker:', err);
    }
  }, [isReady]);

  // Initialize on mount
  useEffect(() => {
    initWorker();
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Run Python code
  const runCode = useCallback((code: string) => {
    if (!workerRef.current) {
      console.warn('Worker not available');
      return;
    }
    
    if (!isReady) {
      setOutput("⏳ Python is still loading, please wait...\n");
      return;
    }
    
    // Reset state for new run
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    inputLineRef.current = "";
    
    // Send code to worker
    workerRef.current.postMessage({ type: 'RUN', code });
  }, [isReady]);

  // Handle terminal input character by character
  // NOTE: TerminalView already handles visual echo, so we only track the buffer here
  const writeInputToWorker = useCallback((char: string) => {
    if (!isWaitingForInput) return;
    
    // Handle Enter key - submit the input
    if (char === '\r' || char === '\n') {
      const inputText = inputLineRef.current;
      inputLineRef.current = "";
      
      // Send input to worker (no echo needed - terminal handles it)
      setIsWaitingForInput(false);
      workerRef.current?.postMessage({ type: 'INPUT_RESPONSE', text: inputText });
    } 
    // Handle Backspace
    else if (char === '\x7f' || char === '\b') {
      if (inputLineRef.current.length > 0) {
        inputLineRef.current = inputLineRef.current.slice(0, -1);
      }
    }
    // Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      workerRef.current?.postMessage({ type: 'INTERRUPT' });
      inputLineRef.current = "";
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
    // Regular character - just track it, terminal already echoes
    else if (char.length === 1 && char >= ' ') {
      inputLineRef.current += char;
    }
  }, [isWaitingForInput]);

  // Stop execution
  const stopExecution = useCallback(() => {
    workerRef.current?.postMessage({ type: 'INTERRUPT' });
    setIsRunning(false);
    setIsWaitingForInput(false);
    inputLineRef.current = "";
  }, []);

  // Retry initialization
  const retryInit = useCallback(() => {
    initWorker();
  }, [initWorker]);

  return { 
    runCode, 
    output, 
    isRunning, 
    isReady, 
    isWaitingForInput,
    writeInputToWorker,
    stopExecution,
    initError,
    retryInit,
    hasSharedArrayBuffer: false
  };
};
