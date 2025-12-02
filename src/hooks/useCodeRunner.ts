import { useState } from 'react';
import { usePyodide } from './usePyodide';

// Piston API Endpoint (Public Instance)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export type Language = 'python' | 'java' | 'c' | 'cpp' | 'javascript';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export const useCodeRunner = () => {
  const { runCode: runPython, runTestFunction: runPythonTests, loading: pythonLoading } = usePyodide();
  const [loading, setLoading] = useState(false);

  // Helper for Piston Execution
  const runPiston = async (language: string, version: string, code: string, stdin: string = "") => {
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          version,
          files: [{ content: code }],
          stdin: stdin, // Pass input for test cases here
        }),
      });
      const data = await response.json();
      
      if (data.run) {
        return {
          success: data.run.code === 0,
          output: data.run.output, // Combined stdout and stderr
          error: data.run.code !== 0 ? data.run.stderr : undefined
        };
      }
      return { success: false, output: "", error: "Execution failed" };
    } catch (e: any) {
      return { success: false, output: "", error: e.message };
    }
  };

  const executeCode = async (language: Language, code: string, input: string = ""): Promise<ExecutionResult> => {
    setLoading(true);
    let result: ExecutionResult = { success: false, output: "" };

    try {
      switch (language) {
        case 'python':
          // Use your existing Client-Side Pyodide
          // Note: Pyodide usually captures stdout via the hook setup, 
          // you might need to adapt it to accept 'stdin' if your Pyodide implementation supports input()
          const pyResult = await runPython(code); // Assuming runPython doesn't take input in your current impl
          result = { success: pyResult.success, output: pyResult.output || pyResult.error || "" };
          break;

        case 'javascript':
          // Use Piston for secure execution (Node.js)
          result = await runPiston('javascript', '18.15.0', code, input);
          break;

        case 'java':
          // Java requires a class name. Piston handles 'Main' usually.
          result = await runPiston('java', '15.0.2', code, input);
          break;

        case 'cpp':
          result = await runPiston('cpp', '10.2.0', code, input);
          break;
          
        case 'c':
          result = await runPiston('c', '10.2.0', code, input);
          break;

        default:
          result = { success: false, output: "Language not supported", error: "Unsupported language" };
      }
    } finally {
      setLoading(false);
    }

    return result;
  };

  return {
    executeCode,
    loading: loading || pythonLoading,
  };
};
