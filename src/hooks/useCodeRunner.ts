import { useState } from 'react';

// Same-origin proxy -> Vercel serverless function (api/execute.js)
// Primary: Judge0 CE, Fallback: Wandbox — zero CORS issues
const EXECUTE_API = '/api/execute';

export type Language = 'python' | 'java' | 'cpp' | 'c' | 'javascript' | 'typescript' | 'sql' | 'bash';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

// Parse common errors into friendly messages
const getFriendlyError = (rawError: string, language: Language): string => {
  const lowerError = rawError.toLowerCase();

  // Java specific errors
  if (language === 'java') {
    if (lowerError.includes('class') && lowerError.includes('public') && lowerError.includes('should be declared in a file')) {
      return "Error: Your public class must be named 'Main' (case-sensitive).\n\nMake sure your code starts with:\npublic class Main { ... }";
    }
    if (lowerError.includes('nosuchelementexception')) {
      return "Error: Your code is waiting for input, but none was provided!\n\nAdd your inputs in the 'Input' tab before running.";
    }
    if (lowerError.includes('cannot find symbol')) {
      return rawError + "\n\n💡 Tip: Check for typos in variable/method names, or missing imports.";
    }
    if (lowerError.includes('arrayindexoutofboundsexception')) {
      return rawError + "\n\n💡 Tip: You're accessing an array index that doesn't exist. Check your loop bounds.";
    }
    if (lowerError.includes('nullpointerexception')) {
      return rawError + "\n\n💡 Tip: You're trying to use a variable that is null. Initialize it first.";
    }
  }

  // C/C++ specific errors
  if (language === 'cpp' || language === 'c') {
    if (lowerError.includes('segmentation fault') || lowerError.includes('sigsegv')) {
      return "Segmentation Fault: Memory access error!\n\n💡 Common causes:\n- Accessing array out of bounds\n- Dereferencing null pointer\n- Stack overflow from infinite recursion";
    }
    if (lowerError.includes('undefined reference to `main\'')) {
      return "Error: Missing main() function.\n\nYour C/C++ program must have a main function:\nint main() { ... }";
    }
    if (lowerError.includes('was not declared in this scope')) {
      return rawError + "\n\n💡 Tip: Check for typos or missing #include statements.";
    }
  }

  // JavaScript specific errors
  if (language === 'javascript') {
    if (lowerError.includes('referenceerror') && lowerError.includes('is not defined')) {
      return rawError + "\n\n💡 Tip: Check for typos in variable names, or make sure you declared the variable.";
    }
    if (lowerError.includes('typeerror')) {
      return rawError + "\n\n💡 Tip: You're trying to use a value in a way that's not allowed (e.g., calling a non-function).";
    }
  }

  // Python specific errors
  if (language === 'python') {
    if (lowerError.includes('eoferror') || lowerError.includes('eof when reading')) {
      return "EOF Error: Your code expected input but none was provided!\n\nAdd your inputs in the 'Input' tab before running.";
    }
    if (lowerError.includes('indentationerror')) {
      return rawError + "\n\n💡 Tip: Python uses indentation for code blocks. Make sure your tabs/spaces are consistent.";
    }
    if (lowerError.includes('modulenotfounderror') || lowerError.includes('no module named')) {
      return rawError + "\n\n💡 Tip: This module is not available in the online compiler. Try using standard library modules.";
    }
  }

  // Generic timeout error
  if (lowerError.includes('time limit') || lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return "Time Limit Exceeded!\n\n💡 Your code took too long to execute. Possible causes:\n- Infinite loop\n- Inefficient algorithm\n- Waiting for input that wasn't provided";
  }

  // Generic memory error
  if (lowerError.includes('memory') || lowerError.includes('out of memory') || lowerError.includes('killed')) {
    return "Memory Limit Exceeded!\n\n💡 Your code used too much memory. Check for:\n- Very large arrays\n- Memory leaks\n- Infinite recursion";
  }

  return rawError;
};

export const useCodeRunner = () => {
  const [loading, setLoading] = useState(false);

  const runViaProxy = async (language: Language, code: string, stdin: string = "") => {
    try {
      const response = await fetch(EXECUTE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language, stdin }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Server error (${response.status})`);
      }

      const data = await response.json();

      // Compile error
      if (data.isCompileError) {
        return { success: false, output: getFriendlyError(data.stderr || "Compilation failed", language), error: data.stderr };
      }

      // Success
      if (data.code === 0) {
        return { success: true, output: (data.stdout || "").trim() };
      }

      // TLE
      if (data.code === -1 || data.signal === 'SIGKILL') {
        return { success: false, output: getFriendlyError("Time Limit Exceeded", language), error: "TLE" };
      }

      // Runtime / other error
      const errorMsg = data.stderr || "Execution failed";
      return { success: false, output: getFriendlyError(errorMsg, language), error: errorMsg };
    } catch (e: any) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        return {
          success: false,
          output: "Network Error: Could not connect to the code execution server.\n\n💡 Check your internet connection and try again.",
          error: e.message
        };
      }
      return { success: false, output: `Error: ${e.message}`, error: e.message };
    }
  };

  const executeCode = async (
    language: Language,
    code: string,
    input: string = ""
  ): Promise<ExecutionResult> => {
    setLoading(true);
    let result: ExecutionResult = { success: false, output: "" };

    try {
      result = await runViaProxy(language, code, input);
    } catch (err: any) {
      result = { success: false, output: getFriendlyError(err.message, language), error: err.message };
    } finally {
      setLoading(false);
    }

    return result;
  };

  return { executeCode, loading };
};
