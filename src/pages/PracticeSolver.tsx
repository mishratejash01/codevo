import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useEnhancedCodeRunner, Language, EnhancedExecutionResult } from '@/hooks/useEnhancedCodeRunner';
import { CodeEditor } from '@/components/CodeEditor';
import { Play, Send, ChevronLeft, Loader2, Bug, Terminal, FileCode2, Timer, Home, RefreshCw, CheckCircle2, BookOpen, MessageSquare, History, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BookmarkButton } from '@/components/practice/BookmarkButton';
import { LikeDislikeButtons } from '@/components/practice/LikeDislikeButtons';
import { HintsAccordion } from '@/components/practice/HintsAccordion';
import { ProblemNotes } from '@/components/practice/ProblemNotes';
import { SubmissionHistory } from '@/components/practice/SubmissionHistory';
import { DiscussionTab } from '@/components/practice/DiscussionTab';
import { JudgingLoader } from '@/components/practice/JudgingLoader';
import { VerdictDisplay } from '@/components/practice/VerdictDisplay';
import { PerformanceChart } from '@/components/practice/PerformanceChart';
import { CustomTestSandbox } from '@/components/practice/CustomTestSandbox';
import { wrapCodeForExecution, Language as WrapperLanguage } from '@/utils/codeWrappers';

export default function PracticeSolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeWithJudging, runSingleTest, judgingPhase, elapsedMs, resetJudging } = useEnhancedCodeRunner();

  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<string | undefined>();
  
  const [descriptionTab, setDescriptionTab] = useState<'description' | 'editorial' | 'submissions' | 'discussion'>('description');
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'custom' | 'result'>('testcase');
  const [activeTestCaseId, setActiveTestCaseId] = useState(0);
  
  const [executionResult, setExecutionResult] = useState<EnhancedExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const { data: problem, isLoading: problemLoading, error } = useQuery({
    queryKey: ['practice_problem', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    retry: false
  });

  const { data: hasAttempted } = useQuery({
    queryKey: ['has_attempted', problem?.id, userId],
    queryFn: async () => {
      if (!userId || !problem?.id) return false;
      const { data } = await supabase
        .from('practice_submissions')
        .select('id')
        .eq('problem_id', problem.id)
        .eq('user_id', userId)
        .limit(1);
      return (data?.length || 0) > 0;
    },
    enabled: !!userId && !!problem?.id
  });

  const testCases = Array.isArray(problem?.test_cases) ? problem.test_cases as any[] : [];
  const hints = Array.isArray(problem?.hints) ? problem.hints as string[] : [];
  
  useEffect(() => {
    if (problem) {
      const templates = problem.starter_templates || {};
      const template = (templates as any)[activeLanguage] || `# Write your ${activeLanguage} code here\n`;
      setCode(template);
      setElapsedTime(0);
      timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [problem, activeLanguage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare code with language-specific driver code (LeetCode-style)
  const prepareCode = (userCode: string, input: any) => {
    const rawInput = String(input || '');
    // Use the new universal code wrapper for all languages
    return wrapCodeForExecution(
      activeLanguage as WrapperLanguage,
      userCode,
      rawInput
    );
  };

  const handleRun = async () => {
    if (!problem || testCases.length === 0) return;
    setConsoleTab('result');
    setExecutionResult(null);
    setIsRunning(true);
    
    const publicTests = testCases.filter(t => t.is_public);
    const result = await executeWithJudging(
      activeLanguage,
      code,
      publicTests.length > 0 ? publicTests : [testCases[activeTestCaseId]],
      prepareCode
    );
    
    setExecutionResult(result);
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      toast({ title: "Login Required", variant: "destructive" }); 
      navigate('/auth'); 
      return; 
    }
    
    setIsSubmitting(true);
    setConsoleTab('result');
    setExecutionResult(null);
    
    const result = await executeWithJudging(
      activeLanguage,
      code,
      testCases,
      prepareCode,
      problem?.id
    );
    
    setExecutionResult(result);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (result.passed && problem) {
      const pointsMap: Record<string, number> = { 'Easy': 10, 'Medium': 30, 'Hard': 50 };
      const points = pointsMap[problem.difficulty] || 10;
      
      await supabase.from('practice_submissions').upsert({
        user_id: user.id, 
        problem_id: problem.id, 
        score: points, 
        status: 'completed',
        code, 
        language: activeLanguage, 
        test_cases_passed: testCases.length, 
        test_cases_total: testCases.length,
        runtime_ms: result.runtime_ms, 
        memory_kb: result.memory_kb,
        verdict: result.verdict,
        feedback_message: result.feedbackMessage
      }, { onConflict: 'user_id,problem_id' });
      
      toast({ title: `Success! +${points} Points`, className: "bg-green-600 border-none text-white" });
    }
    
    setIsSubmitting(false);
  };

  const handleRunCustomTest = async (input: string) => {
    const result = await runSingleTest(activeLanguage, code, input, prepareCode);
    return result;
  };

  const handleSelectSubmission = (submittedCode: string, lang: string) => {
    setCode(submittedCode);
    setActiveLanguage(lang as Language);
    setDescriptionTab('description');
  };

  const handleRetry = () => {
    setExecutionResult(null);
    resetJudging();
    setElapsedTime(0);
    timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
  };

  if (problemLoading) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 text-white">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  );

  if (error || !problem) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 p-6 text-white">
      <Bug className="w-8 h-8 text-red-500" />
      <h1 className="text-2xl font-bold">Problem Not Found</h1>
      <Button variant="outline" onClick={() => navigate('/practice-arena')}>Return to Arena</Button>
    </div>
  );

  const isJudging = judgingPhase.status !== 'idle' && judgingPhase.status !== 'complete';

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/practice-arena')} className="text-gray-400 hover:text-white h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-sm text-gray-100 hidden md:block">{problem.title}</h1>
            <Badge variant="outline" className={cn("text-[10px] py-0 h-5 border-white/10 bg-white/5", 
              problem.difficulty === 'Easy' ? "text-green-400" : problem.difficulty === 'Medium' ? "text-yellow-400" : "text-red-400")}>
              {problem.difficulty}
            </Badge>
          </div>
          <LikeDislikeButtons problemId={problem.id} userId={userId} likes={problem.likes || 0} dislikes={problem.dislikes || 0} />
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-xs text-muted-foreground">
          <Timer className="w-3.5 h-3.5" />
          <span>{formatTime(elapsedTime)}</span>
        </div>

        <div className="flex items-center gap-3">
          <BookmarkButton problemId={problem.id} userId={userId} />
          <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
            <SelectTrigger className="h-8 w-[130px] bg-[#151515] border-white/10 text-xs font-medium text-gray-300 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-white/10 text-gray-300">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={handleRun} disabled={isRunning || isSubmitting || isJudging} className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/5">
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Play className="w-3.5 h-3.5 mr-2 fill-current"/>} Run
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || isRunning || isJudging} className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white font-semibold border-0">
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Send className="w-3.5 h-3.5 mr-2"/>} Submit
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#0a0a0a] flex flex-col border-r border-white/5">
            <Tabs value={descriptionTab} onValueChange={(v) => setDescriptionTab(v as any)} className="flex flex-col h-full">
              <div className="h-10 border-b border-white/5 flex items-center px-1 bg-[#0f0f0f] shrink-0">
                <TabsList className="h-full bg-transparent p-0 gap-0">
                  {[
                    { value: 'description', icon: FileCode2, label: 'Description' },
                    { value: 'editorial', icon: BookOpen, label: 'Editorial' },
                    { value: 'submissions', icon: History, label: 'Submissions' },
                    { value: 'discussion', icon: MessageSquare, label: 'Discuss' },
                  ].map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 px-3">
                      <tab.icon className="w-3 h-3" /> {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="description" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 pb-20">
                    <h2 className="text-xl font-bold text-white mb-4">{problem.title}</h2>
                    <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                      {problem.time_complexity && <span className="bg-white/5 px-2 py-1 rounded">Time: {problem.time_complexity}</span>}
                      {problem.space_complexity && <span className="bg-white/5 px-2 py-1 rounded">Space: {problem.space_complexity}</span>}
                      {problem.acceptance_rate > 0 && <span className="bg-white/5 px-2 py-1 rounded">{problem.acceptance_rate}% acceptance</span>}
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed mb-8">
                      <p className="whitespace-pre-wrap">{problem.description}</p>
                    </div>
                    {testCases.length > 0 && (
                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Examples</h3>
                        {testCases.filter((t: any) => t.is_public).map((t: any, i: number) => (
                          <div key={i} className="bg-[#151515] border border-white/5 rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-white/5 border-b border-white/5 text-[10px] text-gray-400 font-mono">Example {i + 1}</div>
                            <div className="p-3 space-y-2 font-mono text-xs">
                              <div><span className="text-blue-400">Input:</span> <span className="text-gray-300 ml-2">{String(t.input)}</span></div>
                              <div><span className="text-green-400">Output:</span> <span className="text-gray-300 ml-2">{t.output}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <HintsAccordion hints={hints} hasAttempted={!!hasAttempted} />
                    <div className="mt-6"><ProblemNotes problemId={problem.id} userId={userId} /></div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="editorial" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {problem.editorial ? (
                      <div className="prose prose-invert prose-sm max-w-none"><p className="whitespace-pre-wrap">{problem.editorial}</p></div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                        <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Editorial coming soon</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="submissions" className="flex-1 m-0 overflow-hidden">
                <SubmissionHistory problemId={problem.id} userId={userId} onSelectSubmission={handleSelectSubmission} />
              </TabsContent>

              <TabsContent value="discussion" className="flex-1 m-0 overflow-hidden">
                <DiscussionTab problemId={problem.id} userId={userId} />
              </TabsContent>
            </Tabs>

            {/* Success panel overlay */}
            {executionResult?.passed && (
              <div className="border-t border-white/10 bg-[#0c0c0e] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <PerformanceChart
                      runtimePercentile={executionResult.runtimePercentile || 50}
                      memoryPercentile={executionResult.memoryPercentile || 50}
                      runtime_ms={executionResult.runtime_ms}
                      memory_kb={executionResult.memory_kb}
                      testsPassed={executionResult.testResults.length}
                      testsTotal={executionResult.testResults.length}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleRetry} className="h-8 text-xs border-white/10 bg-white/5">
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Retry
                  </Button>
                  <Button size="sm" onClick={() => navigate('/practice-arena')} className="h-8 text-xs bg-white text-black hover:bg-gray-200">
                    <Home className="w-3.5 h-3.5 mr-2" /> Arena
                  </Button>
                </div>
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#050505] w-1.5 border-l border-r border-white/5 hover:bg-white/10" />

          {/* Right Panel */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60} className="flex flex-col bg-[#1e1e1e]">
                <div className="flex-1"><CodeEditor value={code} onChange={setCode} language={activeLanguage} /></div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-[#0c0c0e] h-1.5 border-t border-b border-white/5 hover:bg-white/10" />
              <ResizablePanel defaultSize={40} className="bg-[#0c0c0e] flex flex-col min-h-[200px]">
                <Tabs value={consoleTab} onValueChange={(v) => setConsoleTab(v as any)} className="w-full h-full flex flex-col">
                  <div className="h-9 border-b border-white/10 flex items-center px-2 bg-[#0a0a0a] shrink-0">
                    <TabsList className="h-full bg-transparent p-0 gap-4">
                      <TabsTrigger value="testcase" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-xs font-medium text-muted-foreground flex items-center gap-2 px-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Testcase
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-xs font-medium text-muted-foreground flex items-center gap-2 px-2">
                        <Beaker className="w-3.5 h-3.5" /> Custom
                      </TabsTrigger>
                      <TabsTrigger value="result" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-xs font-medium text-muted-foreground flex items-center gap-2 px-2">
                        <Terminal className="w-3.5 h-3.5" /> Result
                        {executionResult && <div className={cn("w-1.5 h-1.5 rounded-full ml-1.5", executionResult.passed ? "bg-green-500" : "bg-red-500")} />}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-[#0c0c0e]">
                    <TabsContent value="testcase" className="mt-0 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                        {testCases.filter(t => t.is_public).map((_, i) => (
                          <button key={i} onClick={() => setActiveTestCaseId(i)} className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-colors border", activeTestCaseId === i ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-transparent text-gray-500 hover:text-gray-300")}>Case {i + 1}</button>
                        ))}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Input</label>
                          <div className="w-full bg-[#151515] p-3 rounded-lg border border-white/5 font-mono text-sm text-gray-300 min-h-[60px]">{testCases[activeTestCaseId]?.input}</div>
                        </div>
                        {testCases[activeTestCaseId]?.output && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expected Output</label>
                            <div className="w-full bg-[#151515] p-3 rounded-lg border border-white/5 font-mono text-sm text-gray-500">{testCases[activeTestCaseId]?.output}</div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="mt-0 h-full">
                      <CustomTestSandbox
                        defaultInput={testCases[0]?.input ? String(testCases[0].input) : ''}
                        onRunCustomTest={handleRunCustomTest}
                        isRunning={judgingPhase.status === 'running'}
                      />
                    </TabsContent>
                    
                    <TabsContent value="result" className="mt-0 h-full">
                      {isJudging ? (
                        <JudgingLoader phase={judgingPhase} elapsedMs={elapsedMs} />
                      ) : !executionResult ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-3 opacity-40">
                          <Terminal className="w-8 h-8" />
                          <span className="text-xs">Run code to see results</span>
                        </div>
                      ) : executionResult.passed ? (
                        <PerformanceChart
                          runtimePercentile={executionResult.runtimePercentile || 50}
                          memoryPercentile={executionResult.memoryPercentile || 50}
                          runtime_ms={executionResult.runtime_ms}
                          memory_kb={executionResult.memory_kb}
                          testsPassed={executionResult.testResults.length}
                          testsTotal={executionResult.testResults.length}
                        />
                      ) : (
                        <VerdictDisplay
                          verdict={executionResult.verdict}
                          feedbackMessage={executionResult.feedbackMessage}
                          feedbackSuggestion={executionResult.feedbackSuggestion}
                          failedTestIndex={executionResult.failedTestIndex}
                          testResults={executionResult.testResults}
                          errorDetails={executionResult.errorDetails}
                          runtime_ms={executionResult.runtime_ms}
                          memory_kb={executionResult.memory_kb}
                        />
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
