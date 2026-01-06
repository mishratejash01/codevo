import { useState, useCallback, useRef } from 'react';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

interface CRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

/**
 * Detect if C code contains input functions that require stdin
 */
const hasInputFunctions = (code: string): boolean => {
  const inputPatterns = [
    /\bscanf\s*\(/,
    /\bgetchar\s*\(/,
    /\bgets\s*\(/,
    /\bfgets\s*\(/,
    /\bgetc\s*\(/,
    /\bfgetc\s*\(/,
    /\bfscanf\s*\(\s*stdin/,
  ];
  return inputPatterns.some(pattern => pattern.test(code));
};

/**
 * Count how many input calls exist in the code (approximate)
 */
const countInputCalls = (code: string): number => {
  const scanfMatches = code.match(/\bscanf\s*\(/g) || [];
  const getcharMatches = code.match(/\bgetchar\s*\(/g) || [];
  const getsMatches = code.match(/\bgets\s*\(/g) || [];
  const fgetsMatches = code.match(/\bfgets\s*\(/g) || [];
  return scanfMatches.length + getcharMatches.length + getsMatches.length + fgetsMatches.length;
};

/**
 * Extract prompt string from printf/puts before first input function (local, no network)
 */
const extractPromptFromCode = (code: string): string => {
  // Find position of first input function
  const inputPatterns = [
    /\bscanf\s*\(/,
    /\bgetchar\s*\(/,
    /\bgets\s*\(/,
    /\bfgets\s*\(/,
  ];
  
  let firstInputPos = code.length;
  for (const pattern of inputPatterns) {
    const match = pattern.exec(code);
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
      // Unescape basic sequences
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
        .replace(/\\\\/g, '\\') + '\n'; // puts adds newline
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

  /**
   * Execute code on Piston with given stdin
   */
  const runPiston = async (
    code: string, 
    stdin: string, 
    signal: AbortSignal,
    timeout: number = 30000
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
        const response = await fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'c',
            version: '10.2.0',
            files: [{ name: 'main.c', content: code }],
            stdin,
            compile_timeout: 10000,
            run_timeout: timeout,
          }),
          signal,
        });
        
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
          return { 
            success: false, 
            output: "\x1b[31mRate limit exceeded. Please wait.\x1b[0m", 
            exitCode: null,
            wasKilled: false,
            isCompileError: false
          };
        }
        
        const data = await response.json();
        
        // Check compile errors
        if (data.compile && data.compile.code !== 0) {
          return {
            success: false,
            output: getFriendlyError(data.compile.stderr || data.compile.output || "Compilation failed"),
            exitCode: data.compile.code,
            wasKilled: false,
            isCompileError: true
          };
        }
        
        if (data.run) {
          const stdout = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const exitCode = data.run.code;
          const runSignal = data.run.signal;
          
          // Check if program was killed (timeout/sigkill = waiting for input)
          const wasKilled = runSignal === 'SIGKILL' || 
                           stderr.toLowerCase().includes('timeout') ||
                           stderr.toLowerCase().includes('time limit');
          
          // Runtime error (segfault, etc.)
          if (exitCode !== 0 && !wasKilled) {
            return {
              success: false,
              output: getFriendlyError(stdout + stderr),
              exitCode,
              wasKilled: false,
              isCompileError: false
            };
          }
          
          return {
            success: true,
            output: stdout,
            exitCode,
            wasKilled,
            isCompileError: false
          };
        }
        
        return { 
          success: false, 
          output: "No response from server", 
          exitCode: null,
          wasKilled: false,
          isCompileError: false
        };
        
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { 
            success: false, 
            output: "^C\nExecution stopped.", 
            exitCode: null,
            wasKilled: false,
            isCompileError: false
          };
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return { 
          success: false, 
          output: `\x1b[31mNetwork Error: ${e.message}\x1b[0m`, 
          exitCode: null,
          wasKilled: false,
          isCompileError: false
        };
      }
    }
    
    return { 
      success: false, 
      output: "Failed after retries", 
      exitCode: null,
      wasKilled: false,
      isCompileError: false
    };
  };

  /**
   * Execute with all collected inputs
   */
  const executeWithInputs = useCallback(async () => {
    const signal = abortControllerRef.current?.signal;
    if (!signal || signal.aborted) return;
    
    hasExecutedOnceRef.current = true;
    const stdin = collectedInputsRef.current.join('\n');
    const result = await runPiston(codeRef.current, stdin, signal, 30000);
    
    if (signal.aborted) return;
    
    if (result.isCompileError) {
      // Compile error - show and stop
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }
    
    if (!result.success) {
      // Runtime error - show and stop
      setOutput(prev => prev + result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }
    
    // Check if program completed (exit 0, not killed)
    if (result.exitCode === 0 && !result.wasKilled) {
      // Program finished successfully - show full output
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }
    
    if (result.wasKilled) {
      // Program timed out waiting for more input
      // Show current output and wait for more input
      setOutput(result.output);
      setIsWaitingForInput(true);
      return;
    }
    
    // Fallback - show output
    setOutput(result.output);
    setIsRunning(false);
    setIsWaitingForInput(false);
  }, []);

  /**
   * Handle terminal input character by character
   */
  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;
    
    if (char === '\r' || char === '\n') {
      // Enter key - submit input line
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";
      
      // Add the input to collected inputs
      collectedInputsRef.current.push(inputValue);
      
      // Execute with all collected inputs
      setIsWaitingForInput(false);
      executeWithInputs();
    }
    else if (char === '\x7f' || char === '\b') {
      // Backspace - remove last char from buffer
      if (currentInputLineRef.current.length > 0) {
        currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
      }
    }
    else if (char === '\x03') {
      // Ctrl+C - abort
      abortControllerRef.current?.abort();
      currentInputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      setOutput(prev => prev + '^C\n');
    }
    else if (char.length === 1 && char >= ' ') {
      // Regular character - buffer it (terminal handles visual echo)
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
    // Reset everything
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    expectedInputCountRef.current = Math.max(1, countInputCalls(code));
    hasExecutedOnceRef.current = false;
    
    // Cancel any previous execution
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    
    // Check if code has input functions
    if (hasInputFunctions(code)) {
      // Extract prompt locally (no network call)
      const prompt = extractPromptFromCode(code);
      
      // Show prompt immediately and wait for input
      setOutput(prompt);
      setIsWaitingForInput(true);
      // Keep isRunning=true so Terminate button works
    } else {
      // No input functions - just run immediately
      const signal = abortControllerRef.current.signal;
      const result = await runPiston(code, "", signal, 30000);
      
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
