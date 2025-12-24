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
import { 
  Play, Send, ChevronLeft, Loader2, Bug, Terminal, FileCode2, Timer, 
  Home, RefreshCw, CheckCircle2, BookOpen, MessageSquare, History, 
  Beaker, Sparkles, Zap, Cpu, Settings, Maximize2, Minimize2 
} from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isFullScreen, setIsFullScreen] = useState(false);
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

  const prepareCode = (userCode: string, input: any) => {
    const rawInput = String(input || '');
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
      
      toast({ title: `Success! +${points} Points`, className: "bg-emerald-600 border-none text-white shadow-lg" });
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }
  };

  if (problemLoading) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
      <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest relative z-10 animate-pulse">Initializing Environment...</div>
    </div>
  );

  if (error || !problem) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 p-6 text-white relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <div className="relative z-10 w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
        <Bug className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold font-neuropol relative z-10">Anomaly Detected</h1>
      <p className="text-zinc-500 relative z-10">The requested problem data could not be retrieved.</p>
      <Button variant="outline" onClick={() => navigate('/practice-arena')} className="relative z-10 border-white/10 hover:bg-white/5">
        Return to Base
      </Button>
    </div>
  );

  const isJudging = judgingPhase.status !== 'idle' && judgingPhase.status !== 'complete';

  // --- Styles & Animation Variants ---
  const DifficultyColor = {
    'Easy': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Medium': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Hard': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[problem.difficulty] || 'text-white bg-white/10 border-white/20';

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-inter selection:bg-primary/30 relative">
      
      {/* Background Ambient FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
      </div>

      {/* --- COMMAND BAR (Header) --- */}
      <header className="h-16 shrink-0 z-50 px-4 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/practice-arena')} className="w-10 h-10 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-zinc-400 hover:text-white transition-all group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Button>
          
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
               <h1 className="font-bold text-sm md:text-base text-white tracking-tight">{problem.title}</h1>
               <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", DifficultyColor)}>
                 {problem.difficulty}
               </div>
             </div>
             <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span>ID: {slug?.slice(0, 6).toUpperCase()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" /> {problem.acceptance_rate}% Acceptance
                </span>
             </div>
          </div>
        </div>

        {/* Central Timer */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-[#0a0a0c] rounded-full border border-white/10 shadow-inner">
          <Timer className={cn("w-4 h-4", elapsedTime > 600 ? "text-red-400 animate-pulse" : "text-primary")} />
          <span className="font-mono text-sm font-bold text-white tabular-nums tracking-widest">{formatTime(elapsedTime)}</span>
        </div>

        {/* Action Cluster */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
            <BookmarkButton problemId={problem.id} userId={userId} />
            <LikeDislikeButtons problemId={problem.id} userId={userId} likes={problem.likes || 0} dislikes={problem.dislikes || 0} />
          </div>

          <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />

          <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
            <SelectTrigger className="h-9 w-[130px] bg-[#0a0a0c] border-white/10 text-xs font-bold text-zinc-300 focus:ring-primary/20 hover:border-white/20 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0c] border-white/10 text-zinc-300">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRun} 
            disabled={isRunning || isSubmitting || isJudging} 
            className="h-9 px-4 text-xs font-bold border-primary/20 text-primary hover:text-primary hover:bg-primary/10 transition-all shadow-[0_0_10px_rgba(var(--primary),0.2)]"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Play className="w-3.5 h-3.5 mr-2 fill-current"/>} 
            Run
          </Button>

          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={isSubmitting || isRunning || isJudging} 
            className="h-9 px-5 text-xs font-bold bg-white text-black hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_15px_-3px_rgba(255,255,255,0.4)]"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Send className="w-3.5 h-3.5 mr-2"/>} 
            Submit
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="hidden lg:flex w-9 h-9 text-zinc-500 hover:text-white">
             {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* LEFT PANEL: Problem Intel */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#08080a]/50 backdrop-blur-sm flex flex-col border-r border-white/5 relative group/left">
            <Tabs value={descriptionTab} onValueChange={(v) => setDescriptionTab(v as any)} className="flex flex-col h-full">
              
              {/* Tabs Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-2 bg-[#0a0a0c] shrink-0">
                <TabsList className="h-full bg-transparent p-0 gap-1 w-full justify-start">
                  {[
                    { value: 'description', icon: FileCode2, label: 'Briefing' },
                    { value: 'editorial', icon: BookOpen, label: 'Intel' },
                    { value: 'submissions', icon: History, label: 'Log' },
                    { value: 'discussion', icon: MessageSquare, label: 'Comms' },
                  ].map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="relative h-8 rounded-md px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all hover:text-zinc-300"
                    >
                      <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
                      {tab.value === descriptionTab && (
                        <motion.div layoutId="active-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 relative bg-[#08080a] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={descriptionTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <TabsContent value="description" className="h-full m-0 data-[state=active]:flex flex-col">
                      <ScrollArea className="flex-1">
                        <div className="p-6 pb-24 max-w-3xl mx-auto">
                          {/* Problem Title Block */}
                          <div className="mb-6 pb-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white mb-3">{problem.title}</h2>
                            <div className="flex flex-wrap gap-2">
                               {problem.tags?.map((tag:string) => (
                                 <Badge key={tag} variant="secondary" className="bg-white/5 text-zinc-400 hover:text-white border-white/5 text-[10px] uppercase tracking-wider">
                                   #{tag}
                                 </Badge>
                               ))}
                            </div>
                          </div>

                          {/* Description Text */}
                          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-7 font-sans">
                            <p className="whitespace-pre-wrap">{problem.description}</p>
                          </div>

                          {/* Examples */}
                          {testCases.length > 0 && (
                            <div className="space-y-4 mt-8">
                              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-yellow-500" /> Simulation Data
                              </h3>
                              {testCases.filter((t: any) => t.is_public).map((t: any, i: number) => (
                                <div key={i} className="bg-[#0c0c0e] border border-white/5 rounded-xl overflow-hidden shadow-sm">
                                  <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Scenario {i + 1}</span>
                                    <div className="flex gap-1">
                                       <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                       <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                                       <div className="w-2 h-2 rounded-full bg-green-500/20" />
                                    </div>
                                  </div>
                                  <div className="p-4 space-y-3 font-mono text-xs">
                                    <div className="space-y-1">
                                      <span className="text-zinc-500 text-[10px] uppercase font-bold">Input Stream</span>
                                      <div className="bg-[#050505] p-2 rounded border border-white/5 text-blue-300">{String(t.input)}</div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-zinc-500 text-[10px] uppercase font-bold">Expected Output</span>
                                      <div className="bg-[#050505] p-2 rounded border border-white/5 text-emerald-300">{t.output}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-8 space-y-4">
                             <HintsAccordion hints={hints} hasAttempted={!!hasAttempted} />
                             <ProblemNotes problemId={problem.id} userId={userId} />
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="editorial" className="h-full m-0">
                      <ScrollArea className="h-full">
                        <div className="p-6">
                          {problem.editorial ? (
                            <div className="prose prose-invert prose-sm max-w-none"><p className="whitespace-pre-wrap">{problem.editorial}</p></div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-zinc-600">
                              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 opacity-50" />
                              </div>
                              <p className="text-sm font-bold uppercase tracking-widest">Classified Information</p>
                              <p className="text-xs mt-2">Editorial content is currently unavailable.</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="submissions" className="h-full m-0">
                      <SubmissionHistory problemId={problem.id} userId={userId} onSelectSubmission={handleSelectSubmission} />
                    </TabsContent>

                    <TabsContent value="discussion" className="h-full m-0">
                      <DiscussionTab problemId={problem.id} userId={userId} />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Success/Verdict Overlay (Bottom of Left Panel) */}
              <AnimatePresence>
                {executionResult?.passed && (
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-0 left-0 right-0 border-t border-emerald-500/20 bg-[#0c0c0e]/95 backdrop-blur-xl p-0 z-20 shadow-[0_-10px_50px_-10px_rgba(16,185,129,0.2)]"
                  >
                     <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-pulse" />
                     <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                 <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-white">Mission Accomplished</h3>
                                 <p className="text-xs text-emerald-400 font-mono">ALL TEST CASES PASSED</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={handleRetry} className="h-8 text-xs border-white/10 bg-white/5 hover:bg-white/10">
                               <RefreshCw className="w-3.5 h-3.5 mr-2" /> Optimise
                             </Button>
                             <Button size="sm" onClick={() => navigate('/practice-arena')} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                               <Home className="w-3.5 h-3.5 mr-2" /> HQ
                             </Button>
                           </div>
                        </div>
                        <PerformanceChart
                          runtimePercentile={executionResult.runtimePercentile || 50}
                          memoryPercentile={executionResult.memoryPercentile || 50}
                          runtime_ms={executionResult.runtime_ms}
                          memory_kb={executionResult.memory_kb}
                          testsPassed={executionResult.testResults.length}
                          testsTotal={executionResult.testResults.length}
                        />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#050505] w-1.5 border-l border-r border-white/5 hover:bg-primary/50 transition-colors" />

          {/* RIGHT PANEL: Editor & Console */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              
              {/* CODE EDITOR */}
              <ResizablePanel defaultSize={60} className="flex flex-col bg-[#1e1e1e] relative">
                <div className="absolute top-0 right-0 z-10 p-2 opacity-50 hover:opacity-100 transition-opacity">
                   <Settings className="w-4 h-4 text-zinc-400 cursor-pointer" />
                </div>
                <div className="flex-1 relative">
                  <CodeEditor value={code} onChange={setCode} language={activeLanguage} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#0c0c0e] h-1.5 border-t border-b border-white/5 hover:bg-primary/50 transition-colors" />
              
              {/* CONSOLE / TERMINAL */}
              <ResizablePanel defaultSize={40} className="bg-[#08080a] flex flex-col min-h-[200px]">
                <Tabs value={consoleTab} onValueChange={(v) => setConsoleTab(v as any)} className="w-full h-full flex flex-col">
                  
                  {/* Console Header */}
                  <div className="h-9 border-b border-white/5 flex items-center px-2 bg-[#0c0c0e] shrink-0 justify-between">
                    <TabsList className="h-full bg-transparent p-0 gap-4">
                      <TabsTrigger value="testcase" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-xs font-medium text-zinc-500 flex items-center gap-2 px-2 hover:text-zinc-300 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Testcase
                      </TabsTrigger>
                      <TabsTrigger value="custom" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 text-xs font-medium text-zinc-500 flex items-center gap-2 px-2 hover:text-zinc-300 transition-colors">
                        <Beaker className="w-3.5 h-3.5" /> Custom
                      </TabsTrigger>
                      <TabsTrigger value="result" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 text-xs font-medium text-zinc-500 flex items-center gap-2 px-2 hover:text-zinc-300 transition-colors">
                        <Terminal className="w-3.5 h-3.5" /> Execution Log
                        {executionResult && (
                           <span className={cn("ml-1.5 text-[10px] px-1.5 rounded-full font-bold uppercase", executionResult.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                             {executionResult.passed ? 'PASS' : 'FAIL'}
                           </span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    {/* Console Actions */}
                    <div className="flex items-center gap-2 pr-2">
                       <span className="text-[10px] text-zinc-600 font-mono hidden sm:block">READY_TO_COMPILE</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Console Content */}
                  <div className="flex-1 overflow-auto p-4 bg-[#08080a] font-mono text-sm relative">
                    <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
                    
                    <TabsContent value="testcase" className="mt-0 h-full flex flex-col relative z-10">
                      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                        {testCases.filter(t => t.is_public).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setActiveTestCaseId(i)} 
                            className={cn(
                              "px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all border", 
                              activeTestCaseId === i 
                                ? "bg-white/10 border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                                : "bg-transparent border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10"
                            )}
                          >
                            Node {i + 1}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                             <ChevronRight className="w-3 h-3" /> Input Stream
                          </label>
                          <div className="w-full bg-[#0c0c0e] p-4 rounded-lg border border-white/5 text-zinc-300 shadow-inner">
                             {testCases[activeTestCaseId]?.input}
                          </div>
                        </div>
                        {testCases[activeTestCaseId]?.output && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                               <ChevronRight className="w-3 h-3" /> Expected Output
                            </label>
                            <div className="w-full bg-[#0c0c0e] p-4 rounded-lg border border-white/5 text-zinc-500 shadow-inner">
                               {testCases[activeTestCaseId]?.output}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="mt-0 h-full relative z-10">
                      <CustomTestSandbox
                        defaultInput={testCases[0]?.input ? String(testCases[0].input) : ''}
                        onRunCustomTest={handleRunCustomTest}
                        isRunning={judgingPhase.status === 'running'}
                      />
                    </TabsContent>
                    
                    <TabsContent value="result" className="mt-0 h-full relative z-10">
                      {isJudging ? (
                        <div className="h-full flex flex-col items-center justify-center">
                           <JudgingLoader phase={judgingPhase} elapsedMs={elapsedMs} />
                        </div>
                      ) : !executionResult ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-700 space-y-4">
                          <Cpu className="w-12 h-12 opacity-20" />
                          <div className="text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-zinc-600">Awaiting Compilation</p>
                            <p className="text-[10px] text-zinc-700 mt-1">Initiate run sequence to view output logs.</p>
                          </div>
                        </div>
                      ) : executionResult.passed ? (
                         <div className="h-full flex items-center justify-center">
                            <div className="text-center space-y-4">
                               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] animate-pulse">
                                  <Sparkles className="w-10 h-10 text-emerald-400" />
                               </div>
                               <h3 className="text-xl font-bold text-white">Execution Successful</h3>
                               <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                                 Code complied with all standard protocols. Efficiency metrics available in the chart.
                               </p>
                            </div>
                         </div>
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
