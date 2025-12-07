import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, LogOut, LayoutGrid, Home, Infinity as InfinityIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const iitmSubjectId = searchParams.get('iitm_subject');
  const categoryParam = searchParams.get('category');
  const limitParam = searchParams.get('limit');
  const selectedAssignmentId = searchParams.get('q');
  
  // Timer Params
  const timerParam = parseInt(searchParams.get('timer') || '0');
  const hasTimeLimit = timerParam > 0;
  const timeLimitSeconds = timerParam * 60;

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();
  
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  // --- QUERY ---
  const { data: assignments = [] } = useQuery({
    // Added selectedAssignmentId to queryKey to trigger refetch if URL changes
    queryKey: [activeTables.assignments, iitmSubjectId, categoryParam, limitParam, selectedAssignmentId], 
    queryFn: async () => {
      // @ts-ignore
      // UPDATED: Added 'is_unlocked' to the select query
      let query = supabase.from(activeTables.assignments).select('id, title, category, expected_time, is_unlocked');
      
      // STRICT FILTERING: 
      // If a specific question ID is provided in the URL ('q'), 
      // we ONLY fetch that single question. We ignore other category filters.
      if (selectedAssignmentId) {
        // @ts-ignore
        query = query.eq('id', selectedAssignmentId);
      } else {
        // Only apply broad filters if no specific question is selected
        if (iitmSubjectId) {
          // @ts-ignore
          query = query.eq('subject_id', iitmSubjectId);
          if (categoryParam) {
            // @ts-ignore
            query = query.eq('category', categoryParam);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let result = data || [];
      return result.sort((a, b) => a.title.localeCompare(b.title));
    },
  });

  // Ensure 'q' param is set initially if list is loaded (fallback logic)
  useEffect(() => {
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        // @ts-ignore
        // Only auto-select if it's unlocked
        const firstUnlocked = assignments.find((a: any) => a.is_unlocked !== false) || assignments[0];
        if (firstUnlocked) {
           p.set('q', firstUnlocked.id);
        }
        return p;
      });
    }
  }, [assignments, selectedAssignmentId, setSearchParams]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    // Timer runs continuously for the session
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    if (!hasTimeLimit) {
      // Free Mode: Count Up
      const m = Math.floor(elapsedTime / 60);
      const s = elapsedTime % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Timed Mode logic
    const remaining = timeLimitSeconds - elapsedTime;
    
    if (remaining >= 0) {
      // Normal Countdown
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      // Overtime: Count Up (Red)
      const overtime = Math.abs(remaining);
      const m = Math.floor(overtime / 60);
      const s = overtime % 60;
      return `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
  };

  const isOvertime = hasTimeLimit && elapsedTime > timeLimitSeconds;

  // --- HANDLERS ---
  const handleQuestionSelect = (id: string) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('q', id);
        return newParams;
    });
    if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
      setQuestionStatuses(prev => ({ ...prev, [id]: 'visited' }));
    }
  };

  const handleExitEnvironment = () => setIsExitDialogOpen(true);
  const confirmExit = () => { sessionStorage.clear(); navigate('/'); };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden selection:bg-primary/20">
      <header className="border-b border-white/10 bg-[#09090b] px-4 py-3 flex items-center justify-between z-50 shadow-md shrink-0 h-16">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10"><Home className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-primary hidden sm:block">
              {/* Show title of the single assignment if strictly filtered, otherwise generic */}
              {assignments.length === 1 ? 'Practice Session' : (categoryParam ? `${decodeURIComponent(categoryParam)} Practice` : 'Practice Session')}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* TIMER DISPLAY */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-all duration-500",
            isOvertime 
              ? "bg-red-950/30 border-red-500/50 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
              : "bg-black/40 border-white/10 text-muted-foreground"
          )}>
            {hasTimeLimit ? <Timer className="w-4 h-4" /> : <InfinityIcon className="w-4 h-4" />}
            <span>{formatTimer()}</span>
            {isOvertime && <span className="text-[10px] uppercase font-sans tracking-wide ml-1">Overtime</span>}
          </div>

          <Button variant="outline" size="sm" onClick={handleExitEnvironment} className="gap-2 border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10"><LogOut className="w-4 h-4" /> Exit</Button>
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
                  onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                  currentStatus={questionStatuses[selectedAssignmentId]}
                  tables={activeTables} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground"><LayoutGrid className="w-10 h-10 mb-4 opacity-20" /><p>Select a question to begin</p></div>
              )}
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
          <DialogHeader><DialogTitle>End Practice Session?</DialogTitle><DialogDescription>Your progress for this session will be cleared.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" onClick={() => setIsExitDialogOpen(false)}>Cancel</Button><Button onClick={confirmExit} variant="destructive">End Session</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
