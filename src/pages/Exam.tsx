import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Lock, LogOut, FileWarning, CheckCircle2, Timer } from 'lucide-react';
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

  // Constants
  const MAX_VIOLATIONS = 3;

  // Fetch Assignments (Reusing logic for content)
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

  // --- Proctoring Logic ---

  // 1. Full Screen Enforcement
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

  // 2. Violation Handler
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
      
      // Update database with violation
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

  // 3. Event Listeners (Tab change, Copy/Paste, Fullscreen exit)
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch", "Tab switching is strictly prohibited.");
      }
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !isSubmitting) {
        handleViolation("fullscreen_exit", "You cannot exit full screen mode.");
        // Try to force it back? Usually requires user gesture.
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
    window.addEventListener("copy", preventCopyPaste);
    window.addEventListener("paste", preventCopyPaste);
    window.addEventListener("cut", preventCopyPaste);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
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
  const startExam = async () => {
    try {
      console.log('Starting exam...');
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User data:', user, 'User error:', userError);
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to start the exam.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      console.log('Profile:', profile, 'Profile error:', profileError);

      // Create exam session
      const sessionData = {
        user_id: user.id,
        user_email: user.email || '',
        full_name: profile?.full_name || '',
        total_questions: assignments.length,
        status: 'in_progress',
        start_time: new Date().toISOString(),
      };
      
      console.log('Creating session with data:', sessionData);

      const { data: session, error } = await supabase
        .from('exam_sessions')
        .insert(sessionData)
        .select()
        .single();

      console.log('Session created:', session, 'Error:', error);

      if (error) {
        console.error('Error creating exam session:', error);
        toast({
          title: "Error",
          description: `Failed to start exam session: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!session) {
        console.error('No session returned');
        toast({
          title: "Error",
          description: "Failed to create exam session",
          variant: "destructive",
        });
        return;
      }

      console.log('Session ID set to:', session.id);
      setSessionId(session.id);
      enterFullScreen();
      setIsExamStarted(true);
      
      toast({
        title: "Exam Started",
        description: "Your exam session has been created successfully.",
      });
      
      if (assignments.length > 0 && !selectedAssignmentId) {
        setSearchParams({ q: assignments[0].id });
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: "Error",
        description: `Failed to start exam: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const submitExam = async (reason?: string) => {
    console.log('Submitting exam with reason:', reason, 'Session ID:', sessionId);
    setIsSubmitting(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    if (sessionId) {
      // Calculate metrics
      const questionsAttempted = Object.keys(questionMetrics).length;
      const questionsCorrect = Object.values(questionMetrics).filter(m => m.isCorrect).length;
      const totalScore = Object.values(questionMetrics).reduce((sum, m) => sum + m.score, 0);
      const totalAttempts = Object.values(questionMetrics).reduce((sum, m) => sum + m.attempts, 0);
      const avgAttemptsPerCorrect = questionsCorrect > 0 ? totalAttempts / questionsCorrect : 0;

      const finalData = {
        status: reason ? 'terminated' : 'completed',
        end_time: new Date().toISOString(),
        duration_seconds: elapsedTime,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        total_score: totalScore,
        total_attempts: totalAttempts,
        avg_attempts_per_correct: avgAttemptsPerCorrect,
      };
      
      console.log('Final exam data:', finalData);

      // Update exam session
      const { data, error } = await supabase
        .from('exam_sessions')
        .update(finalData)
        .eq('id', sessionId)
        .select();
        
      console.log('Exam submission result:', { data, error });
      
      if (error) {
        console.error('Error submitting exam:', error);
        toast({
          title: "Error",
          description: `Failed to submit exam: ${error.message}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    } else {
      console.warn('No session ID available for submission');
    }
    
    toast({
      title: "Exam Submitted",
      description: reason || "Your exam has been submitted successfully.",
      variant: reason ? "destructive" : "default",
    });

    // Short delay before redirect
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams({ q: id });
    if (questionStatuses[id] !== 'attempted') {
      setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
    }
  };

  const handleQuestionAttempt = (questionId: string, isCorrect: boolean, score: number) => {
    console.log('Question attempt:', { questionId, isCorrect, score, sessionId });
    
    setQuestionMetrics(prev => {
      const updated = {
        ...prev,
        [questionId]: {
          attempts: (prev[questionId]?.attempts || 0) + 1,
          isCorrect: isCorrect || prev[questionId]?.isCorrect || false,
          score: Math.max(score, prev[questionId]?.score || 0)
        }
      };
      
      console.log('Updated question metrics:', updated);
      
      // Update session in database immediately with the updated state
      if (sessionId) {
        const questionsAttempted = Object.keys(updated).length;
        const questionsCorrect = Object.values(updated).filter(m => m.isCorrect).length;
        const totalScore = Object.values(updated).reduce((sum, m) => sum + m.score, 0);
        const totalAttempts = Object.values(updated).reduce((sum, m) => sum + m.attempts, 0);
        
        const updateData = {
          questions_attempted: questionsAttempted,
          questions_correct: questionsCorrect,
          total_score: totalScore,
          total_attempts: totalAttempts,
        };
        
        console.log('Updating session with data:', updateData);

        supabase
          .from('exam_sessions')
          .update(updateData)
          .eq('id', sessionId)
          .then(({ data, error }) => {
            if (error) {
              console.error('Error updating session metrics:', error);
            } else {
              console.log('Session updated successfully:', data);
            }
          });
      } else {
        console.warn('No session ID available for update');
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
      <header className="h-16 shrink-0 border-b border-red-500/20 bg-[#0c0c0e] flex items-center justify-between px-4 md:px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Lock className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-bold tracking-tight text-red-500">Proctored Exam Portal</span>
        </div>

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
            onClick={() => submitExam("User initiated submission")}
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
                preLoadedAssignments={assignments as any} // Reusing type from Practice
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

      {/* Instruction Modal (Entry Gate) */}
      <Dialog open={!isExamStarted} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0c0c0e] border-red-500/20 text-white sm:max-w-lg [&>button]:hidden">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-2xl text-center">Exam Environment Rules</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              You are about to enter a secure proctored environment. Please review the following strict regulations carefully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 bg-red-950/10 p-6 rounded-lg border border-red-500/10">
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">Strict Full Screen Enforcement</strong>
                Leaving full screen mode will record a violation.
              </div>
            </div>
            <div className="flex gap-3 items-start text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <strong className="text-red-400 block mb-1">No Tab Switching</strong>
                Moving to another tab or window is strictly prohibited.
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
                <strong>3 Violations = Auto Submit</strong>
                <p className="text-orange-400/70 text-xs mt-1">
                  Violating any of these rules 3 times will immediately terminate your exam session.
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
              onClick={startExam}
            >
              I Agree & Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exam;
