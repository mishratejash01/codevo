import { useState, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, Eye } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';

interface Assignment {
  id: string;
  title: string;
  category: string | null;
}

interface AssignmentSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  questionStatuses: Record<string, QuestionStatus>;
  preLoadedAssignments?: Assignment[];
}

export const AssignmentSidebar = ({ selectedId, onSelect, questionStatuses, preLoadedAssignments = [] }: AssignmentSidebarProps) => {

  // Group Assignments by Category
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    if (!preLoadedAssignments) return groups;
    
    preLoadedAssignments.forEach(a => {
      const cat = a.category || "General Questions";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [preLoadedAssignments]);

  const [openItem, setOpenItem] = useState<string>("");

  // Effect: When selectedId changes or loads, find its category and open ONLY that category
  useEffect(() => {
    if (selectedId && preLoadedAssignments.length > 0) {
      const assignment = preLoadedAssignments.find(a => a.id === selectedId);
      if (assignment) {
        const category = assignment.category || "General Questions";
        // Check if currently open item is different to avoid redundant updates
        setOpenItem(prev => (prev !== category ? category : prev));
      }
    }
  }, [selectedId, preLoadedAssignments]);

  const getStatusColor = (id: string) => {
    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      case 'attempted': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'review': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'visited': return 'bg-white/10 text-white border-white/20';
      default: return 'bg-transparent text-muted-foreground border-white/10 hover:border-white/30';
    }
  };

  const getStatusIcon = (id: string) => {
    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      case 'attempted': return <CheckCircle2 className="w-3 h-3" />;
      case 'review': return <Clock className="w-3 h-3" />;
      case 'visited': return <Eye className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Legend Area */}
      <div className="p-4 border-b border-white/10 bg-black/20 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Question Palette</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Answered</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Review</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/50" /> Visited</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-white/30" /> Pending</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          <Accordion 
            type="single" 
            collapsible
            value={openItem}
            onValueChange={setOpenItem}
            className="w-full space-y-2"
          >
            {Object.entries(groupedAssignments).map(([category, items]) => (
              <AccordionItem key={category} value={category} className="border border-white/5 rounded-lg bg-white/5 overflow-hidden">
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-white/5 text-sm font-medium text-white/90 data-[state=open]:text-primary">
                  <div className="flex items-center gap-2">
                     <span className="uppercase tracking-wider text-xs opacity-70 font-bold">{category}</span>
                     <span className="bg-black/40 text-[10px] px-1.5 rounded-full text-muted-foreground border border-white/10">{items.length}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-3 bg-black/20">
                  <div className="grid grid-cols-4 gap-2">
                    {items.map((assignment, idx) => (
                      <button
                        key={assignment.id}
                        onClick={() => onSelect(assignment.id)}
                        className={cn(
                          "aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 border transition-all duration-200 relative group",
                          getStatusColor(assignment.id),
                          selectedId === assignment.id && "ring-1 ring-primary ring-offset-1 ring-offset-black bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        )}
                        title={assignment.title}
                      >
                        <span className="text-xs font-bold font-mono">{idx + 1}</span>
                        {getStatusIcon(assignment.id)}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};
