import { useState, useCallback, useRef } from 'react';

// Same-origin proxy -> Vercel serverless function (api/execute.js)
const EXECUTE_API = '/api/execute';

interface CRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

/**
 * Strip comments and string literals from C code so regex matching
 * doesn't produce false positives on commented-out code or strings.
 */
const stripCommentsAndStrings = (code: string): string => {
  return code.replace(
    /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
    (match) => {
      if (match.startsWith('"') || match.startsWith("'")) return ' '.repeat(match.length);
      return ' '.repeat(match.length);
    }
  );
};

/**
 * Detect if C code contains input functions that require stdin
 */
const hasInputFunctions = (code: string): boolean => {
  const stripped = stripCommentsAndStrings(code);
  const inputPatterns = [
    /\bscanf\s*\(/,
    /\bgetchar\s*\(/,
    /\bgets\s*\(/,
    /\bfgets\s*\(/,
    /\bgetc\s*\(/,
    /\bfgetc\s*\(/,
    /\bfscanf\s*\(\s*stdin/,
  ];
  return inputPatterns.some(pattern => pattern.test(stripped));
};

/**
 * Count how many input calls exist in the code (approximate)
 */
const countInputCalls = (code: string): number => {
  const stripped = stripCommentsAndStrings(code);
  const scanfMatches = stripped.match(/\bscanf\s*\(/g) || [];
  const getcharMatches = stripped.match(/\bgetchar\s*\(/g) || [];
  const getsMatches = stripped.match(/\bgets\s*\(/g) || [];
  const fgetsMatches = stripped.match(/\bfgets\s*\(/g) || [];
  return scanfMatches.length + getcharMatches.length + getsMatches.length + fgetsMatches.length;
};

/**
 * Extract prompt string from printf/puts before first input function (local, no network)
 */
const extractPromptFromCode = (code: string): string => {
  const stripped = stripCommentsAndStrings(code);
  const inputPatterns = [
    /\bscanf\s*\(/,
    /\bgetchar\s*\(/,
    /\bgets\s*\(/,
    /\bfgets\s*\(/,
  ];

  let firstInputPos = code.length;
  for (const pattern of inputPatterns) {
    const match = pattern.exec(stripped);
    if (match && match.index < firstInputPos) {
      firstInputPos = match.index;
    }
  }

  if (firstInputPos === code.length) return "";

  // Get code before first input
  const codeBefore = code.slice(0, firstInputPos);

  // Find last printf or puts call before the input
  const printfMatches = [...codeBefore.matchAll(/printf\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)];
  const putsMatches = [...codeBefore.matchAll(/puts\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)];

  let lastPrompt = "";
  let lastPos = -1;

  for (const match of printfMatches) {
    if (match.index !== undefined && match.index > lastPos) {
      lastPos = match.index;
      lastPrompt = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
    }
  }

  for (const match of putsMatches) {
    if (match.index !== undefined && match.index > lastPos) {
      lastPos = match.index;
      lastPrompt = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\') + '\n';
    }
  }

  return lastPrompt;
};

/**
 * Get user-friendly error messages
 */
const getFriendlyError = (rawError: string): string => {
  const lowerError = rawError.toLowerCase();

  if (lowerError.includes('segmentation fault') || lowerError.includes('sigsegv')) {
    return "\x1b[31mSegmentation Fault: Memory access error!\x1b[0m";
  }

  if (lowerError.includes('compilation error') || lowerError.includes('error:')) {
    return `\x1b[31mCompilation Error:\x1b[0m\n${rawError}`;
  }

  return rawError;
};

export const useCRunner = (): CRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  const codeRef = useRef<string>("");
  const collectedInputsRef = useRef<string[]>([]);
  const currentInputLineRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const expectedInputCountRef = useRef<number>(1);
  const hasExecutedOnceRef = useRef<boolean>(false);
  const previousOutputRef = useRef<string>("");

  /**
   * Execute code via same-origin proxy
   */
  const runViaProxy = async (
    code: string,
    stdin: string,
    signal: AbortSignal,
  ): Promise<{
    success: boolean;
    output: string;
    exitCode: number | null;
    wasKilled: boolean;
    isCompileError: boolean;
  }> => {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(EXECUTE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_code: code, language: 'c', stdin }),
          signal,
        });

        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
          return { success: false, output: "\x1b[31mRate limit exceeded. Please wait.\x1b[0m", exitCode: null, wasKilled: false, isCompileError: false };
        }

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }

        const data = await response.json();
        // Normalized: {stdout, stderr, code, signal, time, memory, isCompileError}

        // Compilation Error
        if (data.isCompileError) {
          return { success: false, output: getFriendlyError(data.stderr || "Compilation failed"), exitCode: 1, wasKilled: false, isCompileError: true };
        }

        // TLE (waiting for input or infinite loop)
        if (data.code === -1 || data.signal === 'SIGKILL') {
          return { success: true, output: data.stdout || "", exitCode: null, wasKilled: true, isCompileError: false };
        }

        // Success
        if (data.code === 0) {
          return { success: true, output: data.stdout || "", exitCode: 0, wasKilled: false, isCompileError: false };
        }

        // Runtime Error
        return { success: false, output: getFriendlyError(data.stderr || data.stdout || "Runtime error"), exitCode: 1, wasKilled: false, isCompileError: false };

      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { success: false, output: "^C\nExecution stopped.", exitCode: null, wasKilled: false, isCompileError: false };
        }
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        return { success: false, output: `\x1b[31mNetwork Error: ${e.message}\x1b[0m`, exitCode: null, wasKilled: false, isCompileError: false };
      }
    }

    return { success: false, output: "Failed after retries", exitCode: null, wasKilled: false, isCompileError: false };
  };

  /**
   * Execute with all collected inputs
   */
  const executeWithInputs = useCallback(async () => {
    const signal = abortControllerRef.current?.signal;
    if (!signal || signal.aborted) return;

    hasExecutedOnceRef.current = true;
    const stdin = collectedInputsRef.current.join('\n');
    const result = await runViaProxy(codeRef.current, stdin, signal);

    if (signal.aborted) return;

    // Helper: apply delta output to avoid terminal flashing
    const applyDelta = (newOutput: string) => {
      if (newOutput.startsWith(previousOutputRef.current)) {
        const delta = newOutput.slice(previousOutputRef.current.length);
        if (delta.length > 0) {
          setOutput(prev => prev + delta);
        }
      } else {
        setOutput(newOutput);
      }
      previousOutputRef.current = newOutput;
    };

    if (result.isCompileError) {
      setOutput(result.output);
      previousOutputRef.current = "";
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }

    if (!result.success) {
      setOutput(prev => prev + result.output);
      previousOutputRef.current = "";
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }

    // Check if program completed (exit 0, not killed)
    if (result.exitCode === 0 && !result.wasKilled) {
      applyDelta(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }

    if (result.wasKilled) {
      // Program timed out waiting for more input
      applyDelta(result.output);
      setIsWaitingForInput(true);
      return;
    }

    // Fallback
    applyDelta(result.output);
    setIsRunning(false);
    setIsWaitingForInput(false);
  }, []);

  /**
   * Handle terminal input character by character
   */
  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;

    if (char === '\r' || char === '\n') {
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";

      // Track what user typed so delta calculation accounts for it
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
      setOutput(prev => prev + '^C\n');
    }
    else if (char.length === 1 && char >= ' ') {
      currentInputLineRef.current += char;
    }
  }, [isWaitingForInput, executeWithInputs]);

  /**
   * Stop execution
   */
  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsWaitingForInput(false);
    setOutput(prev => prev + '^C\n');
  }, []);

  /**
   * Run C code
   */
  const runCode = useCallback(async (code: string) => {
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    expectedInputCountRef.current = Math.max(1, countInputCalls(code));
    hasExecutedOnceRef.current = false;
    previousOutputRef.current = "";

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);

    if (hasInputFunctions(code)) {
      const prompt = extractPromptFromCode(code);
      setOutput(prompt);
      setIsWaitingForInput(true);
    } else {
      const signal = abortControllerRef.current.signal;
      const result = await runViaProxy(code, "", signal);

      if (signal.aborted) return;

      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  }, []);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
