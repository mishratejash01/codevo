import { useState, useEffect, useRef } from 'react';

// INTELLIGENT PYTHON RUNNER SCRIPT
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import io
import js
import traceback

# 1. Class to redirect stdout to Javascript callback
class JSWriter:
    def write(self, string):
        try:
            js.handlePythonOutput(string)
        except:
            pass
    def flush(self):
        pass

# 2. Class to handle Input Interactively (VS Code Style)
class InteractiveStdin:
    def __init__(self, initial_input):
        # Store initial batch input (from the Input tab)
        self.buffer = io.StringIO(initial_input)

    def readline(self, size=-1):
        # First, try to read from the "Standard Input" tab
        line = self.buffer.readline(size)
        if line:
            return line
        
        # If that's empty/exhausted, pause and ask the user via Browser Prompt
        try:
            # prompt() blocks the main thread, effectively "pausing" Python
            user_input = js.prompt("Python Requesting Input:")
            
            if user_input is None: # User clicked Cancel
                return "" # Return EOF (End of File)
            
            # ECHO: Print what the user typed so it shows in the Output tab
            # This mimics a real terminal experience
            print(user_input)
            
            return str(user_input) + "\\n"
        except:
            return ""

    def read(self, size=-1):
        return self.buffer.read(size)

def _run_code_with_streams(user_code, input_str):
    # Imports inside to ensure availability
    import sys
    import io
    import traceback

    # 1. Setup Interactive Stdin
    # This wrapper handles both "Batch Input" and "Popup Input"
    sys.stdin = InteractiveStdin(input_str)
    
    # 2. Setup Stdout & Stderr (Both Redirected to JS)
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    writer = JSWriter()
    sys.stdout = writer
    sys.stderr = writer 
    
    try:
        # Execute with clean globals
        exec(user_code, {})
        return {"success": True}
    except BaseException:
        # Print error to stream so it appears in the UI
        print(traceback.format_exc())
        return {"success": False}
    finally:
        # Restore original streams
        sys.stdout = old_stdout
        sys.stderr = old_stderr
`;

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore
        const pyodideModule = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        
        await pyodideModule.runPythonAsync(PYTHON_TEST_RUNNER_SCRIPT);
        
        pyodideRef.current = pyodideModule;
        setPyodide(pyodideModule);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setLoading(false);
      }
    };

    loadPyodide();
  }, []);

  const runCode = async (code: string, stdin: string = "", onOutput?: (text: string) => void) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');
    
    // @ts-ignore
    window.handlePythonOutput = (text: string) => {
      if (onOutput) onOutput(text);
    };

    try {
      const runner = pyodideRef.current.globals.get("_run_code_with_streams");
      // Note: We pass the 'stdin' string here. 
      // Our new Python class will use this string first, then fallback to prompt().
      const resultProxy = runner(code, stdin);
      const result = resultProxy.toJs();
      resultProxy.destroy();

      // @ts-ignore
      delete window.handlePythonOutput;

      return { success: result.success, output: "" }; 
    } catch (err: any) {
      // @ts-ignore
      delete window.handlePythonOutput;
      return { success: false, error: err.message };
    }
  };

  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
     return { success: false, error: "Not implemented for Compiler view" };
  };

  return { pyodide, loading, runCode, runTestFunction };
};
