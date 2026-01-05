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
  Beaker, Sparkles, Zap, Maximize2, Minimize2, ChevronRight, Settings,
  ThumbsUp, ThumbsDown, ArrowLeft
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

// Helper to safely display input/output
const formatValue = (val: any) => {
  if (typeof val === 'object' && val !== null) return JSON.stringify(val);
  return String(val);
};

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
    const rawInput = formatValue(input || '');
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
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white">
      <Loader2 className="w-10 h-10 text-[#666] animate-spin" />
      <div className="text-xs font-mono text-[#666] uppercase tracking-widest">Initializing Studio...</div>
    </div>
  );

  if (error || !problem) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 p-6 text-white">
      <Bug className="w-10 h-10 text-red-500" />
      <h1 className="text-xl font-bold">Data Fetch Error</h1>
      <Button variant="outline" onClick={() => navigate('/practice-arena')} className="border-[#1A1A1C] hover:bg-[#1A1A1C]">
        Return
      </Button>
    </div>
  );

  const isJudging = judgingPhase.status !== 'idle' && judgingPhase.status !== 'complete';

  // Strict Design Implementation using your HTML structure translated to Tailwind
  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-[54px] bg-[#050505] border-b border-[#1A1A1C] flex items-center justify-between px-5 z-50 shrink-0">
        <div className="flex items-center gap-5">
           <div className="text-[#666666] cursor-pointer flex items-center hover:text-white transition-colors" onClick={() => navigate('/practice-arena')}>
              <ArrowLeft className="w-[18px] h-[18px]" />
           </div>
           <div className="font-mono text-[13px] font-semibold bg-[#0A0A0C] px-[14px] py-[4px] border border-[#1A1A1C] text-white">
              {formatTime(elapsedTime)}
           </div>
        </div>

        <div className="flex items-center gap-[10px]">
           {/* Stat Cluster (preserving your component logic inside the design's container) */}
           <div className="flex items-center gap-3 bg-[#0A0A0C] border border-[#1A1A1C] px-3 py-1 mr-2">
              <div className="text-[11px] font-semibold text-[#666666] flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                 <ThumbsUp className="w-3 h-3" />
                 <span>{problem.likes || 0}</span>
              </div>
              <div className="text-[11px] font-semibold text-[#666666] flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                 <ThumbsDown className="w-3 h-3" />
                 <span>{problem.dislikes || 0}</span>
              </div>
              <div className="text-[11px] font-semibold text-[#666666] flex items-center gap-1">
                 <Sparkles className="w-3 h-3" />
              </div>
           </div>

           <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
             <SelectTrigger className="h-[28px] w-auto bg-transparent border-[#1A1A1C] text-[#666] text-[10px] uppercase font-bold px-3 focus:ring-0">
               <SelectValue />
             </SelectTrigger>
             <SelectContent className="bg-[#0A0A0C] border-[#1A1A1C] text-[#666]">
               <SelectItem value="python">Python</SelectItem>
               <SelectItem value="javascript">JavaScript</SelectItem>
               <SelectItem value="java">Java</SelectItem>
               <SelectItem value="cpp">C++</SelectItem>
             </SelectContent>
           </Select>

           <button 
             onClick={handleRun}
             disabled={isRunning || isSubmitting}
             className="h-[32px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer rounded-[2px] transition-all bg-transparent text-white border border-[#1A1A1C] hover:bg-[#111] hover:border-[#333] flex items-center justify-center"
           >
             {isRunning ? <Loader2 className="w-3 h-3 animate-spin"/> : "Run"}
           </button>

           <button 
             onClick={handleSubmit}
             disabled={isRunning || isSubmitting}
             className="h-[32px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer rounded-[2px] transition-all bg-white text-black border-none hover:bg-gray-200 flex items-center justify-center"
           >
             {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin"/> : "Submit"}
           </button>
        </div>
      </header>

      {/* MAIN LAYOUT (Strict Grid: 460px 1fr) */}
      <main className="flex-1 grid lg:grid-cols-[460px_1fr] grid-cols-1 overflow-hidden">
        
        {/* LEFT PANEL: BRIEFING */}
        <section className="bg-[#0A0A0C] border-r border-[#1A1A1C] flex flex-col overflow-hidden lg:h-auto h-full hidden lg:flex">
           <div className="flex bg-[#050505] border-b border-[#1A1A1C] px-5 shrink-0">
              <div onClick={() => setDescriptionTab('description')} className={cn("py-[14px] mr-6 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer border-b-2 transition-colors", descriptionTab === 'description' ? "text-white border-white" : "text-[#666] border-transparent")}>Briefing</div>
              <div onClick={() => setDescriptionTab('editorial')} className={cn("py-[14px] mr-6 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer border-b-2 transition-colors", descriptionTab === 'editorial' ? "text-white border-white" : "text-[#666] border-transparent")}>Intel</div>
              <div onClick={() => setDescriptionTab('submissions')} className={cn("py-[14px] mr-6 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer border-b-2 transition-colors", descriptionTab === 'submissions' ? "text-white border-white" : "text-[#666] border-transparent")}>Log</div>
              <div onClick={() => setDescriptionTab('discussion')} className={cn("py-[14px] mr-6 text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer border-b-2 transition-colors", descriptionTab === 'discussion' ? "text-white border-white" : "text-[#666] border-transparent")}>Comms</div>
           </div>

           <div className="flex-1 overflow-y-auto px-[30px] py-[40px]">
              {descriptionTab === 'description' && (
                <>
                  <div className="flex items-center gap-[15px] mb-[18px]">
                     <div className={cn("text-[9px] font-extrabold uppercase px-2 py-[2px] bg-transparent border", 
                        problem.difficulty === 'Hard' ? "border-[#EF4444] text-[#EF4444]" : 
                        problem.difficulty === 'Medium' ? "border-yellow-500 text-yellow-500" : 
                        "border-green-500 text-green-500"
                     )}>
                        {problem.difficulty}
                     </div>
                     <div className="text-[10px] font-semibold text-[#666] uppercase">ID: {slug?.slice(0, 6).toUpperCase()} • Acceptance: {problem.acceptance_rate}%</div>
                  </div>

                  <h1 className="text-[24px] font-bold mb-[12px] text-white">{problem.title}</h1>

                  <div className="flex flex-wrap gap-2 mb-[25px]">
                     {problem.tags?.map((tag: string) => (
                       <div key={tag} className="text-[9px] font-bold text-[#666] bg-[#050505] px-[10px] py-[4px] uppercase">#{tag}</div>
                     ))}
                  </div>

                  <div className="text-[14px] leading-[1.6] text-[#ADADAD] mb-[40px] font-sans whitespace-pre-wrap">
                     {problem.description}
                  </div>

                  <div className="text-[10px] font-bold text-[#666] uppercase tracking-[0.1em] flex items-center gap-2 mb-[15px]">
                     Simulation Data
                  </div>

                  {testCases.filter((t:any) => t.is_public).map((t:any, i:number) => (
                    <div key={i} className="bg-[#050505] border border-[#1A1A1C] mb-[30px]">
                       <div className="px-[15px] py-[10px] border-b border-[#1A1A1C] flex justify-between items-center">
                          <span className="text-[10px] font-bold text-[#444]">Scenario {i + 1}</span>
                          <div className="flex gap-1">
                             <div className="w-[6px] h-[6px] rounded-full bg-[#EF4444]"></div>
                             <div className="w-[6px] h-[6px] rounded-full bg-[#F59E0B]"></div>
                             <div className="w-[6px] h-[6px] rounded-full bg-[#10B981]"></div>
                          </div>
                       </div>
                       <div className="p-[20px] font-mono text-[12px]">
                          <span className="text-[#666] block mb-[5px]">Input Stream</span>
                          <div className="text-[#d4d4d4] mb-4 break-words">{formatValue(t.input)}</div>
                          <span className="text-[#666] block mb-[5px]">Expected Output</span>
                          <div className="text-[#d4d4d4] break-words">{formatValue(t.output)}</div>
                       </div>
                    </div>
                  ))}

                  <div className="pt-[30px] border-t border-[#1A1A1C]">
                     <div className="text-[10px] font-bold text-[#666] uppercase tracking-[0.1em] mb-[15px]">Personal Notes</div>
                     <ProblemNotes problemId={problem.id} userId={userId} />
                  </div>
                </>
              )}

              {descriptionTab === 'editorial' && (
                 <div className="prose prose-invert prose-sm max-w-none text-[#d4d4d4]">
                    {problem.editorial ? <p className="whitespace-pre-wrap">{problem.editorial}</p> : <div className="text-[#666] text-center mt-20">Classified Intel.</div>}
                 </div>
              )}

              {descriptionTab === 'submissions' && (
                 <SubmissionHistory problemId={problem.id} userId={userId} onSelectSubmission={handleSelectSubmission} />
              )}

              {descriptionTab === 'discussion' && (
                 <DiscussionTab problemId={problem.id} userId={userId} />
              )}
           </div>
        </section>

        {/* RIGHT PANEL: IDE */}
        <section className="bg-[#050505] grid grid-rows-[1fr_280px] h-full overflow-hidden">
           <div className="flex flex-col h-full overflow-hidden relative">
              <div className="h-[40px] bg-[#0A0A0C] border-b border-[#1A1A1C] flex items-center justify-end px-[15px] shrink-0">
                 <Settings className="w-[14px] h-[14px] text-[#666]" />
              </div>
              <div className="flex-1 relative overflow-hidden">
                 <CodeEditor value={code} onChange={setCode} language={activeLanguage} fontSize={14} />
              </div>
           </div>

           <div className="bg-[#0A0A0C] border-t border-[#1A1A1C] flex flex-col h-full overflow-hidden">
              <div className="h-[42px] border-b border-[#1A1A1C] flex items-center px-[20px] gap-[28px] shrink-0">
                 <div onClick={() => setConsoleTab('testcase')} className={cn("text-[10px] font-bold uppercase cursor-pointer transition-colors", consoleTab === 'testcase' ? "text-white" : "text-[#666]")}>Testcase</div>
                 <div onClick={() => setConsoleTab('custom')} className={cn("text-[10px] font-bold uppercase cursor-pointer transition-colors", consoleTab === 'custom' ? "text-white" : "text-[#666]")}>Custom</div>
                 <div onClick={() => setConsoleTab('result')} className={cn("text-[10px] font-bold uppercase cursor-pointer transition-colors", consoleTab === 'result' ? "text-white" : "text-[#666]")}>Execution Log</div>
                 <div className="ml-auto text-[9px] font-bold text-[#444] tracking-[0.1em]">
                    {isJudging ? "PROCESSING_NODE..." : executionResult ? "EXECUTION_COMPLETE" : "READY_TO_COMPILE"}
                 </div>
              </div>
              
              <div className="flex-1 overflow-auto p-[20px] font-mono text-[12px] text-[#666]">
                 {consoleTab === 'testcase' && (
                    <div className="space-y-4">
                       <div className="flex gap-2 mb-4">
                          {testCases.filter(t => t.is_public).map((_, i) => (
                             <button 
                                key={i} 
                                onClick={() => setActiveTestCaseId(i)}
                                className={cn("px-3 py-1 text-[10px] border", activeTestCaseId === i ? "border-white text-white" : "border-[#333] text-[#666]")}
                             >
                                Node {i+1}
                             </button>
                          ))}
                       </div>
                       <div className="space-y-2">
                          <span className="block text-[#444] font-bold uppercase text-[10px]">Input Stream</span>
                          <div className="text-[#d4d4d4] bg-[#050505] p-2 border border-[#1A1A1C]">{formatValue(testCases[activeTestCaseId]?.input)}</div>
                       </div>
                       <div className="space-y-2">
                          <span className="block text-[#444] font-bold uppercase text-[10px]">Expected Output</span>
                          <div className="text-[#d4d4d4] bg-[#050505] p-2 border border-[#1A1A1C]">{formatValue(testCases[activeTestCaseId]?.output)}</div>
                       </div>
                    </div>
                 )}

                 {consoleTab === 'custom' && (
                    <CustomTestSandbox
                      defaultInput={testCases[0]?.input ? formatValue(testCases[0].input) : ''}
                      onRunCustomTest={handleRunCustomTest}
                      isRunning={judgingPhase.status === 'running'}
                    />
                 )}

                 {consoleTab === 'result' && (
                    <div className="h-full">
                       {isJudging ? (
                          <div className="flex flex-col gap-2">
                             <div className="text-[#d4d4d4]">$ initiating_judge_sequence...</div>
                             <div className="text-[#666] ml-2">>> Phase: {judgingPhase.message}</div>
                             <div className="text-[#666] ml-2">>> Time: {elapsedMs}ms</div>
                          </div>
                       ) : executionResult ? (
                          <div className="space-y-2">
                             <div className="text-[#d4d4d4]">$ execution_report</div>
                             <div className={cn("ml-2 font-bold", executionResult.passed ? "text-[#22C55E]" : "text-[#EF4444]")}>
                                >> Status: {executionResult.passed ? "PASSED" : "FAILED"}
                             </div>
                             {executionResult.errorDetails ? (
                                <div className="ml-2 text-[#EF4444] whitespace-pre-wrap">>> Error: {executionResult.errorDetails}</div>
                             ) : (
                                <>
                                   <div className="ml-2 text-[#666]">>> Runtime: {executionResult.runtime_ms}ms</div>
                                   <div className="ml-2 text-[#666]">>> Memory: {executionResult.memory_kb}KB</div>
                                   {!executionResult.passed && (
                                      <div className="ml-2 mt-2 text-[#EF4444]">
                                         >> Failed on Test Case {executionResult.failedTestIndex !== undefined ? executionResult.failedTestIndex + 1 : 'Unknown'}
                                         <br/>
                                         >> Feedback: {executionResult.feedbackMessage}
                                      </div>
                                   )}
                                </>
                             )}
                          </div>
                       ) : (
                          <div className="space-y-1">
                             <div>$ python solution.py --node milan_core_v4</div>
                             <div className="text-[#444]">>> Initializing Studio Node...</div>
                             <div className="text-[#444]">>> Secure handshake complete. Ready.</div>
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="h-[32px] bg-[#050505] border-t border-[#1A1A1C] flex items-center justify-between px-[20px] shrink-0">
         <div className="text-[#22C55E] text-[9px] font-bold uppercase tracking-[0.1em] flex items-center gap-[6px]">
            <span className="w-[5px] h-[5px] bg-current rounded-full"></span>
            Active / Secure
         </div>
         <div className="text-[9px] font-bold tracking-[0.25em] text-[#333] uppercase">CODéVO</div>
      </footer>
      
    </div>
  );
}
