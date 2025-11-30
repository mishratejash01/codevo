import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeEditor } from './CodeEditor';
import { TestCaseView } from './TestCaseView';
import { usePyodide } from '@/hooks/usePyodide';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, BookOpen, Flag, RefreshCw, Code2, Lock, Unlock } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

const DEFAULT_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
  onAttempt?: (isCorrect: boolean, score: number) => void;
  tables?: { assignments: string; testCases: string; submissions: string; };
  disableCopyPaste?: boolean; // New prop
}

// Regex and normalization helpers...
const getTargetName = (code: string) => {
  const funcMatch = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  if (funcMatch) return funcMatch[1];
  const classMatch = code.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[:\(]/);
  if (classMatch) return classMatch[1];
  return null;
};

const normalizeOutput = (str: string) => {
  if (!str) return '';
  return str.trim().replace(/'/g, '"').replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
};

const executeTests = async (tests: any[], code: string, targetName: string, runTestFunction: any) => {
  let passedCount = 0;
  const newTestResults: Record<string, any> = {};
  for (const test of tests) {
    try {
      const result = await runTestFunction(code, targetName, test.input);
      if (!result.success) {
        newTestResults[test.id] = { passed: false, output: "Error", error: result.error };
        continue;
      }
      const actual = normalizeOutput(result.result);
      const expected = normalizeOutput(test.expected_output);
      const isMatch = actual === expected || actual.includes(expected);
      if (isMatch) passedCount++;
      newTestResults[test.id] = { passed: isMatch, output: result.result, error: isMatch ? null : `Expected: ${test.expected_output}` };
    } catch (e: any) {
      newTestResults[test.id] = { passed: false, output: "", error: e.message };
    }
  }
  return { passedCount, newTestResults };
};

export const AssignmentView = ({ 
  assignmentId, 
  onStatusUpdate, 
  currentStatus, 
  onAttempt, 
  tables = DEFAULT_TABLES,
  disableCopyPaste = false 
}: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  
  const { runCode, runTestFunction, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId, tables.assignments],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from(tables.assignments).select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId, tables.testCases],
    queryFn: async () => {
      // @ts-ignore
      const { data } = await supabase.from(tables.testCases).select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId
  });

  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId, tables.submissions],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // @ts-ignore
      const { data } = await supabase.from(tables.submissions).select('code, score, public_tests_passed, private_tests_passed').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!assignmentId
  });

  useEffect(() => {
    const sessionKey = `exam_draft_${assignmentId}`;
    const savedDraft = sessionStorage.getItem(sessionKey);
    if (savedDraft) setCode(savedDraft);
    else if (latestSubmission?.code) setCode(latestSubmission.code);
    else if (assignment?.starter_code) setCode(assignment.starter_code);
    else setCode('# Write your Python code here\n');
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId, latestSubmission, assignment]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sessionStorage.setItem(`exam_draft_${assignmentId}`, newCode);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      const targetName = getTargetName(code);
      if (!targetName) throw new Error("Function/Class not found. Please define your function.");
      
      const publicTests = testCases.filter((tc:any) => tc.is_public);
      const privateTests = testCases.filter((tc:any) => !tc.is_public);
      
      const pubRes = await executeTests(publicTests, code, targetName, runTestFunction);
      const privRes = await executeTests(privateTests, code, targetName, runTestFunction);
      
      setTestResults({ ...pubRes.newTestResults, ...privRes.newTestResults });
      
      const total = testCases.length;
      const passed = pubRes.passedCount + privRes.passedCount;
      const score = total > 0 ? (passed / total) * (assignment.max_score || 100) : 0;

      // @ts-ignore
      await supabase.from(tables.submissions).insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: pubRes.passedCount,
        public_tests_total: publicTests.length,
        private_tests_passed: privRes.passedCount,
        private_tests_total: privateTests.length,
      });
      return { score, passed, total, pubPassed: pubRes.passedCount, pubTotal: publicTests.length, privPassed: privRes.passedCount, privTotal: privateTests.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({ title: 'Submission Complete', description: `Score: ${data.score.toFixed(0)}%` });
      onStatusUpdate('attempted');
      setBottomTab('testcases');
      if (onAttempt) onAttempt(data.passed === data.total, data.score);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  const handleRun = async () => {
    if (pyodideLoading) return;
    setConsoleOutput('Running...');
    setBottomTab('testcases');
    try {
      const targetName = getTargetName(code);
      if (!targetName) {
        const res = await runCode(code);
        setConsoleOutput(res.success ? res.output : res.error);
        setBottomTab('console');
        return;
      }
      const publicTests = testCases.filter((tc:any) => tc.is_public);
      const { passedCount, newTestResults } = await executeTests(publicTests, code, targetName, runTestFunction);
      setTestResults(newTestResults);
      setConsoleOutput(passedCount === publicTests.length ? "All Public Tests Passed" : `${passedCount}/${publicTests.length} Public Tests Passed`);
    } catch (err: any) {
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  };

  const publicTests = testCases.filter((tc: any) => tc.is_public);
  const privateTests = testCases.filter((tc: any) => !tc.is_public);

  // Calculate current display stats
  const currentPubPassed = testResults ? Object.values(testResults).filter((r:any, i) => testCases[i]?.is_public && r.passed).length : (latestSubmission?.public_tests_passed || 0);
  const currentPrivPassed = latestSubmission?.private_tests_passed || 0; // Private results only update on submit fetch usually, or we can use testResults if we want to show them instantly (usually hidden)

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-white"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10"><Button onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="h-full w-full bg-[#09090b] text-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* LEFT PANEL: Problem & Stats */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
          <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-white/90"><BookOpen className="w-4 h-4 text-primary" /> Problem Description</div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono">
                 Score: {latestSubmission?.score?.toFixed(0) || 0} / {assignment.max_score}
               </span>
               <Button variant="ghost" size="icon" onClick={() => { onStatusUpdate('review'); toast({description:"Marked for Review"}); }} className={cn("h-7 w-7", currentStatus === 'review' ? "text-orange-500" : "text-muted-foreground")}><Flag className="w-4 h-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div><h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1><div className="flex gap-2 text-xs text-muted-foreground"><span>{assignment.category || "General"}</span></div></div>
              <div className="prose prose-invert prose-sm text-gray-300"><div className="whitespace-pre-wrap font-sans">{assignment.description}</div></div>
              {assignment.instructions && <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-200/70 whitespace-pre-wrap">{assignment.instructions}</div>}

              {/* VISUAL METER (Stats) */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                 {/* Public Tests */}
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Unlock className="w-3 h-3"/> Public Tests</span>
                       <span className="text-xs font-bold text-white">{currentPubPassed}/{publicTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${publicTests.length ? (currentPubPassed/publicTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
                 {/* Private Tests */}
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/> Private Tests</span>
                       <span className="text-xs font-bold text-white">{currentPrivPassed}/{privateTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${privateTests.length ? (currentPrivPassed/privateTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
              </div>

            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-black border-l border-r border-white/5 w-2 hover:bg-primary/20 transition-colors" />

        {/* RIGHT PANEL: Editor & Output */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#09090b]">
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-white/90"><Code2 className="w-4 h-4 text-green-500" /> main.py</div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={pyodideLoading} className="h-7 text-xs gap-1.5"><Play className="w-3 h-3 mr-1"/> Run</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-500 text-white">{submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit'}</Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <CodeEditor 
                  value={code} 
                  onChange={handleCodeChange} 
                  disableCopyPaste={disableCopyPaste} // Pass the restriction prop
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-black border-t border-b border-white/5 h-2 hover:bg-primary/20 transition-colors" />
            <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col">
              <Tabs value={bottomTab} onValueChange={(v:any) => setBottomTab(v)} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="h-7 bg-white/5 border border-white/10 p-0.5 gap-1">
                    <TabsTrigger value="testcases" className="text-xs h-6 px-3">Test Cases</TabsTrigger>
                    <TabsTrigger value="console" className="text-xs h-6 px-3">Console Output</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setConsoleOutput('')}><RefreshCw className="w-3 h-3"/></Button>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <TabsContent value="testcases" className="h-full m-0 p-0"><TestCaseView testCases={testCases} testResults={testResults} /></TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-0"><div className="h-full p-4 font-mono text-sm overflow-auto bg-[#0a0a0a]"><pre className={cn("whitespace-pre-wrap", consoleOutput.includes('Error') ? "text-red-400" : "text-blue-400")}>{consoleOutput || <span className="text-muted-foreground/40 italic"># No output</span>}</pre></div></TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
