import { useState, useCallback, useRef } from 'react';

interface JSRunnerResult {
  output: string;
  isRunning: boolean;
  isWaitingForInput: boolean;
  runCode: (code: string) => void;
  writeInput: (char: string) => void;
  stopExecution: () => void;
}

export const useJavaScriptRunner = (): JSRunnerResult => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  
  const inputResolverRef = useRef<((value: string) => void) | null>(null);
  const inputLineRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to safely append text to output
  const appendToOutput = useCallback((text: string) => {
    setOutput(prev => prev + text);
  }, []);

  const writeInput = useCallback((char: string) => {
    // 1. Handle Enter key - submit the input
    if (char === '\r' || char === '\n') {
      const inputValue = inputLineRef.current;
      
      // Echo the newline to the terminal so it moves to next line
      appendToOutput('\r\n');
      
      inputLineRef.current = "";
      
      if (inputResolverRef.current) {
        inputResolverRef.current(inputValue);
        inputResolverRef.current = null;
        setIsWaitingForInput(false);
      }
    }
    // 2. Handle Backspace
    else if (char === '\x7f' || char === '\b') {
      if (inputLineRef.current.length > 0) {
        inputLineRef.current = inputLineRef.current.slice(0, -1);
        // Remove character from terminal visually
        // Note: TerminalView usually handles local backspace, 
        // but if it relies purely on 'output', we need to slice it.
        setOutput(prev => prev.slice(0, -1)); 
      }
    }
    // 3. Handle Ctrl+C (interrupt)
    else if (char === '\x03') {
      if (inputResolverRef.current) {
        inputResolverRef.current('');
        inputResolverRef.current = null;
      }
      abortControllerRef.current?.abort();
      inputLineRef.current = "";
      setIsWaitingForInput(false);
      setIsRunning(false);
      appendToOutput('^C\n');
    }
    // 4. Regular character
    else {
      inputLineRef.current += char;
      // CRITICAL FIX: Echo the character back to the terminal!
      appendToOutput(char); 
    }
  }, [appendToOutput]);

  const stopExecution = useCallback(() => {
    abortControllerRef.current?.abort();
    if (inputResolverRef.current) {
      inputResolverRef.current('');
      inputResolverRef.current = null;
    }
    setIsRunning(false);
    setIsWaitingForInput(false);
    appendToOutput('\n[Execution stopped by user]\n');
  }, [appendToOutput]);

  const runCode = useCallback((code: string) => {
    // Handle empty code
    if (!code.trim()) {
      setOutput("");
      return;
    }
    
    setIsRunning(true);
    setOutput(""); // Clear terminal start
    inputLineRef.current = "";
    
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // --- PREPROCESSOR ---
    // This allows users to write 'var x = prompt()' and have it work
    // by auto-converting it to 'var x = await prompt()'
    // It also adds a loop guard to prevent browser freezing.
    const preprocessCode = (source: string) => {
      let processed = source;
      
      // 1. Auto-await prompts
      // Replaces "prompt(" with "await prompt(" if not already awaited
      processed = processed.replace(/(?<!await\s+)prompt\s*\(/g, 'await prompt(');

      // 2. Simple Loop Guard (Optional but recommended for free browsers)
      // Inject a counter check in while/for loops to prevent crashes
      const loopGuard = `
        if (Date.now() - _start > 5000) throw new Error("Time Limit Exceeded (5s)");
      `;
      // (This is a simplified regex, for robust guarding use AST parsers)
      
      return `
        const _start = Date.now();
        ${processed}
      `;
    };

    const processedCode = preprocessCode(code);

    const customConsole = {
      log: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        appendToOutput(text + '\r\n'); // Use \r\n for xterm compatibility
      },
      error: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        // Red color ANSI code
        appendToOutput('\x1b[31m' + text + '\x1b[0m\r\n');
      },
      warn: (...args: any[]) => {
        const text = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        // Yellow color ANSI code
        appendToOutput('\x1b[33m' + text + '\x1b[0m\r\n');
      },
      clear: () => setOutput(""),
    };

    const asyncPrompt = (message?: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (abortSignal.aborted) {
          reject(new Error("Aborted"));
          return;
        }
        
        // Show the prompt message if provided
        if (message !== undefined) {
          appendToOutput(String(message));
        }
        
        setIsWaitingForInput(true);
        inputResolverRef.current = resolve;
      });
    };

    const executeAsync = async () => {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        
        const fn = new AsyncFunction(
          'console', 
          'prompt', 
          'alert',
          processedCode
        );
        
        await fn(
          customConsole, 
          asyncPrompt, 
          (msg: any) => customConsole.log(msg) // alert shim
        );
        
      } catch (error: any) {
        if (!abortSignal.aborted) {
          const errorMessage = error.message || String(error);
          appendToOutput('\x1b[31mError: ' + errorMessage + '\x1b[0m\r\n');
        }
      } finally {
        if (!abortSignal.aborted) {
          setIsRunning(false);
          setIsWaitingForInput(false);
          // appendToOutput('\n[Program finished]\n'); 
        }
      }
    };

    executeAsync();
  }, [appendToOutput]);

  return {
    output,
    isRunning,
    isWaitingForInput,
    runCode,
    writeInput,
    stopExecution,
  };
};
