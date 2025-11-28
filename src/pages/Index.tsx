import { useState } from 'react';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const Index = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Python Compiler</h1>
          <div className="text-sm text-muted-foreground">IIT Madras</div>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <AssignmentSidebar
            selectedId={selectedAssignment}
            onSelect={setSelectedAssignment}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          {selectedAssignment ? (
            <AssignmentView assignmentId={selectedAssignment} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                  Select an assignment
                </h2>
                <p className="text-muted-foreground">
                  Choose an assignment from the sidebar to begin coding
                </p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
