import { useState, useEffect } from 'react';

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

// --- GLOBAL SINGLETON (Keeps Python alive across reloads) ---
// We store the instance outside the hook so it doesn't reload when the component re-renders.
let pyodideInstance: any = null;
let isPyodideLoading = false;
let pyodideReadyPromise: Promise<any> | null = null;

export const usePyodide = () => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // 1. Load Pyodide Once (Singleton Pattern)
  useEffect(() => {
    const initPyodide = async () => {
      // If already loaded, just set ready and exit
      if (pyodideInstance) {
        setIsReady(true);
        return;
      }

      // If currently loading, wait for it
      if (isPyodideLoading) {
        if (pyodideReadyPromise) await pyodideReadyPromise;
        setIsReady(true);
        return;
      }

      isPyodideLoading = true;
      try {
        // A. Inject the script tag if missing
        if (!document.getElementById('pyodide-script')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            script.id = 'pyodide-script';
            document.body.appendChild(script);
            await new Promise((resolve) => { script.onload = resolve; });
        }

        // B. Initialize Pyodide
        pyodideReadyPromise = window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        const pyodide = await pyodideReadyPromise;
        
        // C. Setup Input (Popup Prompt)
        // This guarantees input works even if the browser blocks SharedArrayBuffer
        pyodide.setStdin({
            stdin: () => {
                const result = window.prompt("Python Input Required:");
                return result ? result : "";
            }
        });

        // D. Setup Initial Output Redirection
        pyodide.setStdout({ batched: (text: string) => { console.log(text); } });
        pyodide.setStderr({ batched: (text: string) => { console.log(text); } });

        pyodideInstance = pyodide;
        setIsReady(true);
      } catch (err) {
        console.error("Pyodide Load Failed:", err);
        setOutput("Error loading Python environment. Please refresh the page.");
      } finally {
        isPyodideLoading = false;
      }
    };

    initPyodide();
  }, []);

  // 2. Run Code Function
  const runCode = async (code: string) => {
    if (!pyodideInstance) return;
    
    setIsRunning(true);
    setOutput(""); // Clear the output state to trigger Terminal reset

    // Redirect output to THIS specific component's state
    pyodideInstance.setStdout({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });
    pyodideInstance.setStderr({ batched: (text: string) => setOutput((prev) => prev + text + "\n") });

    try {
        // CLEANUP: Wipe variables from previous run so it feels fresh
        // This prevents "x = 10" from the previous run affecting the current one.
        await pyodideInstance.runPythonAsync("globals().clear()"); 
        
        // NOW RUN USER CODE
        await pyodideInstance.runPythonAsync(code);
    } catch (err: any) {
        setOutput((prev) => prev + `\r\nTraceback (most recent call last):\n${err.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  // Safe Mode doesn't support writing input directly to terminal (uses Prompt)
  // We keep this function empty to satisfy the interface expected by Compiler.tsx
  const writeInputToWorker = (text: string) => {
     // Optional: You could echo this to the terminal if you wanted
  };

  return { runCode, output, isRunning, isReady, writeInputToWorker };
};
