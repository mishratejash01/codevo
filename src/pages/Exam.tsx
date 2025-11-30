import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Lock, LogOut, FileWarning, CheckCircle2, Timer, Trophy, Target, Clock, Mic, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Types
type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

interface ViolationLog {
  timestamp: string;
  type: string;
  message: string;
}

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

  // State
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [questionMetrics, setQuestionMetrics] = useState<Record<string, QuestionMetrics>>({});

  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Dialog States
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [examStats, setExamStats] = useState({
    attempted: 0,
    correct: 0,
    score: 0,
    total: 0,
    accuracy: 0
  });

  // Constants
  const MAX_VIOLATIONS = 3;

  // Fetch Assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments_exam'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('category', { ascending: true })
        .order('title', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // --- Media & Audio Handling ---
  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: 15 }, 
        audio: true 
      });
      
      setMediaStream(stream);
      
      // Initialize Audio Analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      analyzeAudio();
      return true;
    } catch (err) {
      console.error("Media permission denied:", err);
      toast({
        title: "Permission Denied",
        description: "Camera and Microphone access are required for proctoring. Please allow access to continue.",
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
    
    // Normalize to 0-100 range roughly
    const volume = Math.min(100, Math.round(average * 2.5));
    setAudioLevel(volume);

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- Proctoring Logic ---

  const enterFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error("Full screen denied", e);
      toast({
        title: "System Requirement",
        description: "Full screen mode is required to take this exam.",
        variant: "destructive",
      });
    }
  };

  const handleViolation = async (type: string, message: string) => {
    if (!isExamStarted || isSubmitting || !sessionId) return;

    const violation: ViolationLog = {
      timestamp: new Date().toISOString(),
      type,
      message
    };

    setViolationLogs(prev => [...prev, violation]);

    setViolationCount(prev => {
      const newCount = prev + 1;
      
      supabase
        .from('exam_sessions')
        .update({
          violation_count: newCount,
          violation_logs: [...violationLogs, violation] as any
        })
        .eq('id', sessionId)
        .then(({ error }) => {
          if (error) console.error('Error updating violations:', error);
        });

      if (newCount >= MAX_VIOLATIONS) {
        submitExam("Too many violations recorded.");
        return MAX_VIOLATIONS;
      }

      toast({
        title: "Proctoring Warning ⚠️",
        description: `Violation ${newCount}/${MAX_VIOLATIONS}: ${message}`,
        variant: "destructive",
        duration: 5000,
      });

      return newCount;
    });
  };

  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        submitExam("Terminated: Tab Switching Detected");
      }
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !isSubmitting) {
        submitExam("Terminated: Exited Full Screen Mode");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isWindows = navigator.platform.includes('Win') || navigator.userAgent.includes('Windows');
      if (isWindows && (e.key === 'Meta' || e.key === 'OS')) {
        e.preventDefault();
        submitExam("Terminated: Windows Key Usage Prohibited");
      }
    };

    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      handleViolation("copy_paste", "Copy/Paste functionality is disabled.");
    };

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", preventCopyPaste);
    window.addEventListener("paste", preventCopyPaste);
    window.addEventListener("cut", preventCopyPaste);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", preventCopyPaste);
      window.removeEventListener("paste", preventCopyPaste);
      window.removeEventListener("cut", preventCopyPaste);
      window.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [isExamStarted, isSubmitting]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExamStarted && !isSubmitting) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExamStarted, isSubmitting]);

  // Actions
  const handleStartExamRequest = async () => {
    // 1. Request Media Permissions First
    const permissionsGranted = await startMediaStream();
    if (!permissionsGranted) return;

    // 2. If granted, proceed to start logic
    await startExam();
  };

  const startExam = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start the exam.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      const sessionData = {
        user_id: user.id,
        user_email: user.email || '',
        full_name: profile?.full_name || '',
        total_questions: assignments.length,
        status: 'in_progress',
        start_time: new Date().toISOString(),
      };
      
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      enterFullScreen();
      setIsExamStarted(true);
      
      toast({
        title: "Exam Started",
        description: "Monitoring Active. Good Luck.",
      });
      
      if (assignments.length > 0 && !selectedAssignmentId) {
        setSearchParams({ q: assignments[0].id });
      }
    } catch (error: any) {
      console.error('Error starting exam:', error);
      toast({
        title: "Error",
        description: `Failed to start exam: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleFinishRequest = () => {
    setFinishDialogOpen(true);
  };

  const handleConfirmFinish = () => {
    setFinishDialogOpen(false);
    submitExam("User initiated submission");
  };

  const submitExam = async (reason?: string) => {
    console.log('Submitting exam with reason:', reason);
    setIsSubmitting(true);
    
    // Stop media
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Calculate metrics
    const questionsAttempted = Object.keys(questionMetrics).length;
    const questionsCorrect = Object.values(questionMetrics).filter(m => m.isCorrect).length;
    const totalScore = Object.values(questionMetrics).reduce((sum, m) => sum + m.score, 0);
    const totalAttempts = Object.values(questionMetrics).reduce((sum, m) => sum + m.attempts, 0);
    const avgAttemptsPerCorrect = questionsCorrect > 0 ? totalAttempts / questionsCorrect : 0;
    const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;

    setExamStats({
      attempted: questionsAttempted,
      correct: questionsCorrect,
      score: totalScore,
      total: assignments.length,
      accuracy: accuracy
    });

    if (sessionId) {
      const finalData = {
        status: reason && reason.includes("User") ? 'completed' : 'terminated',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        total_score: totalScore,
        total_attempts: totalAttempts,
        avg_attempts_per_correct: avgAttemptsPerCorrect,
      };
      
      const { error } = await supabase
        .from('exam_sessions')
        .update(finalData)
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error submitting exam:', error);
      }
    }
    
    setSummaryOpen(true);
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams({ q: id });
    if (questionStatuses[id] !== 'attempted') {
      setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
    }
  };

  const handleQuestionAttempt = (questionId: string, isCorrect: boolean, score: number) => {
    setQuestionMetrics(prev => {
      const updated = {
        ...prev,
        [questionId]: {
          attempts: (prev[questionId]?.attempts || 0) + 1,
          isCorrect: isCorrect || prev[questionId]?.isCorrect || false,
          score: Math.max(score, prev[questionId]?.score || 0)
        }
      };
      
      if (sessionId) {
        const questionsAttempted = Object.keys(updated).length;
        const questionsCorrect = Object.values(updated).filter(m => m.isCorrect).length;
        const totalScore = Object.values(updated).reduce((sum, m) => sum + m.score, 0);
        const totalAttempts = Object.values(updated).reduce((sum, m) => sum + m.attempts, 0);
        
        supabase
          .from('exam_sessions')
          .update({
            questions_attempted: questionsAttempted,
            questions_correct: questionsCorrect,
            total_score: totalScore,
            total_attempts: totalAttempts,
          })
          .eq('id', sessionId)
          .then(({ error }) => {
            if (error) console.error('Error updating session metrics:', error);
          });
      }
      
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#09090b] text-white flex flex-col font-sans select-none overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-bold tracking-tight text-red-500">Proctored Exam Portal</span>
        </div>

        {/* TOP MIDDLE CAMERA BOX */}
        {isExamStarted && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <div className="relative group">
              <div className="w-24 h-14 bg-black rounded-md overflow-hidden border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)] relative">
                {/* Live Video Feed */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                
                {/* Recording indicator dot */}
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]" />
              </div>
              <div className="absolute -bottom-4 left-0 w-full text-center">
                 <span className="text-[9px] text-red-500/70 font-mono tracking-widest uppercase">Live</span>
              </div>
            </div>

            {/* Audio Meter Visualizer */}
            <div className="h-14 w-2 flex flex-col-reverse gap-0.5 bg-black/50 p-0.5 rounded-sm border border-white/10">
              {[...Array(10)].map((_, i) => {
                // Calculate if this segment is "lit" based on volume
                const threshold = (i + 1) * 10;
                const isLit = audioLevel >= threshold;
                // Color gradient from green to red
                let colorClass = "bg-green-500";
                if (i > 6) colorClass = "bg-yellow-500";
                if (i > 8) colorClass = "bg-red-500";

                return (
                  <div 
                    key={i} 
                    className={cn(
                      "w-full flex-1 rounded-[1px] transition-all duration-75",
                      isLit ? colorClass : "bg-white/5"
                    )}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-6">
           <div className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-medium text-sm">{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-muted-foreground uppercase tracking-wider">Violations</span>
            <div className="flex gap-1">
              {[...Array(MAX_VIOLATIONS)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-6 md:w-8 h-2 rounded-full transition-colors duration-300",
                    i < violationCount ? "bg-red-500" : "bg-white/10"
                  )} 
                />
              ))}
            </div>
          </div>

          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleFinishRequest}
            className="gap-1 md:gap-2 px-2 md:px-4"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Finish Exam</span>
            <span className="sm:hidden">Finish</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
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
                     onStatusUpdate={(status) => {
                       setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }));
                     }}
                     currentStatus={questionStatuses[selectedAssignmentId]}
                     onAttempt={(isCorrect: boolean, score: number) => {
                       handleQuestionAttempt(selectedAssignmentId, isCorrect, score);
                     }}
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
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Waiting for proctor authorization...</p>
          </div>
        )}
      </div>

      {/* 1. Entry Instruction Modal */}
      <Dialog open={!isExamStarted} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-red-500/20 text-white sm:max-w-lg [&>button]:hidden">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Exam Environment Rules</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              You are about to enter a secure proctored environment. Monitoring permissions are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 bg-red-950/10 p-6 rounded-lg border border-red-500/10">
            
            {/* Permission Notice */}
            <div className="flex gap-3 items-start text-sm bg-black/40 p-3 rounded border border-white/5 mb-4">
               <Video className="w-5 h-5 text-blue-400 shrink-0" />
               <div className="text-blue-200">
                 <strong>Media Access Required</strong>
                 <p className="opacity-70 text-xs mt-1">We will request access to your Camera and Microphone for proctoring purposes. The feed is monitored in real-time.</p>
               </div>
            </div>

            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">Strict Full Screen Enforcement</strong>
                <span className="text-red-300">Leaving full screen mode will <u>immediately terminate and submit</u> your exam. No warnings.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">No Tab Switching</strong>
                <span className="text-red-300">Moving to another tab or window will <u>immediately terminate and submit</u> your exam.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">No Copy/Paste</strong>
                Clipboard functionality is completely disabled.
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm mt-6 border-t border-red-500/10 pt-4">
              <FileWarning className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="text-orange-400">
                <strong>Violation Policy</strong>
                <p className="text-orange-400/70 text-xs mt-1">
                  Exiting full screen or switching tabs terminates the exam immediately. Other violations (like copy/paste) are allowed up to 3 times before auto-submission.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Cancel & Exit
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white px-8"
              onClick={handleStartExamRequest}
            >
              I Agree & Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Finish Confirmation Alert */}
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
        <AlertDialogContent className="bg-[#0c0c0e] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Finish Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to finish the exam? You will not be able to return or change your answers once submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinish} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Yes, Finish Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3. Summary Modal */}
      <Dialog open={summaryOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md [&>button]:hidden">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Exam Completed</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Your responses have been successfully recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-2xl font-bold">{examStats.correct} / {examStats.total}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Correct</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <Target className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-2xl font-bold">{examStats.attempted}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Attempted</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <Clock className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-xl font-bold font-mono">{formatTime(elapsedTime)}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Time Taken</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-1">
              <div className="text-primary font-bold text-lg mb-1">{examStats.accuracy}%</div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-200">Total Score</div>
            <div className="text-3xl font-bold text-blue-400 mt-1">{examStats.score.toFixed(0)}</div>
          </div>

          <DialogFooter className="sm:justify-center mt-4">
            <Button 
              className="w-full bg-white text-black hover:bg-gray-200"
              onClick={() => {
                sessionStorage.clear(); // Clear exam data
                navigate('/');
              }}
            >
              Return to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exam;
