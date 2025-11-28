import { useState, useEffect } from 'react';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Timer, Power, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type QuestionStatus = 'not-visited' | 'visited' | 'attempted' | 'review';

const EXAM_DURATION = 120 * 60; // 2 hours in seconds

const Index = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
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
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 py-3 flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-primary">
              OPPE Practice Console
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <span>Course: Python</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Session: 2025-Q1</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg font-bold transition-colors ${
            timeLeft < 600 ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-black/40 border-white/10 text-white'
          }`}>
            <Timer className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleEndExam}
            className="gap-2 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all"
          >
            <Power className="w-4 h-4" />
            End Exam
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-2 h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-xl border border-white/10 overflow-hidden shadow-2xl bg-black/60 backdrop-blur-sm">
          
          {/* Question Palette Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card/30 backdrop-blur-md flex flex-col">
            <AssignmentSidebar
              selectedId={selectedAssignment}
              onSelect={(id) => {
                setSelectedAssignment(id);
                // Mark as visited if not already attempted or review
                if (questionStatuses[id] !== 'attempted' && questionStatuses[id] !== 'review') {
                  handleStatusUpdate(id, 'visited');
                }
              }}
              questionStatuses={questionStatuses}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

          {/* Editor & Problem Area */}
          <ResizablePanel defaultSize={80} className="bg-background/40">
            {selectedAssignment ? (
              <AssignmentView 
                assignmentId={selectedAssignment} 
                onStatusUpdate={(status) => handleStatusUpdate(selectedAssignment, status)}
                currentStatus={questionStatuses[selectedAssignment]}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 text-center space-y-6 p-10 glass-panel rounded-3xl border border-white/10 max-w-lg">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                    <LayoutGrid className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                      Exam Environment Ready
                    </h2>
                    <p className="text-muted-foreground">
                      Select a question from the palette on the left to begin solving. 
                      Keep an eye on the timer.
                    </p>
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
