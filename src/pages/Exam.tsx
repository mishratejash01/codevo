import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Lock, Timer, EyeOff } from 'lucide-react';
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

interface ViolationEntry {
  [key: string]: any; // Index signature for JSON compatibility
  timestamp: string;
  type: string;
  message: string;
  violation_number: number;
  current_question_id: string | null;
  time_elapsed_seconds: number;
}

interface CodeSnapshot {
  [key: string]: any; // Index signature for JSON compatibility
  code: string;
  language: string;
  testResults: {
    public_passed: number;
    public_total: number;
    private_passed: number;
    private_total: number;
  } | null;
  submitted_at: string;
}

interface BrowserInfo {
  [key: string]: any; // Index signature for JSON compatibility
  user_agent: string;
  screen_resolution: string;
  window_size: string;
  timezone: string;
  language: string;
  platform: string;
  is_mobile: boolean;
  color_depth: number;
  device_memory: number | null;
  hardware_concurrency: number;
  online: boolean;
}

interface EnvironmentFlags {
  camera_enabled: boolean;
  mic_enabled: boolean;
  fullscreen_maintained: boolean;
  single_screen: boolean;
  webcam_active_at_end: boolean;
  mic_active_at_end: boolean;
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
  
  const activeTables = isProctored 
    ? { ...IITM_TABLES, assignments: PROCTORED_TABLE }
    : (iitmSubjectId ? IITM_TABLES : STANDARD_TABLES);

  const SESSION_TABLE = iitmSubjectId ? 'iitm_exam_sessions' : 'exam_sessions';

  // --- State ---
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, any>>({});
  
  // --- NEW: Detailed tracking states ---
  const [violationLogs, setViolationLogs] = useState<ViolationEntry[]>([]);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [environmentFlags, setEnvironmentFlags] = useState<EnvironmentFlags | null>(null);
  const [questionCodeSnapshots, setQuestionCodeSnapshots] = useState<Record<string, CodeSnapshot>>({});
  const [examStartTime, setExamStartTime] = useState<string | null>(null);
  const [firstQuestionTime, setFirstQuestionTime] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<string>(new Date().toISOString());
  
  // --- Candidate ID State ---
  const [candidateId, setCandidateId] = useState<string>("Verifying..."); 
  
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

  // --- Generate Candidate ID on Mount ---
  useEffect(() => {
    const fetchUserAndGenerateID = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const id = user.id.toUpperCase().replace(/-/g, '');
            const shortId = `CAND-${id.substring(0, 4)}-${id.substring(id.length - 4)}`;
            setCandidateId(shortId);
        } else {
            setCandidateId("GUEST-SESSION");
        }
    };
    fetchUserAndGenerateID();
  }, []);

  // --- Fetch Data ---
  const { data: assignments = [] } = useQuery({
    queryKey: ['exam_assignments', iitmSubjectId, examType, setName, mode],
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from(activeTables.assignments).select('*').order('title', { ascending: true });
      
      const currentExamType = decodeURIComponent(examType || '');

      if (isProctored && setName) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId)
                     .eq('exam_type', currentExamType)
                     .eq('set_name', setName);
      } else if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (examType) query = query.eq('exam_type', currentExamType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // --- Fetch subject name for metadata ---
  const { data: subjectData } = useQuery({
    queryKey: ['subject_name', iitmSubjectId],
    queryFn: async () => {
      if (!iitmSubjectId) return null;
      const { data } = await supabase.from('iitm_subjects').select('name').eq('id', iitmSubjectId).single();
      return data;
    },
    enabled: !!iitmSubjectId
  });

  // --- Initialize Timer from Fetched Data ---
  useEffect(() => {
    if (assignments.length > 0 && timeRemaining === null) {
      const totalMinutes = assignments.reduce((acc: number, curr: any) => acc + (curr.expected_time || 20), 0);
      const totalSeconds = totalMinutes * 60;
      
      setTotalDuration(totalSeconds);
      setTimeRemaining(totalSeconds);
    }
  }, [assignments, timeRemaining]);

  useEffect(() => {
    currentQuestionRef.current = selectedAssignmentId;
    // Track first question interaction
    if (selectedAssignmentId && !firstQuestionTime && isExamStarted) {
      setFirstQuestionTime(new Date().toISOString());
    }
    // Update last activity time
    if (selectedAssignmentId && isExamStarted) {
      setLastActivityTime(new Date().toISOString());
    }
  }, [selectedAssignmentId, isExamStarted, firstQuestionTime]);

  // --- Capture Browser Info ---
  const captureBrowserInfo = (): BrowserInfo => {
    return {
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      window_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      is_mobile: /Mobi|Android/i.test(navigator.userAgent),
      color_depth: window.screen.colorDepth,
      device_memory: (navigator as any).deviceMemory || null,
      hardware_concurrency: navigator.hardwareConcurrency || 0,
      online: navigator.onLine
    };
  };

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
      if (window.getScreenDetails) { 
        const details = await (window as any).getScreenDetails(); 
        if (details.screens.length > 1) { 
          toast({ title: "External Monitor Detected", description: "Please disconnect HDMI/Secondary displays.", variant: "destructive" }); 
          return false; 
        } 
      } else if ((window.screen as any).isExtended) { 
        toast({ title: "Extended Display Detected", description: "Please use a single screen only.", variant: "destructive" }); 
        return false; 
      }
    } catch (e) {}
    return true;
  };

  const enterFullScreen = async () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) { await elem.requestFullscreen(); return true; }
    return false;
  };

  // --- ENHANCED VIOLATION HANDLER with detailed logging ---
  const handleViolation = async (type: string, message: string) => {
    if (!isExamStarted || isSubmitting) return;
    setIsContentObscured(true);
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    
    // Create detailed violation entry
    const violationEntry: ViolationEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      message: message,
      violation_number: newCount,
      current_question_id: currentQuestionRef.current,
      time_elapsed_seconds: totalDuration - (timeRemaining || 0)
    };
    
    // Update violation logs state
    const updatedLogs = [...violationLogs, violationEntry];
    setViolationLogs(updatedLogs);
    setLastActivityTime(new Date().toISOString());
    
    // Log violation to session table immediately with full history
    if (sessionId) { 
      // @ts-ignore
      supabase.from(SESSION_TABLE).update({ 
        violation_count: newCount,
        violation_logs: updatedLogs
      }).eq('id', sessionId).then(); 
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
  }, [isExamStarted, isSubmitting, violationCount, violationLogs]);

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
        
        if (currentQuestionRef.current) { 
          const qId = currentQuestionRef.current; 
          setQuestionMetrics(prev => ({ ...prev, [qId]: { ...prev[qId], attempts: prev[qId]?.attempts || 0, isCorrect: prev[qId]?.isCorrect || false, score: prev[qId]?.score || 0, timeSpent: (prev[qId]?.timeSpent || 0) + 1 } })); 
        } 
      }, 1000); 
    } else if (timeRemaining === 0 && isExamStarted && !isSubmitting) {
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
      
      // Capture browser info at exam start
      const capturedBrowserInfo = captureBrowserInfo();
      setBrowserInfo(capturedBrowserInfo);
      
      // Set initial environment flags
      const initialEnvFlags: EnvironmentFlags = {
        camera_enabled: true,
        mic_enabled: true,
        fullscreen_maintained: true,
        single_screen: true,
        webcam_active_at_end: true,
        mic_active_at_end: true
      };
      setEnvironmentFlags(initialEnvFlags);
      
      const startTime = new Date().toISOString();
      setExamStartTime(startTime);
      
      const sessionData: any = { 
        user_id: user.id, 
        status: 'in_progress', 
        start_time: startTime 
      };
      if (iitmSubjectId) { 
        sessionData.subject_id = iitmSubjectId; 
        sessionData.exam_type = decodeURIComponent(examType || ''); 
        sessionData.set_name = setName; 
      }
      
      // @ts-ignore
      const { data: session, error: sessionError } = await supabase.from(SESSION_TABLE).insert(sessionData).select().single();
      
      if (sessionError) {
        console.error("Failed to create exam session:", sessionError);
        toast({ 
          title: "Session Error", 
          description: "Could not initialize exam session. Please try again.", 
          variant: "destructive" 
        });
        return;
      }
      
      if (session) setSessionId((session as any).id);
      
      setIsExamStarted(true);
      if (assignments.length > 0) {
        setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('q', (assignments[0] as any).id); return p; });
      } else {
        toast({ title: "No Questions", description: "This set contains no questions.", variant: "destructive" });
      }
    } catch (err) { 
      toast({ title: "Error", description: "Failed to start session.", variant: "destructive" }); 
    }
  };

  const handleQuestionAttempt = (qId: string, isCorrect: boolean, score: number) => { 
    setQuestionMetrics(prev => ({ 
      ...prev, 
      [qId]: { 
        ...prev[qId], 
        attempts: (prev[qId]?.attempts || 0) + 1, 
        isCorrect: isCorrect || prev[qId]?.isCorrect || false, 
        score: Math.max(score, prev[qId]?.score || 0)
      } 
    }));
    setLastActivityTime(new Date().toISOString());
  };

  // --- NEW: Handler for code submission from AssignmentView ---
  const handleCodeSubmit = (questionId: string, code: string, language: string, testResults: any) => {
    setQuestionCodeSnapshots(prev => ({
      ...prev,
      [questionId]: {
        code,
        language,
        testResults,
        submitted_at: new Date().toISOString()
      }
    }));
    setLastActivityTime(new Date().toISOString());
  };

  // --- CORE SUBMISSION LOGIC ---
  const finishExam = async (statusReason: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true); 
    setFinishDialogOpen(false);
    
    const examEndTime = new Date().toISOString();
    
    // 1. Stop Media / Cleanup
    const webcamActiveAtEnd = mediaStream?.getVideoTracks().some(t => t.readyState === 'live') || false;
    const micActiveAtEnd = mediaStream?.getAudioTracks().some(t => t.readyState === 'live') || false;
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // 2. Calculate Final Metrics
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user profile for full name
    let userFullName: string | null = null;
    let userEmail: string | null = user?.email || null;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      userFullName = profile?.full_name || null;
    }
    
    const totalMaxScore = assignments.reduce((acc: number, curr: any) => acc + (curr.max_score || 0), 0);
    const spentTime = timeRemaining !== null ? (totalDuration - timeRemaining) : 0;
    
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let obtainedScore = 0;
    let attemptedCount = 0;
    let totalAttempts = 0;

    // Build the detailed JSON for the new backend table with code snapshots
    const submissionDetails = assignments.map((a: any) => {
      const metrics = questionMetrics[a.id] || { attempts: 0, isCorrect: false, score: 0, timeSpent: 0 };
      const codeSnapshot = questionCodeSnapshots[a.id] || null;
      
      totalAttempts += metrics.attempts;
      
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
        question_description: a.description?.substring(0, 500), // First 500 chars
        max_score: a.max_score,
        status: metrics.attempts === 0 ? 'Skipped' : (metrics.isCorrect ? 'Correct' : 'Incorrect'),
        score_obtained: metrics.score,
        attempts: metrics.attempts,
        time_spent_seconds: metrics.timeSpent,
        final_code: codeSnapshot?.code || null,
        language: codeSnapshot?.language || 'python',
        test_results: codeSnapshot?.testResults || null,
        code_submitted_at: codeSnapshot?.submitted_at || null
      };
    });

    const isTerminated = statusReason.includes("TERMINATED");
    const finalStatus = isTerminated ? 'terminated' : (statusReason === "TIME_UP" ? 'time_up' : 'completed');
    
    // Update final environment flags
    const finalEnvFlags: EnvironmentFlags = {
      camera_enabled: environmentFlags?.camera_enabled ?? true,
      mic_enabled: environmentFlags?.mic_enabled ?? true,
      fullscreen_maintained: !statusReason.includes('Fullscreen'),
      single_screen: environmentFlags?.single_screen ?? true,
      webcam_active_at_end: webcamActiveAtEnd,
      mic_active_at_end: micActiveAtEnd
    };

    // 3. Save to Backend (New Table & Session Table)
    let isError = isTerminated; 
    
    if (user) {
      try {
        const promises = [];

        // A. Update the Session Table
        if (sessionId) {
          // @ts-ignore
          const sessionUpdate = supabase.from(SESSION_TABLE).update({ 
            status: finalStatus, 
            end_time: examEndTime, 
            duration_seconds: spentTime, 
            questions_attempted: attemptedCount, 
            questions_correct: correctCount, 
            total_score: obtainedScore,
            violation_logs: violationLogs
          }).eq('id', sessionId);
          promises.push(sessionUpdate);
        }

        // B. Upsert into the detailed submission table with ALL data
        const safeExamType = examType ? decodeURIComponent(examType) : 'default_type';
        const safeSetName = setName || 'default_set';
        const safeSubjectId = iitmSubjectId || 'default_subject';
        const compositeExamId = `${safeExamType}-${safeSetName}-${safeSubjectId}`;

        const detailedSubmission = {
          user_id: user.id,
          exam_id: compositeExamId,
          
          // User identity
          candidate_id: candidateId,
          user_email: userEmail,
          user_full_name: userFullName,
          
          // Link to session
          session_id: sessionId,
          
          // Scores
          marks_obtained: obtainedScore,
          total_marks: totalMaxScore,
          correct_questions_count: correctCount,
          incorrect_questions_count: incorrectCount,
          skipped_questions_count: skippedCount,
          
          // Detailed question data with code
          submission_data: submissionDetails,
          questions_data: submissionDetails, // Also stored in dedicated column
          
          // Status
          status: finalStatus,
          termination_reason: statusReason,
          
          // Browser & Environment
          browser_info: browserInfo,
          environment_flags: finalEnvFlags,
          
          // Proctoring events (full violation history)
          proctoring_events: violationLogs,
          
          // Timing data
          exam_start_time: examStartTime,
          exam_end_time: examEndTime,
          total_duration_seconds: spentTime,
          first_question_time: firstQuestionTime,
          last_activity_time: lastActivityTime,
          
          // Attempt metrics
          total_attempts: totalAttempts,
          avg_time_per_question: attemptedCount > 0 ? Math.round(spentTime / attemptedCount) : 0,
          
          // Exam metadata
          subject_name: subjectData?.name || null,
          set_name: safeSetName,
          exam_type: safeExamType,
          
          updated_at: examEndTime
        };

        console.log("Saving comprehensive exam data:", detailedSubmission);

        const submissionUpdate = supabase
          .from('iitm_exam_submission')
          .upsert(detailedSubmission as any, { onConflict: 'user_id, exam_id' })
          .select(); 

        promises.push(submissionUpdate);

        // C. Wait for all and CHECK ERRORS
        const results = await Promise.all(promises);
        
        const dbErrors = results.filter(r => r.error);
        if (dbErrors.length > 0) {
          console.error("Database Save Errors:", dbErrors);
          throw new Error("Failed to sync exam data to server.");
        }
        
        toast({
          title: "Submission Saved",
          description: "Your exam results have been recorded."
        });

      } catch (error: any) {
        console.error("Exam save execution failed:", error);
        isError = true;
        toast({ 
          variant: "destructive", 
          title: "Data Sync Failed", 
          description: error.message || "Your local result is ready, but it was not saved to the server." 
        });
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
      isError: isError, 
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
          {/* --- FIXED HEADER --- */}
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

            {/* 2. RIGHT: Controls (Timer + A/V + End) */}
            <div className="flex items-center gap-4">
              
              {/* Timer Pill */}
              <div className="bg-black border border-[#333] rounded px-3 py-1.5 flex items-center gap-3 shadow-sm h-[38px]">
                <Timer className="w-3.5 h-3.5 text-[#666]" />
                <span className={cn(
                  "font-mono text-sm tracking-widest min-w-[60px]", 
                  (timeRemaining || 0) < 300 ? "text-red-500 animate-pulse" : "text-[#E0E0E0]"
                )}>
                  {formatTime(timeRemaining || 0)}
                </span>
                
                <div className="w-[1px] h-3 bg-[#444]" />
                
                <div className="flex gap-1">
                  {[...Array(MAX_VIOLATIONS)].map((_, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      i < violationCount 
                        ? "bg-[#D32F2F] shadow-[0_0_6px_#D32F2F]" 
                        : "bg-[#333]"
                    )} />
                  ))}
                </div>
              </div>

              {/* A/V Security Box */}
              <div className="flex items-center bg-black border border-[#333] p-1 rounded gap-2 h-[38px] select-none">
                <div className="w-[45px] h-[30px] bg-[#222] relative overflow-hidden rounded-[2px]">
                  <video ref={setVideoNode} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-80" />
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#D32F2F] rounded-full animate-pulse shadow-[0_0_4px_red]" />
                </div>
                
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
                    candidateId={candidateId}
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
                        onCodeSubmit={(code, language, testResults) => handleCodeSubmit(selectedAssignmentId, code, language, testResults)}
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
