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
 * Find where the prompt ends (before user would type input)
 * Returns the index right after the prompt text
 */
const findPromptEndIndex = (output: string): number => {
  // Common prompt endings
  const promptEndings = [': ', '? ', '> ', ':', '?', '>'];
  
  let maxIndex = -1;
  
  for (const ending of promptEndings) {
    const idx = output.lastIndexOf(ending);
    if (idx !== -1) {
      maxIndex = Math.max(maxIndex, idx + ending.length);
    }
  }
  
  // If no prompt found but output doesn't end with newline, 
  // the whole output is the prompt
  if (maxIndex === -1 && output.length > 0 && !output.endsWith('\n')) {
    maxIndex = output.length;
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
  const lastShownOutputRef = useRef<string>("");

  /**
   * Execute code on Piston with given stdin
   */
  const runPiston = async (
    code: string, 
    stdin: string, 
    signal: AbortSignal
  ): Promise<{ 
    success: boolean; 
    output: string; 
    needsInput: boolean; 
    isCompileError: boolean;
    programCompleted: boolean;
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
            run_timeout: 5000, // Shorter timeout to detect input needs faster
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
            needsInput: false, 
            isCompileError: false,
            programCompleted: true
          };
        }
        
        const data = await response.json();
        
        // Check compile errors
        if (data.compile && data.compile.code !== 0) {
          return {
            success: false,
            output: getFriendlyError(data.compile.stderr || data.compile.output || "Compilation failed"),
            needsInput: false,
            isCompileError: true,
            programCompleted: true
          };
        }
        
        if (data.run) {
          const stdout = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const exitCode = data.run.code;
          const signal = data.run.signal;
          
          // Check if program was killed (timeout/sigkill = waiting for input)
          const wasKilled = signal === 'SIGKILL' || 
                           stderr.toLowerCase().includes('timeout') ||
                           stderr.toLowerCase().includes('time limit');
          
          // Program completed successfully if:
          // - Exit code is 0
          // - Not killed by signal
          // - No timeout
          const programCompleted = exitCode === 0 && !wasKilled;
          
          if (programCompleted) {
            // Program finished successfully - return full output
            return {
              success: true,
              output: stdout,
              needsInput: false,
              isCompileError: false,
              programCompleted: true
            };
          }
          
          if (wasKilled && stdout.length > 0) {
            // Program timed out with output - needs input
            // Only show up to the prompt, not any garbage after
            const promptEnd = findPromptEndIndex(stdout);
            const cleanOutput = promptEnd > 0 ? stdout.slice(0, promptEnd) : stdout;
            
            return {
              success: true,
              output: cleanOutput,
              needsInput: true,
              isCompileError: false,
              programCompleted: false
            };
          }
          
          if (wasKilled && stdout.length === 0) {
            // Timed out with no output - might be waiting for input at start
            return {
              success: true,
              output: "",
              needsInput: true,
              isCompileError: false,
              programCompleted: false
            };
          }
          
          // Runtime error (not timeout related)
          if (exitCode !== 0) {
            return {
              success: false,
              output: getFriendlyError(stdout + stderr),
              needsInput: false,
              isCompileError: false,
              programCompleted: true
            };
          }
          
          return {
            success: true,
            output: stdout,
            needsInput: false,
            isCompileError: false,
            programCompleted: true
          };
        }
        
        return { 
          success: false, 
          output: "No response from server", 
          needsInput: false, 
          isCompileError: false,
          programCompleted: true
        };
        
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { 
            success: false, 
            output: "^C\nExecution stopped.", 
            needsInput: false, 
            isCompileError: false,
            programCompleted: true
          };
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return { 
          success: false, 
          output: `\x1b[31mNetwork Error: ${e.message}\x1b[0m`, 
          needsInput: false, 
          isCompileError: false,
          programCompleted: true
        };
      }
    }
    
    return { 
      success: false, 
      output: "Failed after retries", 
      needsInput: false, 
      isCompileError: false,
      programCompleted: true
    };
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
    
    if (currentExecution !== executionCountRef.current) return;
    if (signal.aborted) return;
    
    if (result.programCompleted) {
      // Program finished - show full output and stop
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
      lastShownOutputRef.current = result.output;
    } else if (result.needsInput) {
      // Program needs input
      // For re-runs: only show NEW output (after what was already shown)
      const previouslyShown = lastShownOutputRef.current;
      
      if (result.output.startsWith(previouslyShown)) {
        // Output includes previous output - only add the new part
        const newPart = result.output.slice(previouslyShown.length);
        if (newPart.length > 0) {
          setOutput(prev => prev + newPart);
          lastShownOutputRef.current = result.output;
        }
      } else {
        // First run or output changed completely
        setOutput(result.output);
        lastShownOutputRef.current = result.output;
      }
      
      setIsWaitingForInput(true);
    } else {
      // Error case
      setOutput(result.output);
      setIsRunning(false);
      setIsWaitingForInput(false);
    }
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
      
      // Update what we've "shown" to include the echoed input + newline
      // This prevents re-showing prompts on re-execution
      lastShownOutputRef.current += inputValue + '\n';
      
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
      setOutput(prev => prev + '\n^C\n');
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
    setOutput(prev => prev + '\n^C\n');
  }, []);

  /**
   * Run C code
   */
  const runCode = useCallback((code: string) => {
    // Reset everything
    codeRef.current = code;
    collectedInputsRef.current = [];
    currentInputLineRef.current = "";
    lastShownOutputRef.current = "";
    
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
