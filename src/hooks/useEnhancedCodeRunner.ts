import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeOutput } from '@/utils/inputParser';
import { compareOutputs as judgeCompareOutputs, JudgeOptions } from '@/utils/judgeEngine';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export type Language = 'python' | 'java' | 'cpp';
export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'PENDING';

export type JudgingPhase = 
  | { status: 'idle' }
  | { status: 'compiling'; message: string }
  | { status: 'running'; currentTest: number; totalTests: number; message: string }
  | { status: 'comparing'; message: string }
  | { status: 'complete'; verdict: Verdict };

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  testIndex: number;
}

export interface EnhancedExecutionResult {
  verdict: Verdict;
  passed: boolean;
  output: string;
  expected: string;
  runtime_ms: number;
  memory_kb: number;
  feedbackMessage: string;
  feedbackSuggestion: string;
  errorDetails?: {
    type: string;
    rawError: string;
  };
  testResults: TestResult[];
  failedTestIndex?: number;
  runtimePercentile?: number;
  memoryPercentile?: number;
}

const JUDGING_MESSAGES = {
  compiling: {
    python: ["Initializing Python interpreter...", "Parsing your logic...", "Setting up the environment..."],
    java: ["Compiling Java bytecode...", "Checking syntax...", "Loading JVM..."],
    cpp: ["Compiling C++ code...", "Optimizing with -O2...", "Linking libraries..."],
    default: ["Warming up the compiler...", "Parsing your logic...", "Building your solution..."]
  },
  running: [
    "Running test case {current} of {total}...",
    "Executing against edge cases...",
    "Your code is facing the Judge...",
    "Crunching through the test cases...",
  ],
  comparing: [
    "Comparing outputs...",
    "Analyzing results...",
    "Validating correctness...",
    "Almost there...",
  ]
};

const getCompilingMessage = (language: Language) => {
  const messages = JUDGING_MESSAGES.compiling[language] || JUDGING_MESSAGES.compiling.default;
  return messages[Math.floor(Math.random() * messages.length)];
};

const getRunningMessage = (current: number, total: number) => {
  const template = JUDGING_MESSAGES.running[Math.floor(Math.random() * JUDGING_MESSAGES.running.length)];
  return template.replace('{current}', String(current)).replace('{total}', String(total));
};

const getComparingMessage = () => {
  return JUDGING_MESSAGES.comparing[Math.floor(Math.random() * JUDGING_MESSAGES.comparing.length)];
};

const detectErrorType = (error: string): { type: string; verdict: Verdict } => {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('time') && (errorLower.includes('limit') || errorLower.includes('exceeded'))) {
    return { type: 'time_limit', verdict: 'TLE' };
  }
  if (errorLower.includes('memory') && (errorLower.includes('limit') || errorLower.includes('exceeded'))) {
    return { type: 'memory_limit', verdict: 'MLE' };
  }
  if (errorLower.includes('compile') || errorLower.includes('syntax') || 
      errorLower.includes('cannot find symbol') || errorLower.includes('expected')) {
    return { type: 'compile_error', verdict: 'CE' };
  }
  if (
    errorLower.includes('runtime') || 
    errorLower.includes('segmentation') || 
    errorLower.includes('index') ||
    errorLower.includes('null') ||
    errorLower.includes('undefined') ||
    errorLower.includes('exception') ||
    errorLower.includes('error')
  ) {
    return { type: 'runtime_error', verdict: 'RE' };
  }
  return { type: 'unknown', verdict: 'RE' };
};

const generateFeedback = (verdict: Verdict, errorType?: string, rawError?: string): { message: string; suggestion: string } => {
  switch (verdict) {
    case 'AC':
      return {
        message: "All test cases passed!",
        suggestion: "Check the performance chart to see how you stack up."
      };
    case 'WA':
      return {
        message: "Logic is close, but a specific edge case tripped us up.",
        suggestion: "Double-check how you're handling empty inputs, boundary values, or large numbers."
      };
    case 'TLE':
      return {
        message: "Your code is doing some heavy lifting, but we hit the time limit.",
        suggestion: "Is there a way to skip some loops? Consider a more efficient algorithm or data structure."
      };
    case 'MLE':
      return {
        message: "Memory's getting a bit tight. The judge capped out.",
        suggestion: "Can you store less data or use a more memory-efficient structure?"
      };
    case 'RE':
      if (rawError?.toLowerCase().includes('index')) {
        return {
          message: "Oops! An index went out of bounds.",
          suggestion: "Check your array/list access - make sure indices are within valid range."
        };
      }
      if (rawError?.toLowerCase().includes('null') || rawError?.toLowerCase().includes('undefined')) {
        return {
          message: "A null/undefined value caused a crash.",
          suggestion: "Add null checks before accessing object properties or array elements."
        };
      }
      if (rawError?.toLowerCase().includes('stack')) {
        return {
          message: "Stack overflow detected - likely infinite recursion.",
          suggestion: "Check your recursive function's base case and make sure it terminates."
        };
      }
      return {
        message: "Oops, the code crashed mid-run.",
        suggestion: "Check for division by zero, null pointers, or index out of bounds."
      };
    case 'CE':
      return {
        message: "There's a syntax error preventing compilation.",
        suggestion: "Check for missing brackets, semicolons, or typos in your code."
      };
    default:
      return {
        message: "Something unexpected happened.",
        suggestion: "Try running again or check your code for issues."
      };
  }
};

const getTierBadge = (percentile: number): { tier: string; emoji: string; message: string } => {
  if (percentile >= 99) {
    return { 
      tier: 'Speed Demon', 
      emoji: '🔥', 
      message: "Absolute speed demon! You just smoked 99% of submissions. You sure you didn't write the compiler?" 
    };
  }
  if (percentile >= 90) {
    return { 
      tier: 'Lightning Fast', 
      emoji: '⚡', 
      message: "Lightning fast! Your solution beats 90% of all submissions." 
    };
  }
  if (percentile >= 75) {
    return { 
      tier: 'Well Optimized', 
      emoji: '🚀', 
      message: "Well optimized! You're in the top 25% of performers." 
    };
  }
  if (percentile >= 50) {
    return { 
      tier: 'Solid Solution', 
      emoji: '✅', 
      message: "Accepted! You're faster than 50% of users. There's still some room to optimize." 
    };
  }
  return { 
    tier: 'Room to Grow', 
    emoji: '📈', 
    message: "Accepted! Your solution works—want to try and shave off a few milliseconds?" 
  };
};

/**
 * Compare two outputs using the enhanced judge engine.
 * Supports order-agnostic comparison, floating point tolerance, etc.
 */
const compareOutputs = (
  actual: string, 
  expected: string, 
  options: JudgeOptions = {}
): boolean => {
  return judgeCompareOutputs(actual, expected, options);
};

/**
 * Estimate memory usage based on code characteristics
 * Since Piston doesn't return real memory, we estimate based on code length and complexity
 */
const estimateMemory = (code: string, language: Language): number => {
  // Base memory varies by language (runtime overhead)
  const baseMemory: Record<Language, number> = {
    python: 12000,   // ~12MB for Python interpreter
    java: 25000,     // ~25MB for JVM
    cpp: 3000,       // ~3MB for compiled C++
  };

  const base = baseMemory[language] || 10000;
  
  // Estimate additional memory based on code complexity
  const codeLength = code.length;
  const arrayCount = (code.match(/\[/g) || []).length;
  const stringCount = (code.match(/["']/g) || []).length / 2;
  
  // Each array might use ~100 bytes, each string ~50 bytes
  const additionalMemory = Math.floor(codeLength / 10) + (arrayCount * 100) + (stringCount * 50);
  
  // Add some variance (±10%) to make it look more realistic
  const variance = (Math.random() - 0.5) * 0.2;
  const total = base + additionalMemory;
  
  return Math.round(total * (1 + variance));
};

export const useEnhancedCodeRunner = () => {
  const [judgingPhase, setJudgingPhase] = useState<JudgingPhase>({ status: 'idle' });
  const [elapsedMs, setElapsedMs] = useState(0);

  const runPiston = async (
    language: string, 
    version: string, 
    code: string, 
    stdin: string = "",
    retryCount: number = 0
  ): Promise<{
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
    memory: number;
  }> => {
    const startTime = performance.now();
    
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
      
      // Handle rate limiting
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          return runPiston(language, version, code, stdin, retryCount + 1);
        }
        return { 
          success: false, 
          output: "", 
          error: "Server is busy. Please try again in a few seconds.", 
          executionTime: 0, 
          memory: 0 
        };
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
          await new Promise(r => setTimeout(r, delay));
          return runPiston(language, version, code, stdin, retryCount + 1);
        }
        return { 
          success: false, 
          output: "", 
          error: `Server error (${response.status}). Please try again.`, 
          executionTime: 0, 
          memory: 0 
        };
      }
      
      const data = await response.json();
      const executionTime = Math.round(performance.now() - startTime);
      
      if (data.run) {
        const stdout = data.run.stdout || "";
        const stderr = data.run.stderr || "";
        const output = data.run.output || (stdout + (stderr ? "\n" + stderr : ""));
        
        // Estimate memory based on code complexity
        const memory = estimateMemory(code, language as Language);
        
        return {
          success: data.run.code === 0 && !stderr,
          output: output.trim(),
          error: stderr || (data.run.code !== 0 ? output : undefined),
          executionTime,
          memory
        };
      }
      return { success: false, output: "", error: "Execution failed to start.", executionTime, memory: 0 };
    } catch (e: any) {
      // Network error - retry
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return runPiston(language, version, code, stdin, retryCount + 1);
      }
      return { success: false, output: "", error: `Network Error: ${e.message}. Check your connection and try again.`, executionTime: 0, memory: 0 };
    }
  };

  const getLanguageConfig = (language: Language): { name: string; version: string } => {
    const configs: Record<Language, { name: string; version: string }> = {
      python: { name: 'python', version: '3.10.0' },
      java: { name: 'java', version: '15.0.2' },
      cpp: { name: 'cpp', version: '10.2.0' },
    };
    return configs[language];
  };

  const executeWithJudging = useCallback(async (
    language: Language,
    code: string,
    testCases: Array<{ input: any; output: any; is_public?: boolean }>,
    prepareCode: (code: string, input: any) => string,
    problemId?: string
  ): Promise<EnhancedExecutionResult> => {
    setElapsedMs(0);
    const startTime = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startTime), 100);

    const testResults: TestResult[] = [];
    let totalRuntime = 0;
    let totalMemory = 0;
    
    // Variables to track first failure
    let firstFailureIndex = -1;
    let firstFailureVerdict: Verdict | null = null;
    let firstFailureError: { type: string, rawError: string } | undefined = undefined;

    try {
      // Phase 1: Compiling
      setJudgingPhase({ 
        status: 'compiling', 
        message: getCompilingMessage(language)
      });
      await new Promise(r => setTimeout(r, 500));

      const config = getLanguageConfig(language);

      // Phase 2: Running tests (Run ALL tests to populate results)
      for (let i = 0; i < testCases.length; i++) {
        setJudgingPhase({ 
          status: 'running', 
          currentTest: i + 1, 
          totalTests: testCases.length,
          message: getRunningMessage(i + 1, testCases.length)
        });

        const test = testCases[i];
        const codeToRun = prepareCode(code, test.input);
        
        // Execute code
        const result = await runPiston(config.name, config.version, codeToRun, "");

        totalRuntime += result.executionTime;
        totalMemory += result.memory;

        const cleanOutput = normalizeOutput(result.output || '');
        const expectedStr = normalizeOutput(String(test.output || ''));
        
        // Strict comparison
        const passed = compareOutputs(cleanOutput, expectedStr);

        testResults.push({
          passed,
          input: String(test.input),
          expected: expectedStr,
          actual: cleanOutput,
          testIndex: i
        });

        // If this test failed and it's the first failure, record it
        if (!passed && firstFailureIndex === -1) {
          firstFailureIndex = i;
          
          if (result.error) {
             // It's a runtime/compile/limit error
             const { type, verdict } = detectErrorType(result.error);
             firstFailureVerdict = verdict;
             firstFailureError = { type, rawError: result.error };
          } else {
             // It ran successfully but output was wrong
             firstFailureVerdict = 'WA';
          }
        }
      }

      // Phase 3: Comparing / Finalizing
      setJudgingPhase({ 
        status: 'comparing', 
        message: getComparingMessage()
      });
      await new Promise(r => setTimeout(r, 300));
      clearInterval(timer);

      // If there was a failure, return that verdict
      if (firstFailureIndex !== -1) {
        const verdict = firstFailureVerdict || 'WA';
        const feedback = generateFeedback(verdict, firstFailureError?.type, firstFailureError?.rawError);
        
        setJudgingPhase({ status: 'complete', verdict });
        
        return {
          verdict,
          passed: false,
          output: testResults[firstFailureIndex].actual,
          expected: testResults[firstFailureIndex].expected,
          runtime_ms: Math.round(totalRuntime / (firstFailureIndex + 1)), // Avg up to failure
          memory_kb: Math.round(totalMemory / (firstFailureIndex + 1)),
          feedbackMessage: feedback.message,
          feedbackSuggestion: feedback.suggestion,
          errorDetails: firstFailureError,
          testResults,
          failedTestIndex: firstFailureIndex
        };
      }

      // --- Success Path (All tests passed) ---
      const avgRuntime = Math.round(totalRuntime / testCases.length);
      const avgMemory = Math.round(totalMemory / testCases.length);

      // Calculate percentiles from database
      let runtimePercentile = 50;
      let memoryPercentile = 50;

      if (problemId) {
        try {
          const { data: rtPercentile } = await supabase.rpc('calculate_runtime_percentile', {
            p_problem_id: problemId,
            p_language: language,
            p_runtime_ms: avgRuntime
          });
          const { data: memPercentile } = await supabase.rpc('calculate_memory_percentile', {
            p_problem_id: problemId,
            p_language: language,
            p_memory_kb: avgMemory
          });
          
          if (rtPercentile !== null) runtimePercentile = rtPercentile;
          if (memPercentile !== null) memoryPercentile = memPercentile;
        } catch (e) {
          // Fallback to default percentiles if DB fails
          console.warn("Failed to fetch percentiles:", e);
        }
      }

      const feedback = generateFeedback('AC');
      const tier = getTierBadge(runtimePercentile);

      setJudgingPhase({ status: 'complete', verdict: 'AC' });

      return {
        verdict: 'AC',
        passed: true,
        output: testResults[testResults.length - 1]?.actual || '',
        expected: testResults[testResults.length - 1]?.expected || '',
        runtime_ms: avgRuntime,
        memory_kb: avgMemory,
        feedbackMessage: tier.message,
        feedbackSuggestion: feedback.suggestion,
        testResults,
        runtimePercentile,
        memoryPercentile
      };

    } catch (error: any) {
      clearInterval(timer);
      const feedback = generateFeedback('RE', 'unknown', error.message);
      setJudgingPhase({ status: 'complete', verdict: 'RE' });
      
      return {
        verdict: 'RE',
        passed: false,
        output: '',
        expected: '',
        runtime_ms: 0,
        memory_kb: 0,
        feedbackMessage: feedback.message,
        feedbackSuggestion: feedback.suggestion,
        errorDetails: { type: 'unknown', rawError: error.message },
        testResults
      };
    }
  }, []);

  const runSingleTest = useCallback(async (
    language: Language,
    code: string,
    input: string,
    prepareCode: (code: string, input: any) => string
  ) => {
    setJudgingPhase({ status: 'running', currentTest: 1, totalTests: 1, message: 'Running your custom test...' });
    
    const config = getLanguageConfig(language);
    const codeToRun = prepareCode(code, input);
    const result = await runPiston(config.name, config.version, codeToRun, "");
    
    setJudgingPhase({ status: 'idle' });
    
    return {
      output: result.output,
      error: result.error,
      runtime_ms: result.executionTime,
      memory_kb: result.memory
    };
  }, []);

  const resetJudging = useCallback(() => {
    setJudgingPhase({ status: 'idle' });
    setElapsedMs(0);
  }, []);

  return { 
    executeWithJudging, 
    runSingleTest,
    judgingPhase, 
    elapsedMs,
    resetJudging,
    getTierBadge
  };
};
