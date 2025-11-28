// ... imports remain the same

// Helper to extract function name from python code (simple regex)
const getFunctionName = (code: string) => {
  const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

// Helper to normalize python output strings for comparison (e.g. converting single quotes to double)
const normalizeOutput = (str: string) => {
  return str.replace(/'/g, '"').replace(/\s+/g, '').trim();
};

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  // ... state and hooks remain the same
  
  const { runCode, runTestFunction, loading: pyodideLoading } = usePyodide();

  // ... queries (assignment, testCases, submission) remain the same

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      // 1. Detect Function Name
      const functionName = getFunctionName(code);
      if (!functionName) {
        throw new Error("Could not find a function definition (def function_name) in your code.");
      }

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);
      let publicPassed = 0;
      let privatePassed = 0;
      const newTestResults: Record<string, any> = {};

      // Helper to run a list of tests
      const executeTests = async (tests: any[], isPublic: boolean) => {
        let passedCount = 0;
        for (const test of tests) {
          try {
            // Run the specific function with input args
            const result = await runTestFunction(code, functionName, test.input);
            
            if (!result.success) {
              newTestResults[test.id] = { 
                passed: false, 
                output: "Error", 
                error: result.error 
              };
              continue;
            }

            // Compare Results
            // We normalize strings to ignore spacing differences (e.g., [1, 2] vs [1,2])
            const actual = normalizeOutput(result.result);
            const expected = normalizeOutput(test.expected_output);
            const isMatch = actual === expected;

            if (isMatch) passedCount++;

            newTestResults[test.id] = {
              passed: isMatch,
              output: result.result, // The raw return value from Python
              logs: result.logs,     // Any print statements used for debugging
              error: null
            };
          } catch (e: any) {
            newTestResults[test.id] = { passed: false, output: "", error: e.message };
          }
        }
        return passedCount;
      };

      // 2. Run All Tests
      publicPassed = await executeTests(publicTests, true);
      privatePassed = await executeTests(privateTests, false);

      setTestResults(newTestResults); // Update UI with per-test results

      // 3. Calculate Score
      const totalTests = testCases.length;
      const score = totalTests > 0 ? ((publicPassed + privatePassed) / totalTests) * (assignment.max_score || 100) : 0;

      // 4. Save to DB
      const { error } = await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: publicPassed,
        public_tests_total: publicTests.length,
        private_tests_passed: privatePassed,
        private_tests_total: privateTests.length,
      });

      if (error) throw error;
      return { score, publicPassed, privatePassed, totalTests };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      
      const perfect = data.score === (assignment?.max_score || 100);
      toast({ 
        title: perfect ? 'Perfect Score! 🎉' : 'Submission Complete', 
        description: `You passed ${data.publicPassed + data.privatePassed} out of ${data.totalTests} tests. Score: ${data.score.toFixed(0)}`,
        variant: perfect ? 'default' : 'destructive' // Or a warning variant if you add one
      });
      
      onStatusUpdate('attempted');
      // Switch tab to test cases to show results
      setBottomTab('testcases');
    },
    onError: (err: any) => {
      toast({ title: 'Execution Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  // ... rest of the component (render logic)
