import { useState } from 'react';

// Piston API
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

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

// Get the correct file name for Piston based on language
const getFileName = (language: string): string => {
  switch (language) {
    case 'java': return 'Main.java';
    case 'python': return 'main.py';
    case 'cpp': return 'main.cpp';
    case 'c': return 'main.c';
    case 'javascript': return 'main.js';
    case 'typescript': return 'main.ts';
    default: return 'main';
  }
};

export const useCodeRunner = () => {
  const [loading, setLoading] = useState(false);

  const runPiston = async (language: string, version: string, code: string, stdin: string = "", langType: Language) => {
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          version,
          files: [{ name: getFileName(language), content: code }],
          stdin,
        }),
      });
      const data = await response.json();
      
      if (data.run) {
        const stdout = data.run.stdout || "";
        const stderr = data.run.stderr || "";
        const output = data.run.output || ""; 
        const finalOutput = output ? output : (stdout + stderr).trim();
        const isError = data.run.code !== 0 || stderr.length > 0;

        return {
          success: !isError,
          output: isError ? getFriendlyError(finalOutput, langType) : finalOutput,
          error: isError ? finalOutput : undefined 
        };
      }
      return { success: false, output: "Execution failed to start. Please try again.", error: "Execution failed" };
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
      switch (language) {
        case 'python': result = await runPiston('python', '3.10.0', code, input, language); break;
        case 'javascript': result = await runPiston('javascript', '18.15.0', code, input, language); break;
        case 'typescript': result = await runPiston('typescript', '5.0.3', code, input, language); break;
        case 'java': result = await runPiston('java', '15.0.2', code, input, language); break;
        case 'cpp': result = await runPiston('cpp', '10.2.0', code, input, language); break;
        case 'c': result = await runPiston('c', '10.2.0', code, input, language); break;
        case 'sql': result = await runPiston('sqlite3', '3.36.0', code, input, language); break;
        case 'bash': result = await runPiston('bash', '5.0.0', code, input, language); break;
        default: result = { success: false, output: "Language not supported", error: "Unsupported language" };
      }
    } catch (err: any) {
      result = { success: false, output: getFriendlyError(err.message, language), error: err.message };
    } finally {
      setLoading(false);
    }

    return result;
  };

  return { executeCode, loading };
};
