import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeOutput } from '@/utils/inputParser';
import { compareOutputs as judgeCompareOutputs, JudgeOptions } from '@/utils/judgeEngine';

// Same-origin proxy -> Vercel serverless function (api/execute.js)
const EXECUTE_API = '/api/execute';
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
 */
const estimateMemory = (code: string, language: Language): number => {
  const baseMemory: Record<Language, number> = {
    python: 12000,
    java: 25000,
    cpp: 3000,
  };

  const base = baseMemory[language] || 10000;
  const codeLength = code.length;
  const arrayCount = (code.match(/\[/g) || []).length;
  const stringCount = (code.match(/["']/g) || []).length / 2;
  const additionalMemory = Math.floor(codeLength / 10) + (arrayCount * 100) + (stringCount * 50);
  const variance = (Math.random() - 0.5) * 0.2;
  const total = base + additionalMemory;

  return Math.round(total * (1 + variance));
};

export const useEnhancedCodeRunner = () => {
  const [judgingPhase, setJudgingPhase] = useState<JudgingPhase>({ status: 'idle' });
  const [elapsedMs, setElapsedMs] = useState(0);

  const runViaProxy = async (
    language: Language,
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
      const response = await fetch(EXECUTE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language, stdin }),
      });

      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
          await new Promise(r => setTimeout(r, delay));
          return runViaProxy(language, code, stdin, retryCount + 1);
        }
        return { success: false, output: "", error: "Server is busy. Please try again in a few seconds.", executionTime: 0, memory: 0 };
      }

      if (!response.ok) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
          await new Promise(r => setTimeout(r, delay));
          return runViaProxy(language, code, stdin, retryCount + 1);
        }
        return { success: false, output: "", error: `Server error (${response.status}). Please try again.`, executionTime: 0, memory: 0 };
      }

      const data = await response.json();
      // Normalized: {stdout, stderr, code, signal, time, memory, isCompileError}
      // time is already in ms from the proxy
      const executionTime = data.time ? Math.round(data.time) : Math.round(performance.now() - startTime);
      const memory = data.memory || estimateMemory(code, language);

      // Compilation Error
      if (data.isCompileError) {
        return { success: false, output: "", error: data.stderr || "Compilation failed", executionTime, memory };
      }

      // Success
      if (data.code === 0) {
        return { success: true, output: (data.stdout || "").trim(), executionTime, memory };
      }

      // TLE
      if (data.code === -1 || data.signal === 'SIGKILL') {
        return { success: false, output: (data.stdout || "").trim(), error: "Time Limit Exceeded", executionTime, memory };
      }

      // Runtime Error or other failure
      const errorMsg = data.stderr || "Execution failed";
      return { success: false, output: (data.stdout || "").trim(), error: errorMsg, executionTime, memory };
    } catch (e: any) {
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(r => setTimeout(r, delay));
        return runViaProxy(language, code, stdin, retryCount + 1);
      }
      return { success: false, output: "", error: `Network Error: ${e.message}. Check your connection and try again.`, executionTime: 0, memory: 0 };
    }
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

      // Phase 2: Running tests
      for (let i = 0; i < testCases.length; i++) {
        setJudgingPhase({
          status: 'running',
          currentTest: i + 1,
          totalTests: testCases.length,
          message: getRunningMessage(i + 1, testCases.length)
        });

        const test = testCases[i];
        const codeToRun = prepareCode(code, test);
        const result = await runViaProxy(language, codeToRun, "");

        totalRuntime += result.executionTime;
        totalMemory += result.memory;

        const hasError = !!result.error;
        const cleanOutput = hasError ? (result.output || '') : normalizeOutput(result.output || '');
        const expectedStr = normalizeOutput(String(test.output || ''));

        let passed = false;
        if (!hasError) {
          passed = compareOutputs(cleanOutput, expectedStr);
        }

        testResults.push({
          passed,
          input: String(test.input),
          expected: expectedStr,
          actual: hasError ? result.error || result.output || '' : cleanOutput,
          testIndex: i
        });

        if (!passed && firstFailureIndex === -1) {
          firstFailureIndex = i;

          if (result.error) {
             const { type, verdict } = detectErrorType(result.error);
             firstFailureVerdict = verdict;
             firstFailureError = { type, rawError: result.error };
          } else {
             firstFailureVerdict = 'WA';
          }
        }
      }

      // Phase 3: Comparing
      setJudgingPhase({
        status: 'comparing',
        message: getComparingMessage()
      });
      await new Promise(r => setTimeout(r, 300));
      clearInterval(timer);

      if (firstFailureIndex !== -1) {
        const verdict = firstFailureVerdict || 'WA';
        const feedback = generateFeedback(verdict, firstFailureError?.type, firstFailureError?.rawError);

        setJudgingPhase({ status: 'complete', verdict });

        return {
          verdict,
          passed: false,
          output: testResults[firstFailureIndex].actual,
          expected: testResults[firstFailureIndex].expected,
          runtime_ms: Math.round(totalRuntime / (firstFailureIndex + 1)),
          memory_kb: Math.round(totalMemory / (firstFailureIndex + 1)),
          feedbackMessage: feedback.message,
          feedbackSuggestion: feedback.suggestion,
          errorDetails: firstFailureError,
          testResults,
          failedTestIndex: firstFailureIndex
        };
      }

      // All tests passed
      const avgRuntime = Math.round(totalRuntime / testCases.length);
      const avgMemory = Math.round(totalMemory / testCases.length);

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

    const codeToRun = prepareCode(code, input);
    const result = await runViaProxy(language, codeToRun, "");

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
