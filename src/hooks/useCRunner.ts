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
 * Detect if C program output is waiting for input
 * C programs typically use scanf, getchar, gets, fgets for input
 * When waiting, they usually print a prompt without newline
 */
const detectCPrompt = (output: string): boolean => {
  if (!output || output.length === 0) return false;
  
  // Rule 1: If output does NOT end with a newline, it's likely a prompt
  if (!output.endsWith('\n') && output.length > 0) {
    const lastLine = output.split('\n').pop() || '';
    // Only consider it a prompt if there's actual content
    if (lastLine.trim().length > 0) {
      return true;
    }
  }
  
  // Rule 2: Check for common prompt patterns
  const lines = output.split('\n');
  const lastLine = (lines[lines.length - 1] || '').trim();
  
  const promptPatterns = [
    /[:\?]\s*$/,           // Ends with : or ?
    />\s*$/,               // Ends with >
    /enter\s+.+[:\?]?\s*$/i,
    /input\s+.+[:\?]?\s*$/i,
    /type\s+.+[:\?]?\s*$/i,
    /please\s+.+[:\?]?\s*$/i,
    /^\s*$/,               // Empty last line after content (scanf waiting)
  ];
  
  for (const pattern of promptPatterns) {
    if (pattern.test(lastLine)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Find the last prompt position in output to truncate future garbage
 */
const findLastPromptIndex = (output: string): number => {
  const patterns = [/: /g, /\? /g, /> /g, /:$/gm, /\?$/gm, />$/gm];
  let maxIndex = -1;
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      maxIndex = Math.max(maxIndex, match.index + match[0].length);
    }
  }
  
  // Also check for output not ending with newline (prompt without delimiter)
  if (!output.endsWith('\n')) {
    const lastNewline = output.lastIndexOf('\n');
    if (lastNewline !== -1 && lastNewline < output.length - 1) {
      maxIndex = Math.max(maxIndex, output.length);
    }
  }
  
  return maxIndex;
};

/**
 * Get user-friendly error messages
 */
const getFriendlyError = (rawError: string): string => {
  const lowerError = rawError.toLowerCase();
  
  if (lowerError.includes('segmentation fault') || lowerError.includes('sigsegv')) {
    return "\x1b[31mSegmentation Fault: Memory access error!\x1b[0m";
  }
  
  if (lowerError.includes('time limit') || lowerError.includes('timeout') || lowerError.includes('sigkill')) {
    return "\x1b[33mTime Limit Exceeded (program may be waiting for input or stuck in loop)\x1b[0m";
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
  const executionCountRef = useRef<number>(0);

  /**
   * Execute code on Piston with given stdin
   */
  const runPiston = async (
    code: string, 
    stdin: string, 
    signal: AbortSignal
  ): Promise<{ success: boolean; output: string; needsInput: boolean; isCompileError: boolean }> => {
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
            run_timeout: 10000,
          }),
          signal,
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return { success: false, output: "\x1b[31mRate limit exceeded. Please wait and try again.\x1b[0m", needsInput: false, isCompileError: false };
        }
        
        const data = await response.json();
        
        // Check for compile errors first
        if (data.compile && data.compile.code !== 0) {
          return {
            success: false,
            output: getFriendlyError(data.compile.stderr || data.compile.output || "Compilation failed"),
            needsInput: false,
            isCompileError: true
          };
        }
        
        if (data.run) {
          const stdout = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const combinedOutput = stdout + stderr;
          const isError = data.run.code !== 0;
          
          const lowerError = stderr.toLowerCase();
          const isTimeoutOrKill = lowerError.includes('time limit') || 
                                   lowerError.includes('timeout') || 
                                   data.run.signal === 'SIGKILL';
          
          let finalOutput = stdout;
          let needsInput = false;
          
          // C-specific: Detect if waiting for input based on output pattern
          // When C program hits scanf/getchar without input, Piston will timeout
          // We detect this by checking:
          // 1. Output doesn't end with newline (prompt waiting)
          // 2. Timeout occurred but there's output (likely waiting for scanf)
          
          if (isTimeoutOrKill && stdout.length > 0) {
            // Program timed out with output - likely waiting for input
            const lastPromptIdx = findLastPromptIndex(stdout);
            if (lastPromptIdx > 0) {
              finalOutput = stdout.slice(0, lastPromptIdx);
            }
            needsInput = true;
          } else if (detectCPrompt(stdout)) {
            needsInput = true;
          } else if (isError && !isTimeoutOrKill && collectedInputsRef.current.length === 0 && stdout.length > 0) {
            // Error on first run with output - might need input
            needsInput = detectCPrompt(stdout);
          }
          
          // Handle actual runtime errors (not input-related)
          if (isError && !needsInput && !isTimeoutOrKill) {
            return {
              success: false,
              output: getFriendlyError(combinedOutput),
              needsInput: false,
              isCompileError: false
            };
          }
          
          return {
            success: true,
            output: finalOutput,
            needsInput,
            isCompileError: false
          };
        }
        
        return { success: false, output: "Execution failed - no response from server", needsInput: false, isCompileError: false };
        
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { success: false, output: "^C\nExecution stopped.", needsInput: false, isCompileError: false };
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return { success: false, output: `\x1b[31mNetwork Error: ${e.message}\x1b[0m`, needsInput: false, isCompileError: false };
      }
    }
    
    return { success: false, output: "Failed after multiple retries", needsInput: false, isCompileError: false };
  };

  /**
   * Execute with all collected inputs
   */
  const executeWithInputs = useCallback(async () => {
    const currentExecution = ++executionCountRef.current;
    const signal = abortControllerRef.current?.signal;
    
    if (!signal || signal.aborted) return;
    
    const stdin = collectedInputsRef.current.join('\n');
    const result = await runPiston(codeRef.current, stdin, signal);
    
    // Check if this is still the current execution
    if (currentExecution !== executionCountRef.current) return;
    if (signal.aborted) return;
    
    setOutput(result.output);
    
    if (result.isCompileError) {
      // Compilation error - stop execution
      setIsRunning(false);
      setIsWaitingForInput(false);
    } else if (result.needsInput) {
      // Program needs more input
      setIsWaitingForInput(true);
    } else {
      // Program completed
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  }, []);

  /**
   * Handle terminal input character by character
   * Terminal handles local echo, we just collect the input
   */
  const writeInput = useCallback((char: string) => {
    if (!isWaitingForInput) return;
    
    if (char === '\r' || char === '\n') {
      // Enter key - submit the input line
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";
      
      // Add to collected inputs
      collectedInputsRef.current.push(inputValue);
      
      // Re-execute with new input
      setIsWaitingForInput(false);
      executeWithInputs();
    }
    else if (char === '\x7f' || char === '\b') {
      // Backspace - remove last character from current input
      if (currentInputLineRef.current.length > 0) {
        currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
      }
    }
    else if (char === '\x03') {
      // Ctrl+C - abort execution
      abortControllerRef.current?.abort();
      currentInputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      setOutput(prev => prev + '\n^C\n\x1b[33mExecution interrupted\x1b[0m\n');
    }
    else if (char.length === 1 && char >= ' ') {
      // Regular printable character - add to input buffer
      // Note: Terminal handles local echo, we don't update output here
      currentInputLineRef.current += char;
    }
  }, [isWaitingForInput, executeWithInputs]);

  /**
   * Stop current execution
   */
  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    setIsWaitingForInput(false);
    setOutput(prev => prev + '\n^C\n\x1b[33mExecution stopped\x1b[0m\n');
  }, []);

  /**
   * Run C code
   */
  const runCode = useCallback((code: string) => {
    // Reset state
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Start execution
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
