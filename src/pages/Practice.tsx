import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, LogOut, LayoutGrid, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  
  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: [activeTables.assignments, iitmSubjectId, categoryParam, limitParam], 
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from(activeTables.assignments).select('id, title, category, expected_time');
      
      if (iitmSubjectId) {
        // @ts-ignore
        query = query.eq('subject_id', iitmSubjectId);
        if (categoryParam) {
          // @ts-ignore
          query = query.eq('category', categoryParam);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      let result = data || [];
      
      if (limitParam) {
        const limit = parseInt(limitParam);
        // SAFETY: Even if limit > available, slice just returns what exists (available questions)
        // This ensures questions "don't disappear" if requested count is too high
        if (!isNaN(limit) && limit > 0) {
          result = result.sort(() => 0.5 - Math.random()).slice(0, limit);
        }
      } else {
        result = result.sort((a, b) => a.title.localeCompare(b.title));
      }
      
      return result;
    },
  });

  useEffect(() => {
    // If questions exist but none selected, select the first one
    if (assignments.length > 0 && !selectedAssignmentId) {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        // @ts-ignore
        p.set('q', assignments[0].id);
        return p;
      });
    }
  }, [assignments, selectedAssignmentId, setSearchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedAssignmentId) {
      interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [selectedAssignmentId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10">
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-primary hidden sm:block">
              {categoryParam ? `${decodeURIComponent(categoryParam)} Practice` : 'Practice Arena'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold bg-black/40 border-white/10 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleExitEnvironment} className="gap-2 border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Exit
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
                  onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                  currentStatus={questionStatuses[selectedAssignmentId]}
                  tables={activeTables} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <LayoutGrid className="w-10 h-10 mb-4 opacity-20" />
                  <p>Select a question to begin</p>
                </div>
              )}
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Practice Session?</DialogTitle>
            <DialogDescription>Your progress for this session will be cleared.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmExit} variant="destructive">End Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
