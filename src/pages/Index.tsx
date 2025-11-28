import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, Power, LayoutGrid, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

const EXAM_DURATION = 120 * 60; // 2 hours in seconds

const Index = () => {
  // Replace local state with URL search params for navigation history
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAssignment = searchParams.get('q');

  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const { toast } = useToast();

  // Timer Logic
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

  // Format time as HH:MM:SS
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
    // Update URL without reloading page
    setSearchParams({ q: id });
    
    // Mark as visited if not already interacted with
    if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
      handleStatusUpdate(id, 'visited');
    }
  };

  const handleEndExam = () => {
    toast({
      title: "Exam Submitted",
      description: "Your responses have been recorded.",
      duration: 5000,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Exam Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl px-4 md:px-6 py-3 flex items-center justify-between z-50 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-primary/10 border border-primary/20 transition-all hover:bg-primary/20">
            <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-primary">
              OPPE Practice Console
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span>Course: Python</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Session: 2025-Q1</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border font-mono text-sm md:text-lg font-bold transition-colors ${
            timeLeft < 600 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-black/40 border-white/10 text-white'
          }`}>
            <Timer className="w-4 h-4 md:w-5 md:h-5" />
            {formatTime(timeLeft)}
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleEndExam}
            className="gap-2 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all text-xs md:text-sm"
          >
            <Power className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline">End Exam</span>
            <span className="md:hidden">End</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-2 h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/60 backdrop-blur-sm">
          
          {/* Question Palette Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card/30 backdrop-blur-md flex flex-col border-r border-white/10">
            <AssignmentSidebar
              selectedId={selectedAssignment}
              onSelect={handleQuestionSelect}
              questionStatuses={questionStatuses}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

          {/* Editor & Problem Area */}
          <ResizablePanel defaultSize={80} className="bg-background/40 relative">
            {selectedAssignment ? (
              <AssignmentView 
                key={selectedAssignment} // Force re-render on ID change to prevent stale state
                assignmentId={selectedAssignment} 
                onStatusUpdate={(status) => handleStatusUpdate(selectedAssignment, status)}
                currentStatus={questionStatuses[selectedAssignment]}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center relative overflow-hidden p-6">
                <div className="absolute w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 text-center space-y-6 p-10 glass-panel rounded-3xl border border-white/10 max-w-lg shadow-2xl">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-pulse">
                    <LayoutGrid className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                      Exam Environment Ready
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Select a question from the palette on the left to begin solving. 
                    </p>
                    <div className="mt-6 flex gap-2 justify-center text-xs text-muted-foreground/60 font-mono">
                      <span>• Read instructions carefully</span>
                      <span>• Monitor the timer</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
