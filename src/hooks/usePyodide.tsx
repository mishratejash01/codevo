import { useState, useEffect, useRef, useCallback } from 'react';

// Buffer layout constants
const STATUS_WAITING = 0;
const STATUS_INPUT_READY = 1;
const STATUS_INTERRUPT = -1;
const TEXT_BUFFER_SIZE = 4096; // 4KB for input text

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
  
  // Worker and buffer refs
  const workerRef = useRef<Worker | null>(null);
  const sharedSignalBufferRef = useRef<SharedArrayBuffer | null>(null);
  const sharedTextBufferRef = useRef<SharedArrayBuffer | null>(null);
  const signalArrayRef = useRef<Int32Array | null>(null);
  const textArrayRef = useRef<Uint8Array | null>(null);
  const inputLineRef = useRef<string>("");
  const hasSharedArrayBufferRef = useRef<boolean>(typeof SharedArrayBuffer !== 'undefined');

  // Initialize the Web Worker
  useEffect(() => {
    // Check if SharedArrayBuffer is available
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    hasSharedArrayBufferRef.current = hasSharedArrayBuffer;
    
    if (!hasSharedArrayBuffer) {
      console.warn('SharedArrayBuffer not available. Interactive input will be limited.');
    }
    
    // Create the worker
    const worker = new Worker('/pyodide.worker.js');
    workerRef.current = worker;
    
    // Create shared buffers if available
    let sharedBuffer: SharedArrayBuffer | null = null;
    let textBuffer: SharedArrayBuffer | null = null;
    
    if (hasSharedArrayBuffer) {
      try {
        sharedBuffer = new SharedArrayBuffer(8); // 2 Int32 values
        textBuffer = new SharedArrayBuffer(TEXT_BUFFER_SIZE);
        
        sharedSignalBufferRef.current = sharedBuffer;
        sharedTextBufferRef.current = textBuffer;
        signalArrayRef.current = new Int32Array(sharedBuffer);
        textArrayRef.current = new Uint8Array(textBuffer);
      } catch (e) {
        console.warn('Failed to create SharedArrayBuffer:', e);
      }
    }
    
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
    
    // Initialize the worker
    worker.postMessage({
      type: 'INIT',
      sharedBuffer,
      textBuffer
    });
    
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Run Python code
  const runCode = useCallback((code: string) => {
    if (!workerRef.current || !isReady) {
      console.warn('Worker not ready');
      return;
    }
    
    // Reset state for new run
    setIsRunning(true);
    setOutput(""); // Clear output
    setIsWaitingForInput(false);
    inputLineRef.current = "";
    
    // Reset the signal buffer
    if (signalArrayRef.current) {
      Atomics.store(signalArrayRef.current, 0, STATUS_WAITING);
      Atomics.store(signalArrayRef.current, 1, 0);
    }
    
    // Send code to worker
    workerRef.current.postMessage({ type: 'RUN', code });
  }, [isReady]);

  // Write input character to the Python process
  const writeInputToWorker = useCallback((char: string) => {
    // Handle Enter key - submit the input line
    if (char === '\r' || char === '\n') {
      const inputText = inputLineRef.current + '\n';
      inputLineRef.current = "";
      
      if (!hasSharedArrayBufferRef.current || !signalArrayRef.current || !textArrayRef.current) {
        // Fallback: Can't provide interactive input without SharedArrayBuffer
        console.warn('Cannot provide interactive input: SharedArrayBuffer not available');
        return;
      }
      
      // Write the input text to the shared buffer
      const encoded = new TextEncoder().encode(inputText);
      const length = Math.min(encoded.length, TEXT_BUFFER_SIZE - 1);
      textArrayRef.current.set(encoded.slice(0, length));
      
      // Signal that input is ready
      Atomics.store(signalArrayRef.current, 1, length); // Store length
      Atomics.store(signalArrayRef.current, 0, STATUS_INPUT_READY); // Set status
      Atomics.notify(signalArrayRef.current, 0, 1); // Wake the worker
      
      setIsWaitingForInput(false);
    } 
    // Handle Backspace
    else if (char === '\x7f' || char === '\b') {
      inputLineRef.current = inputLineRef.current.slice(0, -1);
    }
    // Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      if (signalArrayRef.current) {
        Atomics.store(signalArrayRef.current, 0, STATUS_INTERRUPT);
        Atomics.notify(signalArrayRef.current, 0, 1);
      }
      workerRef.current?.postMessage({ type: 'INTERRUPT' });
      inputLineRef.current = "";
    }
    // Regular character
    else {
      inputLineRef.current += char;
    }
  }, []);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (signalArrayRef.current) {
      Atomics.store(signalArrayRef.current, 0, STATUS_INTERRUPT);
      Atomics.notify(signalArrayRef.current, 0, 1);
    }
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
    hasSharedArrayBuffer: hasSharedArrayBufferRef.current
  };
};
