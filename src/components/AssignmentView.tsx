import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from './CodeEditor';
import { TestCaseView } from './TestCaseView';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, BookOpen, Flag, RefreshCw, Code2, Lock, Unlock, FileCode, Terminal, ChevronRight, Activity } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

// --- Tactical Sub-components ---

const TacticalMeter = ({ label, current, total, colorClass, icon: Icon }: { label: string, current: number, total: number, colorClass: string, icon: any }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-4 rounded-sm flex-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-[#555]" />
          <span className="text-[9px] font-black uppercase tracking-[2px] text-[#555]">{label}</span>
        </div>
        <span className="font-mono text-xs font-bold text-white tracking-tighter">{current}/{total}</span>
      </div>
      <div className="h-[6px] w-full bg-black border border-[#1a1a1a] relative overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-700 ease-out relative", colorClass)}
          style={{ width: `${percentage}%` }}
        >
          {/* Subtle Scanline effect on meter */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
};

const DEFAULT_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
  onAttempt?: (isCorrect: boolean, score: number) => void;
  tables?: { assignments: string; testCases: string; submissions: string; };
  disableCopyPaste?: boolean;
  onCodeSubmit?: (code: string, language: string, testResults: { public_passed: number; public_total: number; private_passed: number; private_total: number }) => void;
}

// ... (Utility functions getTargetName, normalizeOutput, detectInitialLanguage, getStarterTemplate, getFileName remain the same) ...

export const AssignmentView = ({ 
  assignmentId, 
  onStatusUpdate, 
  currentStatus, 
  onAttempt, 
  tables = DEFAULT_TABLES,
  disableCopyPaste = false,
  onCodeSubmit
}: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  
  const { executeCode, loading: runnerLoading } = useCodeRunner();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const codeInitialized = useRef<string | null>(null);

  // Queries (Kept the same logic as your source)
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId, tables.assignments],
    queryFn: async () => {
      const { data, error } = await supabase.from(tables.assignments as any).select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!assignmentId
  });

  const { data: fetchedTestCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId, tables.testCases],
    queryFn: async () => {
      const { data } = await supabase.from(tables.testCases as any).select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!assignmentId && !!assignment && (!(assignment as any).test_cases || (assignment as any).test_cases.length === 0)
  });

  const testCases = useMemo(() => {
    // ... (Same stable test cases normalization logic) ...
  }, [assignment, fetchedTestCases]);

  const { data: latestSubmission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: ['submission', assignmentId, tables.submissions],
    queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data } = await supabase.from(tables.submissions as any).select('code, score, public_tests_passed, private_tests_passed').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
        return data as any;
    },
    enabled: !!assignmentId
  });

  // Effects for initialization
  useEffect(() => {
    if (codeInitialized.current !== assignmentId) {
      setTestResults({});
      setConsoleOutput('');
      setBottomTab('testcases');
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignment && !isSubmissionLoading && codeInitialized.current !== assignmentId) {
      const detected = detectInitialLanguage(assignment.title, assignment.category || '');
      setActiveLanguage(detected);
      const savedDraft = sessionStorage.getItem(`exam_draft_${assignmentId}`);
      if (savedDraft) setCode(savedDraft);
      else if (latestSubmission?.code) setCode(latestSubmission.code);
      else if (assignment.starter_code) setCode(assignment.starter_code);
      else setCode(getStarterTemplate(detected));
      codeInitialized.current = assignmentId;
    }
  }, [assignmentId, assignment, latestSubmission, isSubmissionLoading]);

  // Handlers (Run, Submit, Change)
  const handleRun = async () => { /* ... existing handleRun logic ... */ };
  const submitMutation = useMutation({ /* ... existing submitMutation logic ... */ });

  if (isLoading) return <div className="flex justify-center items-center h-full bg-[#050505]"><Loader2 className="animate-spin text-[#f39233]"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10 bg-[#050505]"><Button variant="outline" onClick={() => refetch()} className="border-[#1a1a1a]">Retry Terminal Connection</Button></div>;

  const publicTests = testCases.filter((tc: any) => tc.is_public);
  const privateTests = testCases.filter((tc: any) => !tc.is_public);
  const currentPubPassed = Object.keys(testResults).length > 0 ? publicTests.filter(t => testResults[t.id]?.passed).length : (latestSubmission?.public_tests_passed || 0);
  const currentPrivPassed = (Object.keys(testResults).length > 0 && privateTests.some(t => testResults.hasOwnProperty(t.id))) ? privateTests.filter(t => testResults[t.id]?.passed).length : (latestSubmission?.private_tests_passed || 0);

  return (
    <div className="h-full w-full bg-[#050505] text-white overflow-hidden font-sans">
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .matrix-scroll::-webkit-scrollbar { width: 4px; }
        .matrix-scroll::-webkit-scrollbar-track { background: #050505; }
        .matrix-scroll::-webkit-scrollbar-thumb { background: #1a1a1a; }
      `}</style>

      <ResizablePanelGroup direction="horizontal" className="h-full">
        
        {/* --- LEFT PANEL: TACTICAL BRIEFING --- */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#050505] border-r border-[#1a1a1a] flex flex-col">
          <div className="h-14 border-b border-[#1a1a1a] flex items-center px-6 justify-between bg-black/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#f39233] rounded-full shadow-[0_0_8px_#f39233]" />
              <span className="text-[10px] font-black uppercase tracking-[3px] text-white">Data_Briefing.vtx</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="font-mono text-[10px] text-[#555] tracking-widest">
                 SCORE: <span className="text-white font-bold">{latestSubmission?.score?.toFixed(0) || 0}</span> / {assignment.max_score}
               </div>
               <button 
                onClick={() => { onStatusUpdate('review'); toast({description:"Marked for Tactical Review"}); }} 
                className={cn("p-1.5 border transition-all", currentStatus === 'review' ? "border-[#f39233] text-[#f39233]" : "border-[#1a1a1a] text-[#555] hover:text-white")}
               >
                 <Flag className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>

          <ScrollArea className="flex-1 matrix-scroll">
            <div className="p-8 space-y-8">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[4px] text-[#555] mb-2">Subject_Module // {assignment.category || "GENERAL"}</div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-4 leading-none">{assignment.title}</h1>
                <div className="flex items-center gap-4">
                  <div className="px-2 py-0.5 bg-[#f39233] text-black text-[9px] font-black uppercase tracking-wider">
                    {activeLanguage}
                  </div>
                  <div className="text-[9px] font-bold text-[#555] uppercase tracking-[2px] flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System_Active
                  </div>
                </div>
              </div>

              <div className="prose prose-invert prose-sm">
                <div className="whitespace-pre-wrap font-sans text-[#a1a1a1] leading-relaxed selection:bg-[#f39233]/30">
                  {assignment.description}
                </div>
              </div>

              {assignment.instructions && (
                <div className="relative group">
                  <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-[#f39233]/40" />
                  <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-5">
                    <div className="text-[9px] font-black uppercase tracking-[2px] text-[#f39233] mb-2">Protocol_Notes</div>
                    <div className="text-xs text-[#888] leading-relaxed whitespace-pre-wrap italic">
                      {assignment.instructions}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-6 border-t border-[#1a1a1a]">
                 <div className="text-[9px] font-black uppercase tracking-[3px] text-[#555]">Validation_Matrix</div>
                 <div className="flex flex-col gap-3">
                    <TacticalMeter 
                      label="Public_Blocks" 
                      current={currentPubPassed} 
                      total={publicTests.length} 
                      colorClass="bg-[#00ffa3] shadow-[0_0_10px_#00ffa366]" 
                      icon={Unlock} 
                    />
                    <TacticalMeter 
                      label="Encryption_Tests" 
                      current={currentPrivPassed} 
                      total={privateTests.length} 
                      colorClass="bg-[#f39233] shadow-[0_0_10px_#f3923366]" 
                      icon={Lock} 
                    />
                 </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-[#050505] border-x border-[#1a1a1a] w-3 hover:bg-[#1a1a1a] transition-colors" />

        {/* --- RIGHT PANEL: TACTICAL TERMINAL --- */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#050505]">
              
              {/* Editor Toolbar */}
              <div className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6 bg-black/40 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Select value={activeLanguage} onValueChange={(v:any) => { setActiveLanguage(v); setCode(getStarterTemplate(v)); }}>
                      <SelectTrigger className="h-9 w-[130px] bg-[#0c0c0c] border-[#1a1a1a] text-[10px] font-black uppercase tracking-wider rounded-none focus:ring-0 focus:ring-offset-0">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-[#f39233]" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0c0c0c] border-[#1a1a1a] text-white rounded-none">
                        {['python', 'java', 'cpp', 'c', 'javascript', 'sql', 'bash'].map(l => (
                          <SelectItem key={l} value={l} className="text-[10px] font-bold uppercase tracking-widest focus:bg-[#f39233] focus:text-black">{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-[#555] uppercase tracking-[2px]">
                    <FileCode className="w-3.5 h-3.5" /> IO_BUFFER: <span className="text-white">Main.{activeLanguage === 'python' ? 'py' : activeLanguage === 'javascript' ? 'js' : activeLanguage}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleRun} 
                    disabled={runnerLoading} 
                    className="h-9 px-6 bg-[#0c0c0c] border border-[#1a1a1a] text-[10px] font-black uppercase tracking-[2px] text-white hover:bg-white hover:text-black transition-all disabled:opacity-50"
                  >
                    {runnerLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Execute_Local'}
                  </button>
                  <button 
                    onClick={() => submitMutation.mutate()} 
                    disabled={submitMutation.isPending || runnerLoading} 
                    className="h-9 px-6 bg-[#f39233] text-black text-[10px] font-black uppercase tracking-[2px] hover:bg-[#ffce8c] transition-all disabled:opacity-50"
                  >
                    {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Commit_To_Main'}
                  </button>
                </div>
              </div>

              <div className="flex-1 relative bg-[#050505]">
                <CodeEditor 
                  value={code} 
                  onChange={(val) => { setCode(val); sessionStorage.setItem(`exam_draft_${assignmentId}`, val); }} 
                  disableCopyPaste={disableCopyPaste} 
                  language={activeLanguage}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-[#050505] border-y border-[#1a1a1a] h-3 hover:bg-[#1a1a1a] transition-colors" />
            
            {/* --- BOTTOM TABS: STATUS OUTPUT --- */}
            <ResizablePanel defaultSize={30} className="bg-[#0c0c0c] flex flex-col relative">
              <Tabs value={bottomTab} onValueChange={(v:any) => setBottomTab(v)} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-6 py-2 border-b border-[#1a1a1a] bg-black/20 shrink-0">
                  <TabsList className="h-8 bg-black border border-[#1a1a1a] p-1 gap-1 rounded-none">
                    <TabsTrigger value="testcases" className="text-[9px] font-black uppercase tracking-widest h-6 px-4 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white rounded-none">Matrix_Tests</TabsTrigger>
                    <TabsTrigger value="console" className="text-[9px] font-black uppercase tracking-widest h-6 px-4 data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white rounded-none">Sys_Output</TabsTrigger>
                  </TabsList>
                  <button className="text-[#555] hover:text-white transition-colors" onClick={() => setConsoleOutput('')}>
                    <RefreshCw className="w-3.5 h-3.5"/>
                  </button>
                </div>
                
                <div className="flex-1 min-h-0 relative">
                  <TabsContent value="testcases" className="h-full m-0 p-0 matrix-scroll overflow-auto">
                    <TestCaseView testCases={testCases} testResults={testResults} />
                  </TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-0">
                    <div className="h-full p-6 font-mono text-[13px] overflow-auto bg-[#050505] matrix-scroll">
                      <pre className={cn("whitespace-pre-wrap leading-relaxed", consoleOutput.includes('Error') ? "text-[#ff4d4d]" : "text-[#00ffa3]")}>
                        {consoleOutput || <span className="text-[#333] italic">// AWAITING_INPUT...</span>}
                      </pre>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* TACTICAL WATERMARK */}
              <div className="absolute bottom-4 right-6 pointer-events-none select-none z-50 flex flex-col items-end opacity-20">
                <div className="text-[8px] font-black tracking-[4px] text-[#555] mb-1">STATION_ARENA_01</div>
                <span className="font-neuropol text-[12px] font-black tracking-[4px] text-white">
                  COD<span className="text-[1.2em] lowercase relative top-[0.5px] mx-[0.5px] inline-block">é</span>VO
                </span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
