import { useState, useCallback, useRef } from 'react';
import { Language } from './useCodeRunner';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

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
  const lastLine = lines[lines.length - 1]; // Don't trim immediately to check for trailing newline
  
  // Rule 1: If output does NOT end with a newline, it's likely a prompt (e.g. "Enter number: ")
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

// Helper to find the last valid prompt in the output to handle Piston's lack of interactive stopping
const findLastPromptIndex = (output: string): number => {
  const patterns = [/: /g, /\? /g, /> /g, /:$/gm, /\?$/gm, />$/gm];
  let maxIndex = -1;
  
  // We scan for specific delimiters that signal a prompt might be here.
  // We check substrings up to these delimiters to see if they satisfy the prompt detection logic.
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

const getLanguageConfig = (language: Language): { pistonLang: string; version: string } => {
  switch (language) {
    case 'java': return { pistonLang: 'java', version: '15.0.2' };
    case 'cpp': return { pistonLang: 'cpp', version: '10.2.0' };
    case 'c': return { pistonLang: 'c', version: '10.2.0' };
    case 'typescript': return { pistonLang: 'typescript', version: '5.0.3' };
    case 'sql': return { pistonLang: 'sqlite3', version: '3.36.0' };
    case 'bash': return { pistonLang: 'bash', version: '5.0.0' };
    default: return { pistonLang: 'python', version: '3.10.0' };
  }
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

  const runPiston = async (
    code: string, 
    stdin: string, 
    signal: AbortSignal
  ): Promise<{ success: boolean; output: string; needsInput: boolean }> => {
    const { pistonLang, version } = getLanguageConfig(language);
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang,
            version,
            files: [{ content: code }],
            stdin,
          }),
          signal,
        });
        
        // Handle rate limiting
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            setOutput(prev => prev + `\n⏳ Server busy, retrying in ${delay/1000}s...\n`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return { success: false, output: "⚠️ Rate limit exceeded. Please wait a moment and try again.", needsInput: false };
        }
        
        const data = await response.json();
        
        if (data.run) {
          const stdout = data.run.stdout || "";
          const stderr = data.run.stderr || "";
          const combinedOutput = stdout + stderr;
          const isError = data.run.code !== 0;
          
          const lowerError = stderr.toLowerCase();
          
          // Enhanced logic to detect if the program is actually waiting for input
          // rather than just crashing with a timeout.
          const isTimeoutOrKill = lowerError.includes('time limit') || lowerError.includes('timeout') || data.run.signal === 'SIGKILL';
          const isCompiledLang = language === 'c' || language === 'cpp';

          let finalOutput = stdout;
          let forceInput = false;

          // C/C++ Fix: Piston runs to completion (EOF) or Timeout when input is missing.
          // This causes "future" output (e.g. infinite loops or next steps) to appear before the user types.
          // We scan for the last valid prompt and truncate the output there to simulate a pause.
          if (isCompiledLang) {
             const lastPromptIdx = findLastPromptIndex(combinedOutput);
             // If we found a prompt and there is text following it (garbage/future output)
             if (lastPromptIdx !== -1 && lastPromptIdx < combinedOutput.length) {
                finalOutput = combinedOutput.slice(0, lastPromptIdx);
                forceInput = true;
             }
          }

          const needsInput = (
            forceInput ||
            lowerError.includes('nosuchelementexception') ||
            lowerError.includes('eof when reading') ||
            lowerError.includes('eoferror') ||
            // If it timed out but produced output, assume it's waiting for input (C/C++ specific)
            (isError && isTimeoutOrKill && stdout.length > 0 && isCompiledLang) ||
            // Standard check for missing input on empty history
            (isError && collectedInputsRef.current.length === 0 && stdout.length > 0 && !isTimeoutOrKill)
          );
          
          return {
            success: !isError || forceInput,
            output: isError && !needsInput ? getFriendlyError(combinedOutput, language) : finalOutput,
            needsInput
          };
        }
        
        return { success: false, output: "Execution failed", needsInput: false };
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return { success: false, output: "^C\nExecution stopped.", needsInput: false };
        }
        
        // Network error - retry
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
    const result = await runPiston(codeRef.current, stdin, signal);
    
    if (currentExecution !== executionCountRef.current) return;
    if (signal.aborted) return;
    
    setOutput(result.output);
    
    // Check if we need more input based on Piston result or output analysis
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
      
      collectedInputsRef.current.push(inputValue);
      
      // FIXED: Commented out manual output update to prevent double echo on Enter
      // setOutput(prev => prev + '\n');
      
      setIsWaitingForInput(false);
      executeWithInputs();
    }
    else if (char === '\x7f' || char === '\b') {
      if (currentInputLineRef.current.length > 0) {
        currentInputLineRef.current = currentInputLineRef.current.slice(0, -1);
        
        // FIXED: Commented out manual output update to prevent double deletion echo
        // setOutput(prev => prev.slice(0, -1));
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
      
      // FIXED: Commented out manual output update to prevent double echo
      // TerminalView already echoes the character locally
      // setOutput(prev => prev + char);
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
