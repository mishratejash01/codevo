import { useState, useEffect } from 'react';

// --- GLOBAL SINGLETON STATE ---
let globalWorker: Worker | null = null;
let globalBuffer: SharedArrayBuffer | null = null;
let globalInt32: Int32Array | null = null;
let globalIsReady = false;

// Subscribers
let messageSubscribers: ((data: any) => void)[] = [];

// Buffer Constants
const BUFFER_SIZE = 256;
const HEAD_INDEX = 0;
const TAIL_INDEX = 1;
const DATA_OFFSET = 2;

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(globalIsReady);

  useEffect(() => {
    // 1. Check for Security Headers (The common crash cause)
    if (!window.crossOriginIsolated) {
        setOutput("❌ ERROR: Security Headers Missing.\n\nTo fix this:\n1. Open vite.config.ts and ensure 'headers' are set.\n2. STOP your server (Ctrl+C) and run 'npm run dev' again.\n3. Refresh this page.\n");
        return;
    }

    // 2. Initialize Worker safely
    if (!globalWorker) {
        try {
            globalWorker = new Worker(new URL('/pyodide.worker.js', import.meta.url));
            globalBuffer = new SharedArrayBuffer(1024);
            globalInt32 = new Int32Array(globalBuffer);

            globalWorker.postMessage({ 
                type: 'INIT', 
                inputBuffer: globalBuffer,
                params: { headIndex: HEAD_INDEX, tailIndex: TAIL_INDEX, dataOffset: DATA_OFFSET, size: BUFFER_SIZE }
            });

            globalWorker.onmessage = (e) => {
                const { type } = e.data;
                if (type === 'READY') {
                    globalIsReady = true;
                    // Force update local state
                    setIsReady(true);
                }
                // Broadcast to all hooks
                messageSubscribers.forEach(cb => cb(e.data));
            };
        } catch (err: any) {
            setOutput(`❌ Startup Error: ${err.message}\n`);
        }
    }

    // 3. Subscribe to messages
    const handleMessage = (data: any) => {
      if (data.type === 'OUTPUT') {
        setOutput((prev) => prev + data.text);
      } else if (data.type === 'FINISHED') {
        setIsRunning(false);
      } else if (data.type === 'READY') {
        setIsReady(true);
        setOutput("Python Environment Ready.\n> ");
      }
    };

    messageSubscribers.push(handleMessage);
    
    // If already ready, sync state
    if (globalIsReady) setIsReady(true);

    return () => {
        messageSubscribers = messageSubscribers.filter(cb => cb !== handleMessage);
    };
  }, []);

  const writeInputToWorker = (text: string) => {
    if (!globalInt32 || !globalWorker) return;

    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        let tail = Atomics.load(globalInt32, TAIL_INDEX);
        const head = Atomics.load(globalInt32, HEAD_INDEX);
        const nextTail = (tail + 1) % BUFFER_SIZE;
        
        if (nextTail === head) continue; 

        Atomics.store(globalInt32, DATA_OFFSET + tail, charCode);
        Atomics.store(globalInt32, TAIL_INDEX, nextTail);
        Atomics.notify(globalInt32, TAIL_INDEX);
    }
  };

  const runCode = (code: string) => {
    if (!globalWorker || !globalInt32) return;
    setIsRunning(true);
    setOutput(""); 
    
    // Reset Buffer
    Atomics.store(globalInt32, HEAD_INDEX, 0);
    Atomics.store(globalInt32, TAIL_INDEX, 0);
    
    globalWorker.postMessage({ type: 'RUN', code });
  };

  return { runCode, output, isRunning, isReady, writeInputToWorker };
};
