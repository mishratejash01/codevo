import { useState, useCallback, useRef } from 'react';
import { Language } from './useCodeRunner';

// Same-origin proxy -> Vercel serverless function (api/execute.js)
const EXECUTE_API = '/api/execute';

interface InteractiveRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

// Detect if output is waiting for input
const detectPrompt = (output: string): string | null => {
  if (!output) return null;
  const lines = output.split('\n');
  const lastLine = lines[lines.length - 1];

  // Rule 1: If output does NOT end with a newline, it's likely a prompt
  if (!output.endsWith('\n') && lastLine.length > 0) {
    return lastLine;
  }

  // Rule 2: Regex for explicit prompts
  const trimmedLast = lastLine.trim();
  const promptPatterns = [
    /[:\?]\s*$/,
    />\s*$/,
    /enter\s+.+[:\?]?\s*$/i,
    /input\s+.+[:\?]?\s*$/i,
    /type\s+.+[:\?]?\s*$/i,
    /please\s+.+[:\?]?\s*$/i,
  ];

  for (const pattern of promptPatterns) {
    if (pattern.test(trimmedLast) && trimmedLast.length > 0) {
      return trimmedLast;
    }
  }

  return null;
};

// Helper to find the last valid prompt in the output
const findLastPromptIndex = (output: string): number => {
  const patterns = [/: /g, /\? /g, /> /g, /:$/gm, /\?$/gm, />$/gm];
  let maxIndex = -1;

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const endIdx = match.index + match[0].length;
      const sub = output.slice(0, endIdx);
      if (detectPrompt(sub)) {
        maxIndex = Math.max(maxIndex, endIdx);
      }
    }
  }
  return maxIndex;
};

// Get friendly error messages
const getFriendlyError = (rawError: string, language: Language): string => {
  const lowerError = rawError.toLowerCase();

  if (language === 'java') {
    if (lowerError.includes('nosuchelementexception')) {
      return "Waiting for input...";
    }
  }

  if (language === 'cpp' || language === 'c') {
    if (lowerError.includes('segmentation fault') || lowerError.includes('sigsegv')) {
      return "Segmentation Fault: Memory access error!";
    }
  }

  if (lowerError.includes('time limit') || lowerError.includes('timeout')) {
    return "Time Limit Exceeded!";
  }

  return rawError;
};

export const useInteractiveRunner = (language: Language): InteractiveRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  const codeRef = useRef<string>("");
  const collectedInputsRef = useRef<string[]>([]);
  const currentInputLineRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const executionCountRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const previousOutputRef = useRef<string>("");

  const runViaProxy = async (
    code: string,
    stdin: string,
    signal: AbortSignal
  ): Promise<{ success: boolean; output: string; needsInput: boolean }> => {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(EXECUTE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_code: code, language, stdin }),
          signal,
        });

        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            setOutput(prev => prev + `\n⏳ Server busy, retrying in ${delay/1000}s...\n`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return { success: false, output: "⚠️ Rate limit exceeded. Please wait a moment and try again.", needsInput: false };
        }

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }

        const data = await response.json();
        // Normalized: {stdout, stderr, code, signal, time, memory, isCompileError}
        const stdout = data.stdout || "";
        const stderr = data.stderr || "";
        const isCompiledLang = language === 'c' || language === 'cpp';

        // Compilation Error
        if (data.isCompileError) {
          return { success: false, output: getFriendlyError(stderr || "Compilation failed", language), needsInput: false };
        }

        // TLE (code === -1 or signal SIGKILL) — likely waiting for input
        if (data.code === -1 || data.signal === 'SIGKILL') {
          let finalOutput = stdout;
          let forceInput = false;

          if (isCompiledLang) {
            const lastPromptIdx = findLastPromptIndex(stdout);
            if (lastPromptIdx !== -1 && lastPromptIdx < stdout.length) {
              finalOutput = stdout.slice(0, lastPromptIdx);
              forceInput = true;
            }
          }

          const needsInput = (
            forceInput ||
            stdout.length > 0 ||
            collectedInputsRef.current.length === 0
          );

          return { success: needsInput, output: finalOutput, needsInput };
        }

        // Success (code === 0)
        if (data.code === 0) {
          return { success: true, output: stdout, needsInput: false };
        }

        // Runtime Error (code === 1) — check if it's actually waiting for input
        const lowerStderr = stderr.toLowerCase();

        // Java NoSuchElementException = waiting for input
        if (lowerStderr.includes('nosuchelementexception')) {
          return { success: true, output: stdout, needsInput: true };
        }
        // EOFError = waiting for input
        if (lowerStderr.includes('eof when reading') || lowerStderr.includes('eoferror')) {
          return { success: true, output: stdout, needsInput: true };
        }

        return { success: false, output: getFriendlyError(stderr || stdout || "Execution failed", language), needsInput: false };
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { success: false, output: "^C\nExecution stopped.", needsInput: false };
        }
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          setOutput(prev => prev + `\n⚠️ Network error, retrying in ${delay/1000}s...\n`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return { success: false, output: `Error: ${e.message}`, needsInput: false };
      }
    }

    return { success: false, output: "Failed after multiple retries", needsInput: false };
  };

  const executeWithInputs = useCallback(async () => {
    const currentExecution = ++executionCountRef.current;
    const signal = abortControllerRef.current?.signal;

    if (!signal || signal.aborted) return;

    const stdin = collectedInputsRef.current.join('\n');
    const result = await runViaProxy(codeRef.current, stdin, signal);

    if (currentExecution !== executionCountRef.current) return;
    if (signal.aborted) return;

    // Delta output: only append new content to avoid terminal flashing
    const newOutput = result.output;
    if (newOutput.startsWith(previousOutputRef.current)) {
      const delta = newOutput.slice(previousOutputRef.current.length);
      if (delta.length > 0) {
        setOutput(prev => prev + delta);
      }
    } else {
      // Fallback: full replace if output doesn't extend previous
      setOutput(newOutput);
    }
    previousOutputRef.current = newOutput;

    if (result.needsInput || detectPrompt(result.output)) {
      setIsWaitingForInput(true);
    } else {
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  }, [language]);

  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;

    if (char === '\r' || char === '\n') {
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";

      // Track what the user typed so delta calculation accounts for it
      previousOutputRef.current += inputValue + '\n';

      collectedInputsRef.current.push(inputValue);

      setIsWaitingForInput(false);
      executeWithInputs();
    }
    else if (char === '\x7f' || char === '\b') {
      if (currentInputLineRef.current.length > 0) {
        currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
      }
    }
    else if (char === '\x03') {
      abortControllerRef.current?.abort();
      currentInputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      setOutput(prev => prev + '\n⚠️ Interrupted\n');
    }
    else if (char.length === 1 && char >= ' ') {
      currentInputLineRef.current += char;
    }
  }, [isWaitingForInput, executeWithInputs]);

  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsWaitingForInput(false);
    setOutput(prev => prev + '\n^C\nExecution stopped.\n');
  }, []);

  const runCode = useCallback((code: string) => {
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    retryCountRef.current = 0;
    previousOutputRef.current = "";

    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);

    abortControllerRef.current = new AbortController();

    executeWithInputs();
  }, [executeWithInputs]);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
