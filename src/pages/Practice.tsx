import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, LogOut, LayoutGrid, Home, Clock, CheckCircle2, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

// Table Configurations
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

interface AssignmentSummary {
  id: string;
  title: string;
  category: string | null;
  expected_time?: number; 
}

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Params
  const iitmSubjectId = searchParams.get('iitm_subject');
  const examType = searchParams.get('type');
  const selectedAssignmentId = searchParams.get('q');
  
  // Determine tables
  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;

  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();

  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState({ totalQuestions: 0, attempted: 0, passedCases: 0, totalCases: 0 });
  
  const previousQuestionRef = useRef<string | null>(null);

  // Fetch Assignments with dynamic table filtering
  const { data: assignments = [] } = useQuery({
    queryKey: [activeTables.assignments, iitmSubjectId, examType], 
    queryFn: async () => {
      let query = supabase
        .from(activeTables.assignments)
        .select('id, title, category, expected_time') // Select only needed fields
        .order('title', { ascending: true });
      
      // Strict IITM Filtering
      if (iitmSubjectId) {
        // @ts-ignore - dynamic table types
        query = query.eq('subject_id', iitmSubjectId);
        
        if (examType) {
           // @ts-ignore
           query = query.eq('exam_type', decodeURIComponent(examType));
        }
      } else {
        // Optional: Standard mode sorting/filtering
        // @ts-ignore
        query = query.order('category', { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AssignmentSummary[];
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedAssignmentId) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (previousQuestionRef.current && previousQuestionRef.current !== selectedAssignmentId) {
      const prevAssignment = assignments.find(a => a.id === previousQuestionRef.current);
      
      if (prevAssignment) {
        const expectedSeconds = (prevAssignment.expected_time || 15) * 60;
        
        if (elapsedTime > expectedSeconds) {
          toast({
            title: "Speed Check ⏱️",
            description: `You spent ${Math.floor(elapsedTime / 60)} mins on the previous question. Try to speed up! (Expected: ${prevAssignment.expected_time} mins)`,
            variant: "default",
            className: "bg-orange-500/10 border-orange-500/50 text-orange-500",
          });
        }
      }
      setElapsedTime(0);
    }
    
    previousQuestionRef.current = selectedAssignmentId;
  }, [selectedAssignmentId, assignments, elapsedTime, toast]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStatusUpdate = (id: string, status: QuestionStatus) => {
    setQuestionStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('q', id);
        return newParams;
    });
    
    if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
      handleStatusUpdate(id, 'visited');
    }
  };

  const handleExitEnvironment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: submissions } = await supabase
        .from(activeTables.submissions)
        .select('assignment_id, public_tests_passed, private_tests_passed, public_tests_total, private_tests_total')
        .eq('user_id', user.id);

      let passed = 0;
      let total = 0;
      const uniqueAttempted = new Set();

      if (submissions) {
        submissions.forEach((sub: any) => {
          uniqueAttempted.add(sub.assignment_id);
          passed += (sub.public_tests_passed || 0) + (sub.private_tests_passed || 0);
          total += (sub.public_tests_total || 0) + (sub.private_tests_total || 0);
        });
      }

      setSessionStats({
        totalQuestions: assignments.length,
        attempted: uniqueAttempted.size,
        passedCases: passed,
        totalCases: total
      });
    }
    
    setIsExitDialogOpen(true);
  };

  const confirmExit = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const currentAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const expectedTimeMin = currentAssignment?.expected_time || 15;
  const isOverTime = elapsedTime > (expectedTimeMin * 60);

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden selection:bg-primary/20">
      <header className="border-b border-white/10 bg-[#09090b] px-4 py-3 flex items-center justify-between z-50 shadow-md shrink-0 h-16">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-white hover:bg-white/10"
            title="Go to Home"
          >
            <Home className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-primary hidden sm:block">
              {iitmSubjectId ? decodeURIComponent(searchParams.get('name') || '') + ' - ' + decodeURIComponent(examType || '') : 'Learning Environment'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedAssignmentId ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-colors duration-500 ${
              isOverTime ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-black/40 border-white/10 text-muted-foreground'
            }`}>
              <Timer className={`w-4 h-4 ${isOverTime ? 'animate-pulse' : ''}`} />
              <span>{formatTime(elapsedTime)}</span>
              <span className="text-muted-foreground/50 font-normal ml-1 text-xs">
                / {expectedTimeMin}m expected
              </span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Select a question</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExitEnvironment}
            className="gap-2 border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Environment</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
            <AssignmentSidebar
              selectedId={selectedAssignmentId}
              onSelect={handleQuestionSelect}
              questionStatuses={questionStatuses}
              preLoadedAssignments={assignments as any} 
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

          <ResizablePanel defaultSize={80} className="bg-[#09090b] relative">
            <ErrorBoundary>
              {selectedAssignmentId ? (
                <AssignmentView 
                  key={selectedAssignmentId}
                  assignmentId={selectedAssignmentId} 
                  onStatusUpdate={(status) => handleStatusUpdate(selectedAssignmentId, status)}
                  currentStatus={questionStatuses[selectedAssignmentId]}
                  // Pass the active tables configuration so AssignmentView knows which table to fetch from
                  tables={activeTables} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 animate-pulse">
                    <LayoutGrid className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to Learn?</h2>
                  <p className="text-muted-foreground max-w-md">
                    Select a question from the palette on the left to start the timer and begin your practice.
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Session Summary
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Great practice session! Here is what you accomplished:
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-2">
              <ListTodo className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold">{sessionStats.attempted} <span className="text-sm text-muted-foreground font-normal">/ {sessionStats.totalQuestions}</span></span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Questions Attempted</span>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-green-500">{sessionStats.passedCases}</span>
                <span className="text-sm text-muted-foreground">passed</span>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Test Cases</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)}>
              Keep Practicing
            </Button>
            <Button onClick={confirmExit} variant="destructive">
              Exit Environment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
