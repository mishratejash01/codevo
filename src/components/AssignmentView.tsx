// ... imports remain the same

// Helper to extract function name from python code
const getFunctionName = (code: string) => {
  const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

// Helper to normalize python output strings for comparison
const normalizeOutput = (str: string) => {
  return str ? str.replace(/'/g, '"').replace(/\s+/g, '').trim() : '';
};

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  // ... state (code, consoleOutput, testResults, bottomTab)
  
  const { runCode, runTestFunction, loading: pyodideLoading } = usePyodide();
  // ... hooks (toast, queryClient)

  // ... data fetching (assignment, testCases, latestSubmission)
  
  // ... persistence useEffect

  // ... handleCodeChange

  // --- SUBMISSION HANDLER ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      const functionName = getFunctionName(code);
      if (!functionName) {
        throw new Error("Could not find a function definition (def function_name) in your code.");
      }

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);
      let publicPassed = 0;
      let privatePassed = 0;
      const newTestResults: Record<string, any> = {};

      const executeTests = async (tests: any[]) => {
        let passedCount = 0;
        for (const test of tests) {
          try {
            const result = await runTestFunction(code, functionName, test.input);
            
            if (!result.success) {
              // ERROR CASE: We now capture result.error specifically
              newTestResults[test.id] = { 
                passed: false, 
                output: "Execution Error", 
                error: result.error  // This contains the SyntaxError or TypeError
              };
              continue;
            }

            const actual = normalizeOutput(result.result);
            const expected = normalizeOutput(test.expected_output);
            const isMatch = actual === expected;

            if (isMatch) passedCount++;

            newTestResults[test.id] = {
              passed: isMatch,
              output: result.result,
              error: isMatch ? null : `Expected: ${test.expected_output}`
            };
          } catch (e: any) {
            newTestResults[test.id] = { passed: false, output: "System Error", error: e.message };
          }
        }
        return passedCount;
      };

      // Run tests
      publicPassed = await executeTests(publicTests);
      privatePassed = await executeTests(privateTests);

      setTestResults(newTestResults);

      const totalTests = testCases.length;
      const score = totalTests > 0 ? ((publicPassed + privatePassed) / totalTests) * (assignment.max_score || 100) : 0;

      // ... save to supabase ...

      return { score, publicPassed, privatePassed, totalTests };
    },
    // ... onSuccess / onError handlers
  });

  // ... rest of component (render)
