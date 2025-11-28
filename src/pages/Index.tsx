import { useState } from 'react';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Header with glow effect */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            PyCoder Playground
          </h1>
        </div>
        <div className="text-xs font-mono text-muted-foreground border border-white/10 px-3 py-1 rounded-full bg-white/5">
          IIT Madras
        </div>
      </header>

      <div className="flex-1 p-4 h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl bg-black/40">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card/50 backdrop-blur-sm">
            <AssignmentSidebar
              selectedId={selectedAssignment}
              onSelect={setSelectedAssignment}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-white/5 hover:bg-primary/50 transition-colors w-1" />

          <ResizablePanel defaultSize={80} className="bg-background/50">
            {selectedAssignment ? (
              <AssignmentView assignmentId={selectedAssignment} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background glow orb */}
                <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative z-10 text-center space-y-4 p-8 glass-panel rounded-3xl border border-white/10 max-w-md">
                  <h2 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">
                    Ready to Code?
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Select an assignment from the sidebar to initialize your environment.
                  </p>
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
