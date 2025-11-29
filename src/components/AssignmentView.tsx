import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Regex to find function definition
const getFunctionName = (code: string) => {
  const match = code.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
  return match ? match[1] : null;
};

// Normalize output for flexible comparison (ignores extra spaces)
const normalizeOutput = (str: string) => {
  if (!str) return '';
  return str.replace(/'/g, '"').replace(/\s+/g, '').trim();
};

// Helper function to execute tests against a list of test cases
const executeTests = async (
  tests: any[],
  code: string,
  functionName: string,
  runTestFunction: (code: string, functionName: string, input: string) => Promise<any>
) => {
  let passedCount = 0;
  const newTestResults: Record<string, any> = {};

  for (const test of tests) {
    try {
      const result = await runTestFunction(code, functionName, test.input);
      
      if (!result.success) {
        newTestResults[test.id] = { 
          passed: false, 
          output: "Error", 
          error: result.error 
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
      newTestResults[test.id] = { passed: false, output: "", error: e.message };
    }
  }

  return { passedCount, newTestResults };
};

export const AssignmentView = ({ assignmentId, onStatusUpdate, currentStatus }: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, { output: string; passed: boolean; error?: string | null }>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  
  const { runCode, runTestFunction, loading: pyodideLoading } = usePyodide();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Data Fetching ---
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) throw new Error("No ID");
      const { data, error } = await supabase.from('assignments').select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const { data } = await supabase.from('test_cases').select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId
  });

  const { data: latestSubmission } = useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('submissions').select('code, score, public_tests_passed, private_tests_passed').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!assignmentId
  });

  // --- Persistence ---
  useEffect(() => {
    const sessionKey = `exam_draft_${assignmentId}`;
    const savedDraft = sessionStorage.getItem(sessionKey);
    if (savedDraft) {
        setCode(savedDraft);
    } else if (latestSubmission?.code) {
        setCode(latestSubmission.code);
    } else if (assignment?.starter_code) {
        setCode(assignment.starter_code);
    } else {
        setCode('# Write your Python code here\n');
    }
    setTestResults({});
    setConsoleOutput('');
  }, [assignmentId, latestSubmission, assignment]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sessionStorage.setItem(`exam_draft_${assignmentId}`, newCode);
  };

  // --- SUBMISSION HANDLER ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      const functionName = getFunctionName(code);
      if (!functionName) throw new Error("Could not find a function definition (def name...).");

      const publicTests = testCases.filter(tc => tc.is_public);
      const privateTests = testCases.filter(tc => !tc.is_public);

      const publicResults = await executeTests(publicTests, code, functionName, runTestFunction);
      const privateResults = await executeTests(privateTests, code, functionName, runTestFunction);

      const allTestResults = { ...publicResults.newTestResults, ...privateResults.newTestResults };
      setTestResults(allTestResults);

      const totalTests = testCases.length;
      const publicPassed = publicResults.passedCount;
      const privatePassed = privateResults.passedCount;
      const score = totalTests > 0 ? ((publicPassed + privatePassed) / totalTests) * (assignment.max_score || 100) : 0;

      await supabase.from('submissions').insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: publicPassed,
        public_tests_total: publicTests.length,
        private_tests_passed: privatePassed,
        private_tests_total: privateTests.length,
      });

      return { score, publicPassed, privatePassed, totalTests };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      toast({ 
        title: data.score === (assignment?.max_score || 100) ? 'Perfect Score! 🎉' : 'Submission Complete', 
        description: `Passed ${data.publicPassed + data.privatePassed}/${data.totalTests} tests.` 
      });
      onStatusUpdate('attempted');
      setBottomTab('testcases');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  const handleRun = async () => {
    if (pyodideLoading) return;
    
    setConsoleOutput('🔄 Running against public test cases...\n');
    setBottomTab('testcases');
    
    try {
      const functionName = getFunctionName(code);
      if (!functionName) {
        setConsoleOutput("❌ Error: Could not find a function definition (def name...).\n\nMake sure your code contains a function definition like:\ndef function_name(args):\n    # your code here");
        setBottomTab('console');
        return;
      }

      const publicTests = testCases.filter(tc => tc.is_public);
      
      if (publicTests.length === 0) {
        setConsoleOutput("⚠️ No public test cases available.");
        return;
      }

      const { passedCount, newTestResults } = await executeTests(
        publicTests,
        code,
        functionName,
        runTestFunction
      );

      setTestResults(newTestResults);
      
      const allPassed = passedCount === publicTests.length;
      setConsoleOutput(
        allPassed 
          ? `✅ Run Complete: ${passedCount}/${publicTests.length} Public Tests Passed\n\n🎉 All public tests passed! Ready to submit.`
          : `⚠️ Run Complete: ${passedCount}/${publicTests.length} Public Tests Passed\n\n${publicTests.length - passedCount} test(s) failed. Check the Test Cases tab for details.`
      );
      
    } catch (err: any) {
      setConsoleOutput(`❌ Runtime Error:\n\n${err.message}\n\nFix the error and try again.`);
      setBottomTab('console');
    }
  };

  const handleMarkForReview = () => {
    onStatusUpdate('review');
    toast({ description: "Marked for Review" });
  };

  const publicTests = testCases.filter(tc => tc.is_public);
  const privateTests = testCases.filter(tc => !tc.is_public);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-white"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10">Error loading problem. <Button onClick={() => refetch()} variant="outline" className="ml-2">Retry</Button></div>;

  return (
    <div className="h-full w-full bg-[#09090b] text-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
          <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-white/90">
              <BookOpen className="w-4 h-4 text-primary" />
              Problem Description
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono">
                 Score: {latestSubmission?.score?.toFixed(0) || 0} / {assignment.max_score}
               </span>
               <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkForReview}
                className={cn("h-7 w-7", currentStatus === 'review' ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-white")}
                title="Mark for Review"
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{assignment.title}</h1>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {assignment.deadline && <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>}
                  <span>•</span>
                  <span>{assignment.category || "General"}</span>
                </div>
              </div>

              <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                <div className="whitespace-pre-wrap font-sans leading-relaxed">{assignment.description}</div>
              </div>

              {assignment.instructions && (
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" /> Instructions
                  </h4>
                  <div className="text-xs text-blue-200/70 whitespace-pre-wrap">{assignment.instructions}</div>
                </div>
              )}

              {/* Stats/Tests Summary */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <span className="text-xs text-muted-foreground block mb-1">Public Tests</span>
                    <div className="flex items-end justify-between">
                       <span className="text-lg font-bold text-white">{latestSubmission?.public_tests_passed || 0} <span className="text-sm text-muted-foreground font-normal">/ {publicTests.length}</span></span>
                       <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-green-500" style={{ width: `${publicTests.length ? ((latestSubmission?.public_tests_passed||0)/publicTests.length)*100 : 0}%` }} />
                       </div>
                    </div>
                 </div>
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <span className="text-xs text-muted-foreground block mb-1">Private Tests</span>
                    <div className="flex items-end justify-between">
                       <span className="text-lg font-bold text-white">{latestSubmission?.private_tests_passed || 0} <span className="text-sm text-muted-foreground font-normal">/ {privateTests.length}</span></span>
                       <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-green-500" style={{ width: `${privateTests.length ? ((latestSubmission?.private_tests_passed||0)/privateTests.length)*100 : 0}%` }} />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-black border-l border-r border-white/5 w-2 hover:bg-primary/20 transition-colors" />

        {/* Right Panel */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#09090b]">
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 shrink-0">
                <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Code2 className="w-4 h-4 text-green-500" />
                  main.py
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={pyodideLoading} className="h-7 text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10"><Play className="w-3 h-3 mr-1"/> Run</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-500 text-white border-none shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative"><CodeEditor value={code} onChange={handleCodeChange} /></div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-black border-t border-b border-white/5 h-2 hover:bg-primary/20 transition-colors" />

            <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col">
              <Tabs value={bottomTab} onValueChange={(v) => setBottomTab(v as any)} className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="h-7 bg-white/5 border border-white/10 p-0.5 gap-1">
                    <TabsTrigger value="testcases" className="text-xs h-6 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Test Cases</TabsTrigger>
                    <TabsTrigger value="console" className="text-xs h-6 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Console Output</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setConsoleOutput('')}><RefreshCw className="w-3 h-3"/></Button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <TabsContent value="testcases" className="h-full m-0 p-4 overflow-auto custom-scrollbar"><TestCaseView testCases={testCases} testResults={testResults} /></TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-0">
                    <div className="h-full p-4 font-mono text-sm overflow-auto bg-[#0a0a0a]">
                      {consoleOutput ? (
                        <pre className={cn(
                          "whitespace-pre-wrap",
                          consoleOutput.includes('❌') || consoleOutput.includes('Error') ? "text-red-400" : 
                          consoleOutput.includes('✅') || consoleOutput.includes('All public tests passed') ? "text-green-400" :
                          "text-blue-400"
                        )}>{consoleOutput}</pre>
                      ) : (
                        <span className="text-muted-foreground/40 italic"># No output yet. Run your code to see results.</span>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
