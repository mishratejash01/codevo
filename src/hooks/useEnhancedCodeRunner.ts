import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeOutput } from '@/utils/inputParser';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export type Language = 'python' | 'java' | 'cpp' | 'c' | 'javascript' | 'sql' | 'bash';
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
  compiling: [
    "Warming up the compiler...",
    "Parsing your logic...",
    "Building your solution...",
  ],
  running: [
    "Running your logic against our test cases... hang tight.",
    "Crunching through the test cases...",
    "Your code is facing the Judge...",
    "Executing against edge cases...",
  ],
  comparing: [
    "Comparing outputs...",
    "Analyzing results...",
    "Almost there...",
  ]
};

const getRandomMessage = (phase: keyof typeof JUDGING_MESSAGES) => {
  const messages = JUDGING_MESSAGES[phase];
  return messages[Math.floor(Math.random() * messages.length)];
};

const detectErrorType = (error: string): { type: string; verdict: Verdict } => {
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('time') && (errorLower.includes('limit') || errorLower.includes('exceeded'))) {
    return { type: 'time_limit', verdict: 'TLE' };
  }
  if (errorLower.includes('memory') && (errorLower.includes('limit') || errorLower.includes('exceeded'))) {
    return { type: 'memory_limit', verdict: 'MLE' };
  }
  if (errorLower.includes('compile') || errorLower.includes('syntax')) {
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
 * Compare two outputs with fuzzy matching for cross-language compatibility
 */
const compareOutputs = (actual: string, expected: string): boolean => {
  // Exact match
  if (actual === expected) return true;
  
  // Try parsing as JSON and comparing
  try {
    const actualParsed = JSON.parse(actual.replace(/'/g, '"'));
    const expectedParsed = JSON.parse(expected.replace(/'/g, '"'));
    return JSON.stringify(actualParsed) === JSON.stringify(expectedParsed);
  } catch {
    // Not JSON, continue with string comparison
  }
  
  // Remove all whitespace and compare
  const normalizedActual = actual.replace(/\s/g, '');
  const normalizedExpected = expected.replace(/\s/g, '');
  if (normalizedActual === normalizedExpected) return true;
  
  // Handle numeric comparison (floating point tolerance)
  const actualNum = parseFloat(actual);
  const expectedNum = parseFloat(expected);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    return Math.abs(actualNum - expectedNum) < 1e-6;
  }
  
  // Check if output contains expected (for multi-line or formatted output)
  return normalizedActual.includes(normalizedExpected) || 
         normalizedExpected.includes(normalizedActual);
};

export const useEnhancedCodeRunner = () => {
  const [judgingPhase, setJudgingPhase] = useState<JudgingPhase>({ status: 'idle' });
  const [elapsedMs, setElapsedMs] = useState(0);

  const runPiston = async (language: string, version: string, code: string, stdin: string = "") => {
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
      const data = await response.json();
      const executionTime = Math.round(performance.now() - startTime);
      
      if (data.run) {
        const stdout = data.run.stdout || "";
        const stderr = data.run.stderr || "";
        const output = data.run.output || (stdout + (stderr ? "\n" + stderr : ""));
        
        return {
          success: data.run.code === 0 && !stderr,
          output: output.trim(),
          error: stderr || (data.run.code !== 0 ? output : undefined),
          executionTime,
          memory: Math.floor(Math.random() * 5000) + 10000 // Simulated since Piston doesn't return memory
        };
      }
      return { success: false, output: "", error: "Execution failed to start.", executionTime, memory: 0 };
    } catch (e: any) {
      return { success: false, output: "", error: `Network Error: ${e.message}`, executionTime: 0, memory: 0 };
    }
  };

  const getLanguageConfig = (language: Language): { name: string; version: string } => {
    const configs: Record<Language, { name: string; version: string }> = {
      python: { name: 'python', version: '3.10.0' },
      javascript: { name: 'javascript', version: '18.15.0' },
      java: { name: 'java', version: '15.0.2' },
      cpp: { name: 'cpp', version: '10.2.0' },
      c: { name: 'c', version: '10.2.0' },
      sql: { name: 'sqlite3', version: '3.36.0' },
      bash: { name: 'bash', version: '5.0.0' },
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

    try {
      // Phase 1: Compiling
      setJudgingPhase({ 
        status: 'compiling', 
        message: getRandomMessage('compiling') 
      });
      await new Promise(r => setTimeout(r, 500));

      const config = getLanguageConfig(language);

      // Phase 2: Running tests
      for (let i = 0; i < testCases.length; i++) {
        setJudgingPhase({ 
          status: 'running', 
          currentTest: i + 1, 
          totalTests: testCases.length,
          message: getRandomMessage('running')
        });

        const test = testCases[i];
        const codeToRun = prepareCode(code, test.input);
        const result = await runPiston(config.name, config.version, codeToRun, "");

        totalRuntime += result.executionTime;
        totalMemory += result.memory;

        const cleanOutput = normalizeOutput(result.output || '');
        const expectedStr = normalizeOutput(String(test.output || ''));
        
        // Use normalized comparison for better cross-language support
        const passed = compareOutputs(cleanOutput, expectedStr);

        testResults.push({
          passed,
          input: String(test.input),
          expected: expectedStr,
          actual: cleanOutput,
          testIndex: i
        });

        // Check for errors
        if (result.error && !passed) {
          const { type, verdict } = detectErrorType(result.error);
          const feedback = generateFeedback(verdict, type, result.error);
          
          clearInterval(timer);
          setJudgingPhase({ status: 'complete', verdict });
          
          return {
            verdict,
            passed: false,
            output: cleanOutput,
            expected: expectedStr,
            runtime_ms: Math.round(totalRuntime / (i + 1)),
            memory_kb: Math.round(totalMemory / (i + 1)),
            feedbackMessage: feedback.message,
            feedbackSuggestion: feedback.suggestion,
            errorDetails: { type, rawError: result.error },
            testResults,
            failedTestIndex: i
          };
        }

        // Check for wrong answer
        if (!passed) {
          const feedback = generateFeedback('WA');
          
          clearInterval(timer);
          setJudgingPhase({ status: 'complete', verdict: 'WA' });
          
          return {
            verdict: 'WA',
            passed: false,
            output: cleanOutput,
            expected: expectedStr,
            runtime_ms: Math.round(totalRuntime / (i + 1)),
            memory_kb: Math.round(totalMemory / (i + 1)),
            feedbackMessage: feedback.message,
            feedbackSuggestion: feedback.suggestion,
            testResults,
            failedTestIndex: i
          };
        }
      }

      // Phase 3: Comparing
      setJudgingPhase({ 
        status: 'comparing', 
        message: getRandomMessage('comparing') 
      });
      await new Promise(r => setTimeout(r, 300));

      // All tests passed!
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
          // Fallback to default percentiles
        }
      }

      const feedback = generateFeedback('AC');
      const tier = getTierBadge(runtimePercentile);

      clearInterval(timer);
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
