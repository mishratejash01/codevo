import { useState, useEffect, useRef } from 'react';

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

  const runCode = async (code: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');

    try {
      // Capture stdout
      pyodideRef.current.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);

      await pyodideRef.current.loadPackagesFromImports(code);
      await pyodideRef.current.runPythonAsync(code);

      const stdout = pyodideRef.current.runPython("sys.stdout.getvalue()");
      return { success: true, output: stdout };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // NEW: Function to run a specific test case against user code
  const runTestFunction = async (userCode: string, functionName: string, inputArgs: string) => {
    if (!pyodideRef.current) throw new Error('Pyodide not loaded');

    try {
      // 1. Load user code into the global scope
      await pyodideRef.current.runPythonAsync(userCode);

      // 2. Prepare the test execution script
      // We parse the input string (e.g., "[1, 2, 3]") into a Python object using ast.literal_eval
      // Then we call the function and compare the result
      const testScript = `
import ast
import sys
from io import StringIO

# Capture any print statements inside the function
sys.stdout = StringIO()

try:
    # Parse the input string into actual Python objects
    args = ast.literal_eval('${inputArgs}')
    
    # Check if input is a tuple (multiple args) or single arg
    if isinstance(args, tuple):
        result = ${functionName}(*args)
    else:
        result = ${functionName}(args)
        
    # Return the string representation of the result for comparison
    str(result)
except Exception as e:
    raise e
`;
      
      const result = await pyodideRef.current.runPythonAsync(testScript);
      const logs = pyodideRef.current.runPython("sys.stdout.getvalue()");
      
      return { success: true, result: result, logs: logs };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { pyodide, loading, runCode, runTestFunction };
};
