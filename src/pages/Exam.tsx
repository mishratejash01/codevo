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
import { ProctoredInstructions } from '@/components/ProctoredInstructions';

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
  
  // Countdown Timer State
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); 
  const [totalDuration, setTotalDuration] = useState(0);

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
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId)
                     .eq('exam_type', currentExamType)
                     .eq('set_name', setName);
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

  // --- Initialize Timer from Fetched Data ---
  useEffect(() => {
    if (assignments.length > 0 && timeRemaining === null) {
      // Calculate total duration from fetched questions (sum of expected_time)
      const totalMinutes = assignments.reduce((acc: number, curr: any) => acc + (curr.expected_time || 20), 0);
      const totalSeconds = totalMinutes * 60;
      
      setTotalDuration(totalSeconds);
      setTimeRemaining(totalSeconds);
    }
  }, [assignments, timeRemaining]);

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
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
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
    
    // Log violation to session table immediately
    if (sessionId) { 
        // @ts-ignore
        supabase.from(SESSION_TABLE).update({ violation_count: newCount }).eq('id', sessionId).then(); 
    }
    
    if (newCount >= MAX_VIOLATIONS) { 
        finishExam("TERMINATED: Max Violations Reached"); 
    } else { 
        toast({ title: "⚠️ Violation Alert", description: `Strike ${newCount}/${MAX_VIOLATIONS}: ${message}`, variant: "destructive", duration: 5000 }); 
        setTimeout(() => { 
            if (document.fullscreenElement && document.hasFocus()) { setIsContentObscured(false); } 
        }, 3000); 
    }
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
  
  // --- COUNTDOWN TIMER LOGIC ---
  useEffect(() => { 
    let interval: NodeJS.Timeout; 
    if (isExamStarted && !isSubmitting && timeRemaining !== null && timeRemaining > 0) { 
      interval = setInterval(() => { 
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        }); 
        
        // Track per-question metrics (time spent on current question still increments)
        if (currentQuestionRef.current) { 
          const qId = currentQuestionRef.current; 
          setQuestionMetrics(prev => ({ ...prev, [qId]: { ...prev[qId], attempts: prev[qId]?.attempts || 0, isCorrect: prev[qId]?.isCorrect || false, score: prev[qId]?.score || 0, timeSpent: (prev[qId]?.timeSpent || 0) + 1 } })); 
        } 
      }, 1000); 
    } else if (timeRemaining === 0 && isExamStarted && !isSubmitting) {
        // Auto-submit when timer hits 0
        finishExam("TIME_UP");
    }
    return () => clearInterval(interval); 
  }, [isExamStarted, isSubmitting, timeRemaining]);

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

  const handleQuestionAttempt = (qId: string, isCorrect: boolean, score: number) => { 
      setQuestionMetrics(prev => ({ 
          ...prev, 
          [qId]: { 
              ...prev[qId], 
              attempts: (prev[qId]?.attempts || 0) + 1, 
              isCorrect: isCorrect || prev[qId]?.isCorrect || false, 
              score: Math.max(score, prev[qId]?.score || 0) // Keep highest score
          } 
      })); 
  };

  // --- CORE SUBMISSION LOGIC ---
  const finishExam = async (statusReason: string) => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true); 
    setFinishDialogOpen(false);
    
    // 1. Stop Media / Cleanup
    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    // 2. Calculate Final Metrics
    const { data: { user } } = await supabase.auth.getUser();
    
    const totalMaxScore = assignments.reduce((acc: number, curr: any) => acc + (curr.max_score || 0), 0);
    const spentTime = timeRemaining !== null ? (totalDuration - timeRemaining) : 0;
    
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let obtainedScore = 0;
    let attemptedCount = 0;

    // Build the detailed JSON for the new backend table
    const submissionDetails = assignments.map((a: any) => {
        const metrics = questionMetrics[a.id] || { attempts: 0, isCorrect: false, score: 0, timeSpent: 0 };
        
        if (metrics.attempts > 0) {
            attemptedCount++;
            if (metrics.isCorrect) {
                correctCount++;
                obtainedScore += metrics.score;
            } else {
                incorrectCount++;
            }
        } else {
            skippedCount++;
        }

        return {
            question_id: a.id,
            question_title: a.title,
            status: metrics.attempts === 0 ? 'Skipped' : (metrics.isCorrect ? 'Correct' : 'Incorrect'),
            score: metrics.score,
            max_score: a.max_score,
            attempts: metrics.attempts,
            time_spent_seconds: metrics.timeSpent
        };
    });

    const isTerminated = statusReason.includes("TERMINATED");
    const finalStatus = isTerminated ? 'terminated' : 'completed';

    // 3. Save to Backend (New Table & Session Table)
    if (user) {
        try {
            const promises = [];

            // A. Update the Session Table (Legacy/Session Tracking)
            if (sessionId) {
                // @ts-ignore
                const sessionUpdate = supabase.from(SESSION_TABLE).update({ 
                    status: finalStatus, 
                    end_time: new Date().toISOString(), 
                    duration_seconds: spentTime, 
                    questions_attempted: attemptedCount, 
                    questions_correct: correctCount, 
                    total_score: obtainedScore 
                }).eq('id', sessionId);
                promises.push(sessionUpdate);
            }

            // B. Upsert into the NEW detailed submission table
            // Note: Ensure 'iitm_exam_submission' exists in your Supabase schema
            const detailedSubmission = {
                user_id: user.id,
                exam_id: `${examType}-${setName}-${iitmSubjectId}`, // Unique composite ID for this exam context
                marks_obtained: obtainedScore,
                total_marks: totalMaxScore,
                correct_questions_count: correctCount,
                incorrect_questions_count: incorrectCount,
                skipped_questions_count: skippedCount,
                submission_data: submissionDetails, // The full JSON breakdown
                status: finalStatus,
                termination_reason: statusReason,
                updated_at: new Date().toISOString()
            };

            // @ts-ignore
            const submissionUpdate = supabase.from('iitm_exam_submission').upsert(
                detailedSubmission, 
                { onConflict: 'user_id, exam_id' } // Use user_id + exam_id as unique constraint if you want one record per exam type
            );
            promises.push(submissionUpdate);

            await Promise.all(promises);

        } catch (error) {
            console.error("Failed to save exam data:", error);
            toast({ variant: "destructive", title: "Save Warning", description: "Exam finished, but some data may not have synced." });
        }
    }

    // 4. Client-side Navigation Payload
    const resultsPayload = {
      stats: { 
          score: obtainedScore, 
          totalScore: totalMaxScore || (assignments.length * 100), 
          accuracy: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0, 
          correct: correctCount, 
          totalQuestions: assignments.length, 
          attempted: attemptedCount 
      },
      questionDetails: assignments.map((a: any) => ({ 
        id: a.id, 
        title: a.title, 
        description: a.description,
        status: (questionMetrics[a.id]?.attempts || 0) === 0 ? 'Skipped' : (questionMetrics[a.id]?.isCorrect ? 'Correct' : 'Incorrect'), 
        timeSpent: questionMetrics[a.id]?.timeSpent || 0, 
        score: questionMetrics[a.id]?.score, 
        attempts: questionMetrics[a.id]?.attempts 
      })),
      terminationReason: isTerminated ? statusReason : (statusReason === "TIME_UP" ? "Time Limit Reached" : null), 
      isError: isTerminated, 
      totalTime: spentTime, 
      examMetadata: { subjectId: iitmSubjectId, examType, setName }
    };

    navigate('/exam/result', { state: resultsPayload });
  };

  const formatTime = (s: number) => {
      if (s < 0) s = 0;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) {
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      }
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // --- RENDER ---
  return (
    <div className="h-screen bg-[#121212] text-white flex flex-col font-sans select-none overflow-hidden relative" onContextMenu={e => e.preventDefault()}>
      
      {/* SECURITY OVERLAY */}
      {isContentObscured && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-200 cursor-none">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" />
                <EyeOff className="w-24 h-24 text-red-600 relative z-10" />
            </div>
            <h2 className="text-4xl font-bold text-red-500 font-neuropol mb-4 tracking-widest">SECURITY LOCKOUT</h2>
            <p className="text-xl text-gray-400 max-w-lg mb-8">Suspicious activity detected. The exam environment has been obscured to prevent unauthorized access.</p>
            <div className="px-6 py-3 border border-red-500/30 rounded-full bg-red-950/30 text-red-400 font-mono text-sm animate-pulse">
                RETURN FOCUS TO BROWSER TO RESUME
            </div>
          </div>
      )}
      
      {!isExamStarted ? (
        <ProctoredInstructions onStart={handleStartExamRequest} />
      ) : (
        <>
          {/* --- NEW HEADER DESIGN (Based on Reference) --- */}
          <header className="h-[55px] shrink-0 bg-[#1E1E1E] border-b border-[#333] flex items-center justify-between px-4 z-50">
            
            {/* 1. LEFT: Identity */}
            <div className="flex items-center gap-3 text-sm font-bold tracking-wide select-none">
                <span className="text-[#007ACC] uppercase tracking-widest text-xs md:text-sm">
                   {decodeURIComponent(examType || 'PROCTORED')} EXAM
                </span>
                {setName && (
                    <span className="font-normal text-[#666] border-l border-[#444] pl-3 text-xs">
                        {setName}
                    </span>
                )}
            </div>

            {/* 2. CENTER: Timer & Status Pill */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
               <div className="bg-black border border-[#333] rounded px-4 py-1.5 flex items-center gap-4 shadow-sm">
                  <span className={cn(
                      "font-mono text-sm tracking-widest", 
                      (timeRemaining || 0) < 300 ? "text-red-500 animate-pulse" : "text-[#E0E0E0]"
                  )}>
                      {formatTime(timeRemaining || 0)}
                  </span>
                  
                  <div className="w-[1px] h-3 bg-[#444]" />
                  
                  <div className="flex gap-1.5">
                      {[...Array(MAX_VIOLATIONS)].map((_, i) => (
                          <div key={i} className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-300",
                              i < violationCount 
                                ? "bg-[#D32F2F] shadow-[0_0_6px_#D32F2F] scale-110" 
                                : "bg-[#333]"
                          )} />
                      ))}
                  </div>
               </div>
            </div>

            {/* 3. RIGHT: A/V Security Box & Actions */}
            <div className="flex items-center gap-3">
                {/* A/V Meter */}
                <div className="flex items-center bg-black border border-[#333] p-1 rounded gap-2 h-[38px] select-none">
                    {/* Video Feed (Small) */}
                    <div className="w-[45px] h-[30px] bg-[#222] relative overflow-hidden rounded-[2px]">
                       <video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-80" />
                       <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#D32F2F] rounded-full animate-pulse shadow-[0_0_4px_red]" />
                    </div>
                    
                    {/* Audio Bars */}
                    <div className="flex items-end gap-[2px] h-[18px] pr-1.5">
                       {[...Array(4)].map((_, i) => (
                          <div 
                             key={i} 
                             className={cn("w-[3px] transition-all duration-100 rounded-[1px]", audioLevel > (i * 20) ? "bg-[#4CAF50]" : "bg-[#333]")}
                             style={{ height: audioLevel > (i * 20) ? `${Math.max(30, Math.random() * 100)}%` : '20%' }} 
                          />
                       ))}
                    </div>
                </div>

                <Button 
                   variant="ghost" 
                   onClick={() => setFinishDialogOpen(true)}
                   className="h-[30px] bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[11px] font-bold px-4 rounded-[2px] tracking-wide ml-1 transition-colors"
                >
                   END
                </Button>
            </div>
          </header>
          
          <div className="flex-1 min-h-0 relative">
            <div className={cn("h-full transition-all duration-300", isContentObscured && "blur-2xl opacity-10 pointer-events-none")}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                  
                  {/* LEFT: Sidebar */}
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#1E1E1E] border-r border-[#333] hidden md:block">
                     <AssignmentSidebar 
                        selectedId={selectedAssignmentId} 
                        onSelect={(id) => { setSearchParams(p => { p.set('q', id); return p; }); setQuestionStatuses(prev => ({...prev, [id]: 'visited'})); }} 
                        questionStatuses={questionStatuses} 
                        preLoadedAssignments={assignments as any} 
                     />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle className="hidden md:flex bg-[#121212] border-l border-r border-[#333] w-1.5" />
                  
                  {/* CENTER: Main Content */}
                  <ResizablePanel defaultSize={80} className="h-full overflow-auto bg-[#1E1E1E]">
                     <ErrorBoundary>
                        {selectedAssignmentId ? (
                             <AssignmentView 
                                key={selectedAssignmentId} 
                                assignmentId={selectedAssignmentId} 
                                onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))} 
                                currentStatus={questionStatuses[selectedAssignmentId]} 
                                tables={activeTables} 
                                disableCopyPaste={true} 
                                onAttempt={(isCorrect, score) => handleQuestionAttempt(selectedAssignmentId, isCorrect, score)} 
                             />
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-[#666]">
                                <Lock className="w-16 h-16 mb-4 opacity-10" />
                                <p className="font-mono text-sm">Select a question to begin</p>
                             </div>
                        )}
                     </ErrorBoundary>
                  </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </>
      )}

      {/* FINISH DIALOG */}
      <AlertDialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
         <AlertDialogContent className="bg-[#1E1E1E] border-[#333] text-white">
            <AlertDialogHeader>
               <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
               <AlertDialogDescription className="text-gray-400">Are you sure you want to end this session? You cannot return once submitted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel className="bg-[#252526] border-[#333] hover:bg-[#2D2D2D] hover:text-white">Cancel</AlertDialogCancel>
               <AlertDialogAction onClick={() => finishExam("User Initiated")} className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-0">Submit</AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
      
      {/* Hidden Video for stream storage if needed */}
      <video ref={setVideoNode} className="hidden" muted playsInline />
    </div>
  );
};

export default Exam;
