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
  const expectedInputCountRef = useRef<number>(0);
  const initialPromptRef = useRef<string>("");

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
   * Fetch initial prompt by running with short timeout
   */
  const fetchInitialPrompt = useCallback(async (): Promise<string> => {
    const signal = abortControllerRef.current?.signal;
    if (!signal || signal.aborted) return "";
    
    // Run with very short timeout just to capture printf output before scanf
    const result = await runPiston(codeRef.current, "", signal, 500);
    
    if (signal.aborted) return "";
    
    // If compile error, show it and stop
    if (result.isCompileError) {
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return "";
    }
    
    // Return whatever output was captured (the prompt)
    return result.output;
  }, []);

  /**
   * Execute with all collected inputs
   */
  const executeWithInputs = useCallback(async () => {
    const signal = abortControllerRef.current?.signal;
    if (!signal || signal.aborted) return;
    
    const stdin = collectedInputsRef.current.join('\n');
    const result = await runPiston(codeRef.current, stdin, signal, 30000);
    
    if (signal.aborted) return;
    
    if (!result.success) {
      // Error - show and stop
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }
    
    // Check if program completed (exit 0, not killed)
    if (result.exitCode === 0 && !result.wasKilled) {
      // Program finished successfully
      // Show only the NEW output (after the prompt + user inputs)
      const promptPart = initialPromptRef.current;
      const userInputsEchoed = collectedInputsRef.current.join('\n');
      
      // The full output includes: prompt + echoed input + rest of output
      // We need to show: rest of output (the part after user's input is processed)
      let finalOutput = result.output;
      
      // If output starts with the prompt, remove it (we already showed it)
      if (finalOutput.startsWith(promptPart)) {
        finalOutput = finalOutput.slice(promptPart.length);
      }
      
      // The echoed input might be in there too - it's OK, terminal already showed it
      // Just append the result to existing output
      setOutput(prev => {
        // prev contains: prompt + user typed input + newline
        // finalOutput might contain: echoed input + result
        // We want to show: prev + result (minus any duplicate echoed input)
        
        // Simple approach: just append the final output part
        // Skip any leading input echo
        const lastInput = collectedInputsRef.current[collectedInputsRef.current.length - 1];
        if (lastInput && finalOutput.startsWith(lastInput)) {
          finalOutput = finalOutput.slice(lastInput.length);
        }
        
        return prev + finalOutput;
      });
      
      setIsRunning(false);
      setIsWaitingForInput(false);
      return;
    }
    
    if (result.wasKilled) {
      // Program timed out - needs more input
      // Show any new prompt that appeared
      const currentPrompt = initialPromptRef.current;
      let newOutput = result.output;
      
      // Remove the part we've already shown
      if (newOutput.startsWith(currentPrompt)) {
        newOutput = newOutput.slice(currentPrompt.length);
      }
      
      // Remove echoed inputs
      for (const input of collectedInputsRef.current) {
        if (newOutput.startsWith(input)) {
          newOutput = newOutput.slice(input.length);
        }
        if (newOutput.startsWith('\n')) {
          newOutput = newOutput.slice(1);
        }
      }
      
      if (newOutput.length > 0) {
        setOutput(prev => prev + newOutput);
        initialPromptRef.current = result.output; // Update for next iteration
      }
      
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
      // Enter key - submit input
      const inputValue = currentInputLineRef.current;
      currentInputLineRef.current = "";
      
      // Add the input to collected inputs
      collectedInputsRef.current.push(inputValue);
      
      // Re-execute with all inputs
      setIsWaitingForInput(false);
      executeWithInputs();
    }
    else if (char === '\x7f' || char === '\b') {
      // Backspace
      if (currentInputLineRef.current.length > 0) {
        currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
      }
    }
    else if (char === '\x03') {
      // Ctrl+C
      abortControllerRef.current?.abort();
      currentInputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      setOutput(prev => prev + '^C\n');
    }
    else if (char.length === 1 && char >= ' ') {
      // Regular character - just buffer it (terminal handles echo)
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
    initialPromptRef.current = "";
    expectedInputCountRef.current = countInputCalls(code);
    
    setIsRunning(true);
    setOutput("");
    setIsWaitingForInput(false);
    
    abortControllerRef.current = new AbortController();
    
    // Check if code has input functions
    if (hasInputFunctions(code)) {
      // Fetch initial prompt first
      const prompt = await fetchInitialPrompt();
      
      if (abortControllerRef.current?.signal.aborted) return;
      
      // If we got an empty prompt or compile error handled, check if still running
      if (!isRunning) return;
      
      // Show prompt and wait for input
      initialPromptRef.current = prompt;
      setOutput(prompt);
      setIsWaitingForInput(true);
    } else {
      // No input functions - just run
      const signal = abortControllerRef.current.signal;
      const result = await runPiston(code, "", signal, 30000);
      
      if (signal.aborted) return;
      
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
  }, [fetchInitialPrompt]);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
