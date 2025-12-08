import { useState, useEffect, useRef } from 'react';

// INTELLIGENT PYTHON RUNNER SCRIPT
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import io
import js
import traceback

# Class to redirect stdout to Javascript callback
class JSWriter:
    def write(self, string):
        try:
            js.handlePythonOutput(string)
        except:
            pass
    def flush(self):
        pass

def _run_code_with_streams(user_code, input_str):
    # Imports inside to ensure availability
    import sys
    import io
    import traceback

    # 1. Setup Stdin
    sys.stdin = io.StringIO(input_str)
    
    # 2. Setup Stdout & Stderr (Both Redirected to JS)
    # This ensures warnings and errors print to the terminal too
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    writer = JSWriter()
    sys.stdout = writer
    sys.stderr = writer # Redirect stderr to the same place!
    
    try:
        # Execute with clean globals
        exec(user_code, {})
        return {"success": True}
    except BaseException:
        # CRITICAL FIX: Print the error directly to the stream!
        # This ensures it shows up in the UI immediately.
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
      const resultProxy = runner(code, stdin);
      const result = resultProxy.toJs();
      resultProxy.destroy();

      // @ts-ignore
      delete window.handlePythonOutput;

      // Error is already printed to stream, so we don't need to return it
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
