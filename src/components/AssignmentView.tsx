import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CodeEditor } from './CodeEditor';
import { ScoreDisplay } from './ScoreDisplay';
import { TestCaseView } from './TestCaseView';
import { usePyodide } from '@/hooks/usePyodide';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Play, Terminal } from 'lucide-react';

interface AssignmentViewProps {
  assignmentId: string;
}

export const AssignmentView = ({ assignmentId }: AssignmentViewProps) => {
  const [code, setCode] = useState('# Write your Python code here\n');
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  
  const { runCode, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('is_public', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to submit');

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);

      let publicPassed = 0;
      let privatePassed = 0;

      for (const test of publicTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          publicPassed++;
        }
      }

      for (const test of privateTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          privatePassed++;
        }
      }

      const totalTests = testCases.length;
      const passedTests = publicPassed + privatePassed;
      const score = (passedTests / totalTests) * (assignment?.max_score || 100);

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

      return { score, publicPassed, privatePassed };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({
        title: 'Submission successful!',
        description: `Score: ${data.score.toFixed(2)}/${assignment?.max_score || 100}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Simple Run button handler (No test cases)
  const handleRun = async () => {
    if (pyodideLoading) return;
    
    setConsoleOutput('Running...');
    setActiveTab('console');
    
    const result = await runCode(code, '');
    
    if (result.error) {
      setConsoleOutput(`Error:\n${result.error}`);
    } else {
      setConsoleOutput(result.output || 'Code ran successfully (No output).');
    }
  };

  // Test Run handler (With test cases)
  const handleTestRun = async () => {
    if (pyodideLoading) {
      toast({ title: 'Python is still loading...', description: 'Please wait a moment' });
      return;
    }

    const publicTests = testCases.filter(tc => tc.is_public);
    if (publicTests.length === 0) {
      toast({ title: 'No public test cases', variant: 'destructive' });
      return;
    }

    const results: Record<string, { output: string; passed: boolean; error?: string | null }> = {};
    let passed = 0;

    for (const test of publicTests) {
      const result = await runCode(code, test.input);
      const isPassed = result.success && result.output.trim() === test.expected_output.trim();
      if (isPassed) passed++;
      
      results[test.id] = {
        output: result.error ? result.error : result.output,
        passed: isPassed,
        error: result.error
      };
    }

    setTestResults(results);
    setActiveTab('testcases');

    toast({
      title: 'Test Run Complete',
      description: `${passed}/${publicTests.length} public tests passed`,
    });
  };

  if (!assignment) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const publicTests = testCases.filter(tc => tc.is_public);
  const privateTests = testCases.filter(tc => !tc.is_public);

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-card px-6">
          <TabsList className="h-12">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="question">Question</TabsTrigger>
            <TabsTrigger value="testcases">Test Cases</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="p-6 m-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                {assignment.deadline && (
                  <p className="text-sm text-destructive">
                    Due {new Date(assignment.deadline).toLocaleString()}
                  </p>
                )}
              </div>

              {assignment.instructions && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Instructions</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {assignment.instructions}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center py-8">
                <ScoreDisplay
                  score={latestSubmission?.score || 0}
                  maxScore={assignment.max_score}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Public Tests</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{latestSubmission?.public_tests_passed || 0}/{publicTests.length} Passed</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full transition-all"
                          style={{
                            width: `${publicTests.length > 0 ? ((latestSubmission?.public_tests_passed || 0) / publicTests.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Private Tests</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{latestSubmission?.private_tests_passed || 0}/{privateTests.length} Passed</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full transition-all"
                          style={{
                            width: `${privateTests.length > 0 ? ((latestSubmission?.private_tests_passed || 0) / privateTests.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="question" className="p-6 m-0">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{assignment.description}</div>
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="p-6 m-0">
            <TestCaseView testCases={testCases} testResults={testResults} />
          </TabsContent>

          <TabsContent value="console" className="p-6 m-0 h-full">
            <Card className="h-full">
              <CardContent className="pt-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span className="font-semibold">Console Output</span>
                </div>
                <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-auto flex-1">
                  {consoleOutput || "Run your code to see output here..."}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="m-0 h-full flex flex-col">
            <div className="flex-1 min-h-[500px]">
              <CodeEditor value={code} onChange={setCode} />
            </div>
            <div className="border-t p-4 flex justify-end gap-3 bg-card">
              <Button
                variant="secondary"
                onClick={handleRun}
                disabled={pyodideLoading || submitMutation.isPending}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {pyodideLoading ? 'Loading...' : 'Run'}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestRun}
                disabled={pyodideLoading || submitMutation.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Test Run
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={pyodideLoading || submitMutation.isPending}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
