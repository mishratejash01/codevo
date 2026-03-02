import { useState, useEffect, useRef, useCallback } from 'react';

interface WorkerMessage {
  type: 'READY' | 'OUTPUT' | 'INPUT_REQUEST' | 'FINISHED' | 'ERROR';
  text?: string;
  message?: string;
}

interface JSRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

const EXECUTION_TIMEOUT_MS = 10_000; // 10 seconds — kills infinite loops

export const useJavaScriptRunner = (): JSRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const inputLineRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Spawn a fresh worker
  const spawnWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker('/javascript.worker.js');
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, text, message } = event.data;

      switch (type) {
        case 'READY':
          break;

        case 'OUTPUT':
          if (text) {
            setOutput(prev => prev + text);
          }
          break;

        case 'INPUT_REQUEST':
          // Worker needs input — pause the timeout while waiting
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsWaitingForInput(true);
          break;

        case 'FINISHED':
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsRunning(false);
          setIsWaitingForInput(false);
          inputLineRef.current = "";
          break;

        case 'ERROR':
          if (message) {
            setOutput(prev => prev + `\n\x1b[31m${message}\x1b[0m\n`);
          }
          setIsRunning(false);
          setIsWaitingForInput(false);
          break;
      }
    };

    worker.onerror = (err) => {
      console.error('JS Worker error:', err);
      setOutput(prev => prev + `\n\x1b[31mWorker Error: ${err.message}\x1b[0m\n`);
      setIsRunning(false);
    };

    return worker;
  }, []);

  // Create worker on mount
  useEffect(() => {
    spawnWorker();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const runCode = useCallback((code: string) => {
    if (!code.trim()) {
      setOutput("");
      return;
    }

    // Reset state
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    inputLineRef.current = "";

    // Ensure we have a live worker (re-spawn if previously terminated)
    let worker = workerRef.current;
    if (!worker) {
      worker = spawnWorker();
    }

    // Set execution timeout — if FINISHED/INPUT_REQUEST not received, kill the worker
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOutput(prev => prev + '\r\n\x1b[31mTime Limit Exceeded (10s) — possible infinite loop.\x1b[0m\r\n');
      setIsRunning(false);
      setIsWaitingForInput(false);
      // Kill the stuck worker and respawn a fresh one
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      spawnWorker();
    }, EXECUTION_TIMEOUT_MS);

    worker.postMessage({ type: 'RUN', code });
  }, [spawnWorker]);

  // Character-by-character input (terminal sends individual chars)
  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;

    if (char === '\r' || char === '\n') {
      const inputValue = inputLineRef.current;
      inputLineRef.current = "";
      setIsWaitingForInput(false);

      // Restart timeout for the next execution phase
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setOutput(prev => prev + '\r\n\x1b[31mTime Limit Exceeded (10s) — possible infinite loop.\x1b[0m\r\n');
        setIsRunning(false);
        setIsWaitingForInput(false);
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        spawnWorker();
      }, EXECUTION_TIMEOUT_MS);

      workerRef.current?.postMessage({ type: 'INPUT_RESPONSE', text: inputValue });
    } else if (char === '\x7f' || char === '\b') {
      if (inputLineRef.current.length > 0) {
        inputLineRef.current = inputLineRef.current.slice(0, -1);
      }
    } else if (char === '\x03') {
      // Ctrl+C
      workerRef.current?.postMessage({ type: 'INTERRUPT' });
      inputLineRef.current = "";
      setIsRunning(false);
      setIsWaitingForInput(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (char.length === 1 && char >= ' ') {
      inputLineRef.current += char;
    }
  }, [isWaitingForInput, spawnWorker]);

  const stopExecution = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Terminate and respawn to guarantee cleanup
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    spawnWorker();
    setIsRunning(false);
    setIsWaitingForInput(false);
    inputLineRef.current = "";
    setOutput(prev => prev + '\n[Execution stopped by user]\n');
  }, [spawnWorker]);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
