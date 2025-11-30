import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Lock, CheckCircle2, Timer, Trophy, Target, Clock, Video, Maximize, Mic, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Define Table Maps
const IITM_TABLES = { 
  assignments: 'iitm_assignments', 
  testCases: 'iitm_test_cases', 
  submissions: 'iitm_submissions' 
};

const STANDARD_TABLES = { 
  assignments: 'assignments', 
  testCases: 'test_cases', 
  submissions: 'submissions' 
};

interface QuestionMetrics {
  attempts: number;
  isCorrect: boolean;
  score: number;
}

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const selectedAssignmentId = searchParams.get('q');
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');
  const setName = searchParams.get('set_name');

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;

  // --- State ---
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, any>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Performance Metrics State
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, QuestionMetrics>>({});
  const [examStats, setExamStats] = useState({ attempted: 0, correct: 0, score: 0, total: 0, accuracy: 0 });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  
  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);

  // --- Data Fetching ---
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType, setName],
    queryFn: async () => {
      // @ts-ignore
      let query = supabase
        .from(activeTables.assignments)
        .select('*')
        .order('title', { ascending: true });

      if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (examType) query = query.eq('exam_type', decodeURIComponent(examType));
        if (setName) query = query.eq('set_name', setName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // --- Strict Proctoring Logic ---

  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }, 
        audio: true 
      });
      setMediaStream(stream);
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // CRITICAL FIX: Ensure AudioContext is running (browsers suspend it by default)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      analyzeAudio();
      return true;
    } catch (err) {
      console.error("Media Error:", err);
      toast({
        title: "Permission Denied",
        description: "Camera and Microphone access are required. Please allow permissions and try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    
    // Normalize to 0-100 for the visualizer
    // Multiply by a factor to make it more sensitive
    const volume = Math.min(100, Math.round(average * 2.0)); 
    
    setAudioLevel(volume);
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const enterFullScreen = async () => {
    const elem = document.documentElement as any;
    const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (requestFs) {
      try {
        await requestFs.call(elem);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  // --- Strict Event Listeners (Immediate Termination) ---
  useEffect(() => {
    if (!isExamStarted || isSubmitting) return;

    const handleVisibilityChange = () => { 
      if (document.hidden) finishExam("Terminated: Tab Switching Detected"); 
    };
    
    const handleFullScreenChange = () => { 
      if (!document.fullscreenElement && !isSubmitting) finishExam("Terminated: Exited Full Screen Mode"); 
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isWindows = navigator.platform.includes('Win') || navigator.userAgent.includes('Windows');
      // Block Windows Key, Command Key, and Escape
      if (isWindows && (e.key === 'Meta' || e.key === 'OS')) { 
        e.preventDefault(); 
        finishExam("Terminated: Windows Key Usage Prohibited"); 
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        // Allow a small grace period or check if it wasn't intended, but for strict:
        finishExam("Terminated: Escape Key Usage Prohibited");
      }
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
      }
    };
    
    const preventEvents = (e: Event) => e.preventDefault();

    // Attach Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);
    
    // Prevent Copy/Paste/Right Click
    window.addEventListener("copy", preventEvents);
    window.addEventListener("paste", preventEvents);
    window.addEventListener("cut", preventEvents);
    window.addEventListener("contextmenu", preventEvents);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", preventEvents);
      window.removeEventListener("paste", preventEvents);
      window.removeEventListener("cut", preventEvents);
      window.removeEventListener("contextmenu", preventEvents);
    };
  }, [isExamStarted, isSubmitting, sessionId]);

  // Video Node Effect
  useEffect(() => {
    if (videoNode && mediaStream) {
      videoNode.srcObject = mediaStream;
      videoNode.play().catch(e => console.error("Auto-play prevented:", e));
    }
  }, [videoNode, mediaStream]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamStarted && !isSubmitting) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isExamStarted, isSubmitting]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mediaStream]);

  // --- Handlers ---

  const handleStartExamRequest = async () => {
    const permissionsGranted = await startMediaStream();
    if (!permissionsGranted) return;
    
    const fullScreenGranted = await enterFullScreen();
    if (!fullScreenGranted) {
      toast({ title: "Full Screen Required", description: "Please enable full screen permissions.", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/auth'); return; }
      
      const { data: session } = await supabase.from('exam_sessions').insert({
        user_id: user.id,
        total_questions: assignments.length,
        status: 'in_progress',
        start_time: new Date().toISOString()
      }).select().single();
      
      if (session) setSessionId(session.id);
      setIsExamStarted(true);
      
      if (assignments.length > 0) {
        setSearchParams(prev => {
          const p = new URLSearchParams(prev);
          // @ts-ignore
          p.set('q', assignments[0].id);
          return p;
        });
      }
    } catch (err) {
      toast({ title: "Start Failed", description: "Could not create exam session.", variant: "destructive" });
    }
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        p.set('q', id);
        return p;
    });
    setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
  };

  // Called by AssignmentView when a submission happens
  const handleQuestionAttempt = (questionId: string, isCorrect: boolean, score: number) => {
    setQuestionMetrics(prev => ({
      ...prev,
      [questionId]: {
        attempts: (prev[questionId]?.attempts || 0) + 1,
        isCorrect: isCorrect || prev[questionId]?.isCorrect || false,
        score: Math.max(score, prev[questionId]?.score || 0)
      }
    }));
  };

  const finishExam = async (reason?: string) => {
    setIsSubmitting(true);
    setFinishDialogOpen(false);
    setTerminationReason(reason || null);
    
    // Stop Media
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    
    // Exit Full Screen safely
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Calculate Stats
    const questionsAttempted = Object.keys(questionMetrics).length;
    const questionsCorrect = Object.values(questionMetrics).filter(m => m.isCorrect).length;
    const totalScore = Object.values(questionMetrics).reduce((sum, m) => sum + m.score, 0);
    const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

    setExamStats({ 
      attempted: questionsAttempted, 
      correct: questionsCorrect, 
      score: totalScore, 
      total: assignments.length, 
      accuracy 
    });

    if (sessionId) {
      await supabase.from('exam_sessions').update({
        status: reason ? 'terminated' : 'completed',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        total_score: totalScore
      }).eq('id', sessionId);
    }
    
    setSummaryOpen(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-red-500">{decodeURIComponent(examType || 'Proctored')} Exam</div>
            <div className="text-[10px] text-muted-foreground">{setName}</div>
          </div>
        </div>

        {isExamStarted && !summaryOpen && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Live Video Feed */}
            <div className="relative group">
              <div className="w-24 h-16 bg-black rounded-md overflow-hidden border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] relative">
                <video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />
              </div>
              <div className="absolute -bottom-4 left-0 w-full text-center">
                 <span className="text-[9px] text-red-500/70 font-mono tracking-widest uppercase">REC</span>
              </div>
            </div>
            
            {/* Audio Visualizer */}
            <div className="h-16 w-2 flex flex-col-reverse gap-0.5 bg-black/50 p-0.5 rounded-sm border border-white/10">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={cn("w-full flex-1 rounded-[1px] transition-all", audioLevel >= (i + 1) * 10 ? (i > 7 ? "bg-red-500" : i > 4 ? "bg-yellow-500" : "bg-green-500") : "bg-white/5")} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
           {isExamStarted && (
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 font-mono text-sm">
               <Timer className="w-4 h-4 text-muted-foreground" />
               {formatTime(elapsedTime)}
             </div>
           )}
           <Button variant="destructive" size="sm" onClick={() => setFinishDialogOpen(true)}>Finish Exam</Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {isExamStarted ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 hidden md:block">
              <AssignmentSidebar 
                selectedId={selectedAssignmentId} 
                onSelect={handleQuestionSelect} 
                questionStatuses={questionStatuses} 
                preLoadedAssignments={assignments as any} 
              />
            </ResizablePanel>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize={80} className="h-full overflow-auto">
               <ErrorBoundary>
                {selectedAssignmentId ? (
                   <AssignmentView 
                     key={selectedAssignmentId}
                     assignmentId={selectedAssignmentId}
                     onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                     currentStatus={questionStatuses[selectedAssignmentId]}
                     tables={activeTables}
                     onAttempt={(isCorrect, score) => handleQuestionAttempt(selectedAssignmentId, isCorrect, score)}
                   />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Lock className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a question to begin</p>
                  </div>
                )}
               </ErrorBoundary>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* PRE-EXAM CHECK LOBBY */
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 bg-[#09090b]">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold font-neuropol text-white">System Check</h1>
              <p className="text-muted-foreground">We need to verify your environment before starting.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400"><Video /></div>
                 <div><h3 className="font-medium">Camera & Mic</h3><p className="text-xs text-muted-foreground">Must be active</p></div>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400"><Maximize /></div>
                 <div><h3 className="font-medium">Full Screen</h3><p className="text-xs text-muted-foreground">Mandatory</p></div>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center space-y-4">
                 <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400"><ShieldAlert /></div>
                 <div><h3 className="font-medium">No Switching</h3><p className="text-xs text-muted-foreground">Tab switch = Fail</p></div>
               </div>
            </div>

            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg" onClick={handleStartExamRequest}>
              I Agree & Start Exam
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white">
          <AlertDialogHeader><AlertDialogTitle>Submit Assessment?</AlertDialogTitle><AlertDialogDescription>This will end your session and submit all answers.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => finishExam("User Initiated")} className="bg-red-600 hover:bg-red-700">Submit</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUMMARY DIALOG */}
      <Dialog open={summaryOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className={cn("mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 border", terminationReason?.includes("Terminated") ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20")}>
              {terminationReason?.includes("Terminated") ? <XCircle className="w-8 h-8 text-red-500" /> : <Trophy className="w-8 h-8 text-green-500" />}
            </div>
            <DialogTitle className="text-2xl text-center">{terminationReason?.includes("Terminated") ? "Exam Terminated" : "Exam Completed"}</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {terminationReason || "Responses recorded successfully."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-2xl font-bold">{examStats.correct} / {examStats.total}</span>
              <span className="text-[10px] uppercase text-muted-foreground">Correct</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <Target className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-2xl font-bold">{examStats.attempted}</span>
              <span className="text-[10px] uppercase text-muted-foreground">Attempted</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <Clock className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-xl font-bold font-mono">{formatTime(elapsedTime)}</span>
              <span className="text-[10px] uppercase text-muted-foreground">Time Taken</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <div className="text-primary font-bold text-lg mb-1">{examStats.accuracy}%</div>
              <span className="text-[10px] uppercase text-muted-foreground">Accuracy</span>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-200">Total Score</div>
            <div className="text-3xl font-bold text-blue-400 mt-1">{examStats.score.toFixed(0)}</div>
          </div>
          
          <DialogFooter className="sm:justify-center mt-4">
            <Button className="w-full bg-white text-black hover:bg-gray-200" onClick={() => { sessionStorage.clear(); navigate('/'); }}>
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden video element for proctoring logic */}
      <video ref={setVideoNode} className="hidden" muted playsInline />
    </div>
  );
};

export default Exam;
