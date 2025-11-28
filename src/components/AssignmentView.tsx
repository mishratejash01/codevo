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
import { Loader2, Play, Terminal, Code2, BookOpen, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="h-full flex flex-col bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-white/10 bg-black/20 px-6 py-2">
          <TabsList className="h-10 bg-black/40 border border-white/10 p-1 rounded-xl w-auto inline-flex">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all gap-2"><BookOpen className="w-4 h-4"/> Overview</TabsTrigger>
            <TabsTrigger value="question" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all gap-2">Question</TabsTrigger>
            <TabsTrigger value="testcases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all gap-2"><CheckCircle className="w-4 h-4"/> Test Cases</TabsTrigger>
            <TabsTrigger value="console" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all gap-2"><Terminal className="w-4 h-4"/> Console</TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all gap-2"><Code2 className="w-4 h-4"/> Editor</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="overview" className="p-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h1 className="text-3xl font-bold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{assignment.title}</h1>
                {assignment.deadline && (
                  <p className="text-sm text-destructive font-mono bg-destructive/10 px-3 py-1 rounded-full w-fit">
                    Due {new Date(assignment.deadline).toLocaleString()}
                  </p>
                )}
              </div>

              {assignment.instructions && (
                <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 text-primary">Instructions</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
                <Card className="border-white/10 bg-black/40">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 text-white">Public Tests</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{latestSubmission?.public_tests_passed || 0}/{publicTests.length} Passed</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                          style={{
                            width: `${publicTests.length > 0 ? ((latestSubmission?.public_tests_passed || 0) / publicTests.length) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2 text-white">Private Tests</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{latestSubmission?.private_tests_passed || 0}/{privateTests.length} Passed</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
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

          <TabsContent value="question" className="p-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="prose prose-invert max-w-none prose-headings:text-primary prose-code:text-accent prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              <div className="whitespace-pre-wrap">{assignment.description}</div>
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="p-6 m-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TestCaseView testCases={testCases} testResults={testResults} />
          </TabsContent>

          <TabsContent value="console" className="p-6 m-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="h-full border-white/10 bg-black/40">
              <CardContent className="pt-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span className="font-semibold">Console Output</span>
                </div>
                <div className="bg-black/50 border border-white/10 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-auto flex-1 text-green-400 shadow-inner">
                  {consoleOutput || "Run your code to see output here..."}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="m-0 h-full flex flex-col">
            <div className="flex-1 min-h-[500px]">
              <CodeEditor value={code} onChange={setCode} />
            </div>
            <div className="border-t border-white/10 p-4 flex justify-end gap-3 bg-black/20 backdrop-blur-md">
              <Button
                variant="ghost"
                onClick={handleRun}
                disabled={pyodideLoading || submitMutation.isPending}
                className="gap-2 hover:bg-white/5 text-muted-foreground hover:text-white"
              >
                <Play className="h-4 w-4" />
                Run Quick
              </Button>
              <Button
                variant="outline"
                onClick={handleTestRun}
                disabled={pyodideLoading || submitMutation.isPending}
                className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300"
              >
                Test Run
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={pyodideLoading || submitMutation.isPending}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-white border-none shadow-lg shadow-purple-500/20"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  'Submit Assignment'
                )}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
