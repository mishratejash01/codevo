import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, Power, LayoutGrid, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

const EXAM_DURATION = 120 * 60; // 2 hours in seconds

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedAssignment = searchParams.get('q');

  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStatusUpdate = (id: string, status: QuestionStatus) => {
    setQuestionStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleQuestionSelect = (id: string) => {
    setSearchParams({ q: id });
    if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
      handleStatusUpdate(id, 'visited');
    }
  };

  const handleEndExam = () => {
    // CRITICAL: Clear all saved code drafts when ending the exam
    sessionStorage.clear();
    
    toast({
      title: "Exam Submitted",
      description: "Your responses have been recorded. Storage cleared.",
      duration: 5000,
    });
    
    // Optional: Redirect to home or result page
    // navigate('/');
  };

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
              OPPE Practice Console
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-lg font-bold ${
            timeLeft < 600 ? 'bg-red-950/30 border-red-500/50 text-red-500 animate-pulse' : 'bg-black/40 border-white/10 text-white'
          }`}>
            <Timer className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleEndExam}
            className="gap-2 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">End Exam</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
            <AssignmentSidebar
              selectedId={selectedAssignment}
              onSelect={handleQuestionSelect}
              questionStatuses={questionStatuses}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

          <ResizablePanel defaultSize={80} className="bg-[#09090b] relative">
            <ErrorBoundary>
              {selectedAssignment ? (
                <AssignmentView 
                  key={selectedAssignment}
                  assignmentId={selectedAssignment} 
                  onStatusUpdate={(status) => handleStatusUpdate(selectedAssignment, status)}
                  currentStatus={questionStatuses[selectedAssignment]}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <LayoutGrid className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to Code?</h2>
                  <p className="text-muted-foreground max-w-md">
                    Select a question from the palette on the left to begin your practice session.
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Practice;
