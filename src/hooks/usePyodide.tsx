import { useState, useEffect } from 'react';

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore
        const pyodideModule = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        setPyodide(pyodideModule);
        setLoading(false);
      } catch (err) {
        setError('Failed to load Pyodide');
        setLoading(false);
      }
    };

    loadPyodide();
  }, []);

  const runCode = async (code: string, input: string = '') => {
    if (!pyodide) throw new Error('Pyodide not loaded');

    try {
      // Set up input handling
      if (input) {
        pyodide.globals.set('__input__', input);
      }

      // Capture stdout
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run user code
      await pyodide.runPythonAsync(code);

      // Get output
      const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

      return {
        success: !stderr,
        output: stdout || '',
        error: stderr || null,
      };
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: err.message,
      };
    }
  };

  return { pyodide, loading, error, runCode };
};
