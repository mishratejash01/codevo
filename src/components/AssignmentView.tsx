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
  const [code, setCode] = useState<string>('# Write your Python code here\n');
  const [activeTab, setActiveTab] = useState('overview');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  
  const { runCode, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error("No ID");
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      if (error) throw error;
      return data;
    },
    retry: 1,
    enabled: !!assignmentId
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data } = await supabase
        .from('test_cases')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId
  });

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
    },
    enabled: !!assignmentId
  });

  // --- Effects ---
  useEffect(() => {
    if (latestSubmission?.code) {
      setCode(latestSubmission.code);
    } else {
      setCode('# Write your Python code here\n');
    }
    setTestResults({});
    setConsoleOutput('');
    // Ensure we start on overview when switching questions
    setActiveTab('overview');
  }, [assignmentId, latestSubmission]);

  // --- Submission Logic ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      if (!assignment) throw new Error('Assignment data missing');

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);
      let publicPassed = 0;
      let privatePassed = 0;

      for (const test of publicTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) publicPassed++;
      }
      for (const test of privateTests) {
        const result = await runCode(code, test.input);
        if (result.success && result.output.trim() === test.expected_output.trim()) privatePassed++;
      }

      const totalTests = testCases.length;
      const score = totalTests > 0 ? ((publicPassed + privatePassed) / totalTests) * (assignment.max_score || 100) : 0;

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
      return { score };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({ title: 'Submitted!', description: `Score: ${data.score.toFixed(0)}` });
      onStatusUpdate('attempted');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleRun = async () => {
    if (pyodideLoading) return;
    setConsoleOutput('Running...');
    setActiveTab('console');
    try {
      const result = await runCode(code, '');
      const output = result.error ? `Error:\n${result.error}` : (result.output || 'Code executed successfully.');
      setConsoleOutput(String(output));
    } catch (e) {
      setConsoleOutput('An unexpected error occurred during execution.');
    }
  };

  const publicTests = testCases.filter(tc => tc.is_public);
  const privateTests = testCases.filter(tc => !tc.is_public);

  // --- Loading/Error Views ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#09090b] text-white gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading problem...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#09090b] gap-4 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive opacity-80" />
        <h3 className="text-xl font-semibold text-white">Problem Load Failed</h3>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 border-white/10 hover:bg-white/5 text-white">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  // --- Main Render ---
  // FIX: Ensure <Tabs> wraps both the list (header) and the content (body)
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col bg-[#09090b] text-white">
      {/* Header Section */}
      <div className="border-b border-white/10 bg-black/20 px-4 py-2 flex items-center justify-between shrink-0 h-14">
        <TabsList className="h-9 bg-white/5 border border-white/10 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs h-7 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Overview</TabsTrigger>
          <TabsTrigger value="code" className="text-xs h-7 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Editor</TabsTrigger>
          <TabsTrigger value="testcases" className="text-xs h-7 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Tests</TabsTrigger>
          <TabsTrigger value="console" className="text-xs h-7 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Console</TabsTrigger>
        </TabsList>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onStatusUpdate('review');
            toast({ description: "Marked for Review" });
          }}
          className={cn(
            "h-8 text-xs gap-2 border-orange-500/50 text-orange-500 hover:bg-orange-500/10",
            currentStatus === 'review' && "bg-orange-500/20"
          )}
        >
          <Flag className="w-3 h-3" />
          {currentStatus === 'review' ? 'Marked' : 'Review'}
        </Button>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          
          <TabsContent value="overview" className="p-6 m-0 h-full animate-in fade-in zoom-in-95 duration-200 focus-visible:ring-0">
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-white">{assignment.title}</h1>
                <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-muted-foreground">
                  Score: {assignment.max_score}
                </div>
              </div>

              <Card className="border-white/10 bg-white/5">
                <CardContent className="pt-6">
                  <div className="prose prose-invert max-w-none prose-sm">
                    <div className="whitespace-pre-wrap">{assignment.description}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-white/10 bg-black/20">
                  <CardContent className="p-6 flex items-center justify-center">
                    <ScoreDisplay score={latestSubmission?.score || 0} maxScore={assignment.max_score || 100} />
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-white/10 bg-black/20">
                    <div className="flex justify-between text-xs mb-2"><span>Public Tests</span><span>{latestSubmission?.public_tests_passed || 0}/{publicTests.length}</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${publicTests.length ? ((latestSubmission?.public_tests_passed||0)/publicTests.length)*100 : 0}%` }}/></div>
                  </div>
                  <div className="p-4 rounded-lg border border-white/10 bg-black/20">
                    <div className="flex justify-between text-xs mb-2"><span>Private Tests</span><span>{latestSubmission?.private_tests_passed || 0}/{privateTests.length}</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${privateTests.length ? ((latestSubmission?.private_tests_passed||0)/privateTests.length)*100 : 0}%` }}/></div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="m-0 h-full flex flex-col focus-visible:ring-0">
            <div className="flex-1 min-h-[300px] relative">
              <CodeEditor value={code} onChange={setCode} />
            </div>
            <div className="p-3 bg-black/60 border-t border-white/10 flex justify-between items-center backdrop-blur-sm sticky bottom-0 z-10">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {currentStatus ? currentStatus.replace('-', ' ') : 'Not Attempted'}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleRun} disabled={pyodideLoading} className="h-8">
                  <Play className="w-3 h-3 mr-2" /> Run
                </Button>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} size="sm" className="h-8 bg-green-600 hover:bg-green-500 text-white">
                  {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <CheckCircle className="w-3 h-3 mr-2" />} Submit
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testcases" className="p-6 m-0 h-full focus-visible:ring-0">
            <TestCaseView testCases={testCases} testResults={testResults} />
          </TabsContent>

          <TabsContent value="console" className="p-0 m-0 h-full focus-visible:ring-0">
            <div className="h-full bg-[#0c0c0c] p-4 font-mono text-sm overflow-auto text-green-400">
              <div className="border-b border-white/10 pb-2 mb-2 text-muted-foreground text-xs flex items-center gap-2">
                <Terminal className="w-3 h-3"/> Output
              </div>
              <pre className="whitespace-pre-wrap">{consoleOutput || "// Output will appear here..."}</pre>
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
};
