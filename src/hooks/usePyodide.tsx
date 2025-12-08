import { useState, useEffect, useRef } from 'react';

// INTELLIGENT PYTHON RUNNER SCRIPT
const PYTHON_TEST_RUNNER_SCRIPT = `
import sys
import io
import js
import traceback

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

    sys.stdin = io.StringIO(input_str)
    old_stdout = sys.stdout
    sys.stdout = JSWriter()
    
    try:
        # Execute with clean globals
        exec(user_code, {})
        return {"success": True}
    except BaseException:
        # Catch ALL errors including SyntaxError, NameError, SystemExit
        error_msg = traceback.format_exc()
        return {"success": False, "error": error_msg}
    finally:
        sys.stdout = old_stdout
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

      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true, output: "" }; 
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
