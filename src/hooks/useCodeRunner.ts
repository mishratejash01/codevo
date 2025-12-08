import { useState } from 'react';
import { usePyodide } from './usePyodide';

// Piston API
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export type Language = 'python' | 'java' | 'cpp' | 'c' | 'javascript' | 'sql' | 'bash';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export const useCodeRunner = () => {
  const { runCode: runPython, loading: pythonLoading } = usePyodide();
  const [loading, setLoading] = useState(false);

  const runPiston = async (language: string, version: string, code: string, stdin: string = "") => {
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          version,
          files: [{ content: code }],
          stdin,
        }),
      });
      const data = await response.json();
      
      if (data.run) {
        // ROBUST ERROR HANDLING:
        // Piston returns stdout and stderr separately. 
        // If the code failed (code != 0), the error is usually in stderr.
        const output = data.run.output || "";
        const stderr = data.run.stderr || "";
        
        // If explicit error exists in stderr, prioritize showing it
        const finalOutput = (data.run.code !== 0 && stderr) ? stderr : output;

        return {
          success: data.run.code === 0,
          output: finalOutput,
          error: data.run.code !== 0 ? finalOutput : undefined 
        };
      }
      return { success: false, output: "", error: "Execution failed to start." };
    } catch (e: any) {
      return { success: false, output: "", error: `Network Error: ${e.message}` };
    }
  };

  const executeCode = async (
    language: Language, 
    code: string, 
    input: string = "",
    onOutput?: (text: string) => void
  ): Promise<ExecutionResult> => {
    setLoading(true);
    let result: ExecutionResult = { success: false, output: "" };

    try {
      switch (language) {
        case 'python':
          const pyResult = await runPython(code, input, onOutput); 
          result = { success: pyResult.success, output: "", error: pyResult.error };
          break;

        case 'javascript':
          result = await runPiston('javascript', '18.15.0', code, input);
          break;

        case 'java':
          result = await runPiston('java', '15.0.2', code, input);
          break;

        case 'cpp':
          result = await runPiston('cpp', '10.2.0', code, input);
          break;
          
        case 'c':
          result = await runPiston('c', '10.2.0', code, input);
          break;

        case 'sql':
          result = await runPiston('sqlite3', '3.36.0', code, input);
          break;

        case 'bash':
          result = await runPiston('bash', '5.0.0', code, input);
          break;

        default:
          result = { success: false, output: "Language not supported", error: "Unsupported language" };
      }
    } catch (err: any) {
      result = { success: false, output: "", error: err.message };
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
