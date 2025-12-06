import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Lock, Timer, Video, Maximize, Mic, MonitorX, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Table Maps
const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };
const PROCTORED_TABLE = 'iitm_exam_question_bank';

interface QuestionMetrics {
  attempts: number;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
}

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const selectedAssignmentId = searchParams.get('q');
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');
  const setName = searchParams.get('set_name');
  const mode = searchParams.get('mode');
  const isProctored = mode === 'proctored';
  
  // Logic to determine which table to use
  const activeTables = isProctored 
    ? { ...IITM_TABLES, assignments: PROCTORED_TABLE } // Override assignments source
    : (iitmSubjectId ? IITM_TABLES : STANDARD_TABLES);

  const SESSION_TABLE = iitmSubjectId ? 'iitm_exam_sessions' : 'exam_sessions';

  // --- State ---
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, any>>({});
  const [isContentObscured, setIsContentObscured] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, QuestionMetrics>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentQuestionRef = useRef<string | null>(selectedAssignmentId);

  const MAX_VIOLATIONS = 3;

  // --- Fetch Data ---
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType, setName, mode],
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from(activeTables.assignments).select('*').order('title', { ascending: true });
      
      const currentExamType = decodeURIComponent(examType || '');

      if (isProctored && setName) {
        // --- PROCTORED FETCH LOGIC ---
        // Fetch from iitm_exam_question_bank filtered by set_name and exam_type
        // @ts-ignore
        query = query.eq('exam_type', currentExamType).eq('set_name', setName);
      } else if (iitmSubjectId) {
        // --- PRACTICE FETCH LOGIC ---
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (examType) query = query.eq('exam_type', currentExamType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    currentQuestionRef.current = selectedAssignmentId;
  }, [selectedAssignmentId]);

  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 }, audio: true });
      setMediaStream(stream);
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      microphone.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      analyzeAudio();
      return true;
    } catch (err) {
      toast({ title: "Permission Denied", description: "Camera/Mic access is required.", variant: "destructive" });
      return false;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length / 2; i++) sum += dataArrayRef.current[i];
    const volume = Math.min(100, Math.round(Math.max(0, (sum / (dataArrayRef.current.length / 2)) - 15) * 3.5)); 
    setAudioLevel(volume);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const checkMultipleScreens = async () => {
    try {
      // @ts-ignore
      if (window.getScreenDetails) { const details = await window.getScreenDetails(); if (details.screens.length > 1) { toast({ title: "External Monitor Detected", description: "Please disconnect HDMI/Secondary displays.", variant: "destructive" }); return false; } } else if ((window.screen as any).isExtended) { toast({ title: "Extended Display Detected", description: "Please use a single screen only.", variant: "destructive" }); return false; }
    } catch (e) {}
    return true;
  };

  const enterFullScreen = async () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) { await elem.requestFullscreen(); return true; }
    return false;
  };

  const handleViolation = async (type: string, message: string) => {
    if (!isExamStarted || isSubmitting) return;
    setIsContentObscured(true);
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    if (sessionId) { 
        // @ts-ignore
        supabase.from(SESSION_TABLE).update({ violation_count: newCount }).eq('id', sessionId).then(); 
    }
    if (newCount >= MAX_VIOLATIONS) { finishExam("TERMINATED: Max Violations Reached"); } else { toast({ title: "⚠️ Violation Alert", description: `Strike ${newCount}/${MAX_VIOLATIONS}: ${message}`, variant: "destructive", duration: 5000 }); setTimeout(() => { if (document.fullscreenElement && document.hasFocus()) { setIsContentObscured(false); } }, 3000); }
  };

  useEffect(() => {
    if (!isExamStarted) return;
    const handleVisibility = () => { if (document.hidden) handleViolation("Tab Switch", "Tab switching detected."); };
    const handleFullScreen = () => { if (!document.fullscreenElement && !isSubmitting) finishExam("TERMINATED: Fullscreen Exited"); };
    const handleBlur = () => { handleViolation("Focus Lost", "Window lost focus. Possible remote interaction."); };
    const handleResize = () => { if (document.fullscreenElement && (window.screen.height - window.innerHeight) > 50) handleViolation("External Overlay", "Screen sharing or recording overlay detected."); };
    const handleKeys = (e: KeyboardEvent) => { if (e.metaKey || e.key === 'Meta' || e.key === 'Escape' || e.key === 'OS' || (e.altKey && e.key === 'Tab') || e.key === 'PrintScreen') { e.preventDefault(); handleViolation("Prohibited Key", "Restricted Key Press"); } };
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("visibilitychange", handleVisibility); document.addEventListener("fullscreenchange", handleFullScreen); window.addEventListener("blur", handleBlur); window.addEventListener("resize", handleResize); document.addEventListener("keydown", handleKeys); window.addEventListener("copy", prevent); window.addEventListener("paste", prevent); window.addEventListener("contextmenu", prevent);
    return () => { document.removeEventListener("visibilitychange", handleVisibility); document.removeEventListener("fullscreenchange", handleFullScreen); window.removeEventListener("blur", handleBlur); window.removeEventListener("resize", handleResize); document.removeEventListener("keydown", handleKeys); window.removeEventListener("copy", prevent); window.removeEventListener("paste", prevent); window.removeEventListener("contextmenu", prevent); };
  }, [isExamStarted, isSubmitting, violationCount]);

  useEffect(() => { if (videoNode && mediaStream) { videoNode.srcObject = mediaStream; videoNode.play().catch(console.error); } }, [videoNode, mediaStream]);
  useEffect(() => { let interval: NodeJS.Timeout; if (isExamStarted && !isSubmitting) { interval = setInterval(() => { setElapsedTime(prev => prev + 1); if (currentQuestionRef.current) { const qId = currentQuestionRef.current; setQuestionMetrics(prev => ({ ...prev, [qId]: { ...prev[qId], attempts: prev[qId]?.attempts || 0, isCorrect: prev[qId]?.isCorrect || false, score: prev[qId]?.score || 0, timeSpent: (prev[qId]?.timeSpent || 0) + 1 } })); } }, 1000); } return () => clearInterval(interval); }, [isExamStarted, isSubmitting]);

  const handleStartExamRequest = async () => {
    if (!(await checkMultipleScreens())) return;
    if (!(await startMediaStream())) return;
    if (!(await enterFullScreen())) { toast({ title: "Full Screen Required", variant: "destructive" }); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      const sessionData: any = { user_id: user.id, status: 'in_progress', start_time: new Date().toISOString() };
      if (iitmSubjectId) { sessionData.subject_id = iitmSubjectId; sessionData.exam_type = decodeURIComponent(examType || ''); sessionData.set_name = setName; }
      // @ts-ignore
      const { data: session } = await supabase.from(SESSION_TABLE).insert(sessionData).select().single();
      if (session) setSessionId(session.id);
      setIsExamStarted(true);
      if (assignments.length > 0) setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('q', assignments[0].id); return p; }); else toast({ title: "No Questions", description: "This set contains no questions.", variant: "destructive" });
    } catch (err) { toast({ title: "Error", description: "Failed to start session.", variant: "destructive" }); }
  };

  const handleQuestionAttempt = (qId: string, isCorrect: boolean, score: number) => { setQuestionMetrics(prev => ({ ...prev, [qId]: { ...prev[qId], attempts: (prev[qId]?.attempts || 0) + 1, isCorrect: isCorrect || prev[qId]?.isCorrect || false, score: Math.max(score, prev[qId]?.score || 0) } })); };

  const finishExam = (statusReason?: string) => {
    setIsSubmitting(true); setFinishDialogOpen(false);
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    const qIds = Object.keys(questionMetrics); const correctCount = Object.values(questionMetrics).filter(m => m.isCorrect).length; const totalScore = Object.values(questionMetrics).reduce((acc, curr) => acc + curr.score, 0); const totalMaxScore = assignments.reduce((acc: number, curr: any) => acc + (curr.max_score || 0), 0);
    const resultsPayload = {
      stats: { score: totalScore, totalScore: totalMaxScore || (assignments.length * 100), accuracy: qIds.length > 0 ? Math.round((correctCount / qIds.length) * 100) : 0, correct: correctCount, totalQuestions: assignments.length, attempted: qIds.length },
      questionDetails: assignments.map((a: any) => ({ id: a.id, title: a.title, status: (questionMetrics[a.id]?.attempts || 0) === 0 ? 'Skipped' : (questionMetrics[a.id]?.isCorrect ? 'Correct' : 'Incorrect'), timeSpent: questionMetrics[a.id]?.timeSpent || 0, score: questionMetrics[a.id]?.score, attempts: questionMetrics[a.id]?.attempts })),
      terminationReason: statusReason?.includes("TERMINATED") ? statusReason : (statusReason === "TIME_UP" ? "Time Limit Reached" : null), isError: statusReason?.includes("TERMINATED"), totalTime: elapsedTime, examMetadata: { subjectId: iitmSubjectId, examType, setName }
    };
    if (sessionId) { 
        // @ts-ignore
        supabase.from(SESSION_TABLE).update({ status: statusReason?.includes("TERMINATED") ? 'terminated' : 'completed', end_time: new Date().toISOString(), duration_seconds: elapsedTime, questions_attempted: qIds.length, questions_correct: correctCount, total_score: totalScore }).eq('id', sessionId).then(); 
    }
    navigate('/exam/result', { state: resultsPayload });
  };

  const formatTime = (s: number) => new Date(s * 1000).toISOString().substr(11, 8);

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden relative" onContextMenu={e => e.preventDefault()}>
      {isContentObscured && <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-200 cursor-none"><div className="relative mb-6"><div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" /><EyeOff className="w-24 h-24 text-red-600 relative z-10" /></div><h2 className="text-4xl font-bold text-red-500 font-neuropol mb-4 tracking-widest">SECURITY LOCKOUT</h2><p className="text-xl text-gray-400 max-w-lg mb-8">Suspicious activity detected. The exam environment has been obscured to prevent unauthorized access, recording, or remote viewing.</p><div className="px-6 py-3 border border-red-500/30 rounded-full bg-red-950/30 text-red-400 font-mono text-sm animate-pulse">RETURN FOCUS TO BROWSER TO RESUME</div></div>}
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20"><Lock className="w-4 h-4 text-red-500" /></div><div><div className="font-bold text-red-500">{decodeURIComponent(examType || 'Proctored')} Exam</div>{setName && <div className="text-[10px] text-muted-foreground">{setName}</div>}</div></div>
        {isExamStarted && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"><div className="relative group"><div className="w-24 h-16 bg-black rounded-md overflow-hidden border border-red-500/30 relative shadow-[0_0_10px_rgba(239,68,68,0.1)]"><video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" /><div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" /></div><div className="absolute -bottom-4 left-0 w-full text-center"><span className="text-[9px] text-red-500/70 font-mono uppercase">REC</span></div></div><div className="h-16 w-3 flex flex-col-reverse gap-0.5 bg-black/50 p-0.5 rounded-sm border border-white/10">{[...Array(12)].map((_, i) => <div key={i} className={cn("w-full flex-1 rounded-[1px] transition-all duration-75", audioLevel >= (i + 1) * 8 ? (i > 9 ? "bg-red-500" : i > 6 ? "bg-yellow-500" : "bg-green-500") : "bg-white/5")} />)}</div></div>}
        <div className="flex items-center gap-4">{isExamStarted && <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-sm"><Timer className="w-4 h-4 text-muted-foreground" />{formatTime(elapsedTime)}</div>}<div className="flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-1 rounded"><span className="text-[10px] text-muted-foreground uppercase">Strikes</span><div className="flex gap-1">{[...Array(MAX_VIOLATIONS)].map((_, i) => <div key={i} className={cn("w-1.5 h-4 rounded-full transition-colors", i < violationCount ? "bg-red-600 shadow-[0_0_5px_red]" : "bg-white/20")} />)}</div></div><Button variant="destructive" size="sm" onClick={() => setFinishDialogOpen(true)}>Finish</Button></div>
      </header>
      <div className="flex-1 min-h-0 relative">
        <div className={cn("h-full transition-all duration-300", isContentObscured && "blur-2xl opacity-10 pointer-events-none")}>
          {isExamStarted ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
               <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 hidden md:block"><AssignmentSidebar selectedId={selectedAssignmentId} onSelect={(id) => { setSearchParams(p => { p.set('q', id); return p; }); setQuestionStatuses(prev => ({...prev, [id]: 'visited'})); }} questionStatuses={questionStatuses} preLoadedAssignments={assignments as any} /></ResizablePanel>
               <ResizableHandle withHandle className="hidden md:flex bg-black border-l border-r border-white/10 w-1.5" />
               <ResizablePanel defaultSize={80} className="h-full overflow-auto"><ErrorBoundary>{selectedAssignmentId ? <AssignmentView key={selectedAssignmentId} assignmentId={selectedAssignmentId} onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))} currentStatus={questionStatuses[selectedAssignmentId]} tables={activeTables} disableCopyPaste={true} onAttempt={(isCorrect, score) => handleQuestionAttempt(selectedAssignmentId, isCorrect, score)} /> : <div className="h-full flex flex-col items-center justify-center text-muted-foreground"><Lock className="w-16 h-16 mb-4 opacity-20" /><p>Select a question to begin</p></div>}</ErrorBoundary></ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-[#09090b]"><div className="text-center space-y-2"><h1 className="text-3xl font-bold font-neuropol text-white">System Check</h1><p className="text-muted-foreground">Verification required.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"><div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4"><div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400"><Video /></div><div><h3 className="font-medium">Camera & Mic</h3><p className="text-xs text-muted-foreground">Active</p></div></div><div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4"><div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400"><Maximize /></div><div><h3 className="font-medium">Full Screen</h3><p className="text-xs text-muted-foreground">Mandatory</p></div></div><div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4"><div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400"><MonitorX /></div><div><h3 className="font-medium">Single Display</h3><p className="text-xs text-muted-foreground">HDMI Blocked</p></div></div></div><Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg" onClick={handleStartExamRequest}>I Agree & Start Exam</Button></div>
          )}
        </div>
      </div>
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}><AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white"><AlertDialogHeader><AlertDialogTitle>Submit Assessment?</AlertDialogTitle><AlertDialogDescription>End session and submit answers.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => finishExam("User Initiated")} className="bg-red-600 hover:bg-red-700">Submit</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <video ref={setVideoNode} className="hidden" muted playsInline />
    </div>
  );
};

export default Exam;
