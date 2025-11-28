import { useState, useEffect } from 'react';
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
import { Loader2, Play, Terminal, Code2, BookOpen, CheckCircle, Flag, AlertTriangle, RefreshCw } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
}

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  const [code, setCode] = useState('# Write your Python code here\n');
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  
  const { runCode, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Assignment Data
  const { data: assignment, isLoading, error, refetch } = useQuery({
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
    retry: 2 // Retry fetching twice if it fails
  });

  // Fetch Test Cases
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

  // Fetch previous submission if exists (so you don't lose code on refresh)
  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('submissions')
        .select('code, score, public_tests_passed, private_tests_passed')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    }
  });

  // Initialize state when data loads
  useEffect(() => {
    if (latestSubmission?.code) {
      setCode(latestSubmission.code);
    } else {
      setCode('# Write your Python code here\n');
    }
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId, latestSubmission]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to submit');

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);

      let publicPassed = 0;
      let privatePassed = 0;

      // Run Public Tests
      for (const test of publicTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          publicPassed++;
        }
      }

      // Run Private Tests
      for (const test of privateTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) {
          privatePassed++;
        }
      }

      const totalTests = testCases.length;
      const passedTests = publicPassed + privatePassed;
      const score = totalTests > 0 ? (passedTests / totalTests) * (assignment?.max_score || 100) : 0;

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
        title: 'Solution Submitted',
        description: `Your answer has been recorded. Score: ${data.score.toFixed(0)}`,
      });
      onStatusUpdate('attempted');
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
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
    setConsoleOutput(result.error ? `Error:\n${result.error}` : (result.output || 'Code ran successfully (No output).'));
  };

  const handleMarkForReview = () => {
    onStatusUpdate('review');
    toast({
      title: "Marked for Review",
      description: "You can come back to this question later.",
    });
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p>Loading problem...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Failed to load problem</h3>
        <p className="text-muted-foreground max-w-sm">
          There was an error loading the assignment data. It might be deleted or your connection is unstable.
        </p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  const publicTests = testCases.filter(tc => tc.is_public);
  const privateTests = testCases.filter(tc => !tc.is_public);

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Control Bar */}
      <div className="border-b border-white/10 bg-black/20 px-4 py-2 flex items-center justify-between shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-9 bg-black/40 border border-white/10 p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded flex gap-2 items-center"><BookOpen className="w-3.5 h-3.5"/> Overview</TabsTrigger>
            <TabsTrigger value="code" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded flex gap-2 items-center"><Code2 className="w-3.5 h-3.5"/> Editor</TabsTrigger>
            <TabsTrigger value="testcases" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded flex gap-2 items-center"><CheckCircle className="w-3.5 h-3.5"/> Tests</TabsTrigger>
            <TabsTrigger value="console" className="text-xs px-3 py-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded flex gap-2 items-center"><Terminal className="w-3.5 h-3.5"/> Console</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            onClick={handleMarkForReview}
            className={cn(
              "h-8 text-xs gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10 transition-colors",
              currentStatus === 'review' && "bg-orange-500/20"
            )}
          >
            <Flag className={cn("w-3 h-3", currentStatus === 'review' && "fill-orange-500")} />
            {currentStatus === 'review' ? 'Marked' : 'Mark for Review'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
          <TabsContent value="overview" className="p-6 m-0 h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{assignment.title}</h1>
                <div className="flex gap-3 text-sm">
                  {assignment.deadline && (
                    <span className="text-destructive font-mono bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                      Due: {new Date(assignment.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Max Score: {assignment.max_score}
                  </span>
                </div>
              </div>

              {assignment.instructions && (
                <Card className="border-white/10 bg-black/40 backdrop-blur-sm shadow-xl">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3 text-primary flex items-center gap-2">
                      <BookOpen className="w-4 h-4"/> Instructions
                    </h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {assignment.instructions}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Card className="border-white/10 bg-black/40 h-full">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2 text-white">Score Progress</h3>
                      <div className="flex justify-center py-4">
                        <ScoreDisplay
                          score={latestSubmission?.score || 0}
                          maxScore={assignment.max_score || 100}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <Card className="border-white/10 bg-black/40">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2 text-white text-sm">Public Test Cases</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{latestSubmission?.public_tests_passed || 0}/{publicTests.length}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
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
                      <h3 className="font-semibold mb-2 text-white text-sm">Private Test Cases</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{latestSubmission?.private_tests_passed || 0}/{privateTests.length}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
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
            </div>
          </TabsContent>

          <TabsContent value="code" className="m-0 h-full flex flex-col">
            <div className="flex-1 min-h-[400px] border-b border-white/10 relative">
              <CodeEditor value={code} onChange={setCode} />
            </div>
            {/* Action Footer */}
            <div className="p-4 bg-black/40 backdrop-blur-md flex justify-between items-center border-t border-white/10 shrink-0">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                Status: 
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider", 
                  currentStatus === 'attempted' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 
                  currentStatus === 'review' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                  'bg-white/10 text-muted-foreground'
                )}>
                  {currentStatus ? currentStatus.replace('-', ' ') : 'NOT ATTEMPTED'}
                </span>
              </span>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={handleRun} disabled={pyodideLoading} className="gap-2 text-muted-foreground hover:text-white">
                  <Play className="w-4 h-4" /> Run Code
                </Button>
                <Button 
                  onClick={() => submitMutation.mutate()} 
                  disabled={pyodideLoading || submitMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-0"
                >
                  {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Answer'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="p-6 m-0 h-full">
            <TestCaseView testCases={testCases} testResults={testResults} />
          </TabsContent>

          <TabsContent value="console" className="p-0 m-0 h-full">
            <div className="h-full bg-[#0d0d0d] p-4 font-mono text-sm overflow-auto">
              <div className="flex items-center gap-2 text-muted-foreground mb-4 border-b border-white/10 pb-2">
                <Terminal className="w-4 h-4" />
                <span>Output Console</span>
              </div>
              <pre className={cn("whitespace-pre-wrap", consoleOutput.startsWith("Error") ? "text-red-400" : "text-green-400")}>
                {consoleOutput || <span className="text-muted-foreground/50 italic"># Run your code to see output here...</span>}
              </pre>
            </div>
          </TabsContent>
        </div>
      </div>
    </div>
  );
};
