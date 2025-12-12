import { useState, useMemo, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Check, LockKeyhole, User, Fingerprint } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  id: string;
  title: string;
  category: string | null;
  is_unlocked?: boolean;
}

interface AssignmentSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  questionStatuses: Record<string, QuestionStatus>;
  preLoadedAssignments?: Assignment[];
  isProctored?: boolean;
  candidateId?: string;
}

export const AssignmentSidebar = ({ 
  selectedId, 
  onSelect, 
  questionStatuses, 
  preLoadedAssignments = [], 
  isProctored = false,
  candidateId = "CAND-8829-X9"
}: AssignmentSidebarProps) => {
  const { toast } = useToast();

  const groupedAssignments = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    if (!preLoadedAssignments) return groups;
    
    preLoadedAssignments.forEach(a => {
      const cat = isProctored ? "Questions" : (a.category || "General");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [preLoadedAssignments, isProctored]);

  // Changed to array to support multiple open items
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    if (selectedId && preLoadedAssignments.length > 0) {
      const assignment = preLoadedAssignments.find(a => a.id === selectedId);
      if (assignment) {
        const category = isProctored ? "Questions" : (assignment.category || "General");
        // Add the new category to the list of open items without removing others
        setOpenItems(prev => {
            if (prev.includes(category)) return prev;
            return [...prev, category];
        });
      }
    } else if (openItems.length === 0 && Object.keys(groupedAssignments).length > 0) {
      // Default to opening the first category if nothing is open
      setOpenItems([Object.keys(groupedAssignments)[0]]);
    }
  }, [selectedId, preLoadedAssignments, isProctored, groupedAssignments]);

  const getTileStyles = (id: string, isLocked: boolean, isSelected: boolean) => {
    if (isLocked) {
        return 'bg-[#1E1E1E] border-[#333] text-[#444] cursor-not-allowed';
    }

    // Active Selection (High Contrast Blue) - Overrides other states
    if (isSelected) {
        return 'bg-[#007ACC] border-[#007ACC] text-white z-10 shadow-sm';
    }

    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      // FILLED GREEN for Attempted/Answered
      case 'attempted': 
        return 'bg-[#1b3a1b] border-[#2e7d32] text-[#4CAF50] shadow-[inset_0_0_0_1px_rgba(76,175,80,0.2)]';
      
      // FILLED DARK GREY for Visited/Skipped
      case 'visited': 
        return 'bg-[#2D2D2D] border-[#444] text-[#CCC] hover:border-[#666]';
        
      default: 
        return 'bg-[#1E1E1E] border-[#333] text-[#777] hover:border-[#555] hover:bg-[#252526]';
    }
  };

  const handleItemClick = (assignment: Assignment) => {
    const isLocked = assignment.is_unlocked === false;
    if (isLocked) {
      toast({ title: "Restricted", description: "This module is currently locked.", variant: "destructive" });
      return;
    }
    onSelect(assignment.id);
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#333] font-sans text-sm select-none">
      
      {/* 1. CANDIDATE IDENTITY (Formal/Sharp) */}
      <div className="bg-[#252526] border-b border-[#333] p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Candidate
            </span>
            <span className="text-[10px] text-[#4CAF50] font-mono flex items-center gap-1 bg-[#1E1E1E] px-1 border border-[#333]">
                <Fingerprint className="w-2.5 h-2.5" /> VERIFIED
            </span>
        </div>
        <div className="bg-[#1E1E1E] border border-[#333] p-2 text-xs font-mono text-[#DDD] tracking-wide text-center">
            {candidateId}
        </div>
      </div>

      {/* 2. LEGEND */}
      <div className="px-4 py-2 border-b border-[#333] bg-[#1E1E1E] shrink-0 flex items-center gap-4 text-[10px] text-[#888]">
         <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#1b3a1b] border border-[#2e7d32]"></div> Solved
         </div>
         <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#2D2D2D] border border-[#444]"></div> Visited
         </div>
         <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 border border-[#333] bg-[#1E1E1E]"></div> Unvisited
         </div>
      </div>

      <ScrollArea className="flex-1 bg-[#1E1E1E]">
        <div className="flex flex-col">
          {/* Changed type to "multiple" to allow multiple categories to remain open */}
          <Accordion 
            type="multiple" 
            value={openItems}
            onValueChange={setOpenItems}
            className="w-full"
          >
            {Object.entries(groupedAssignments).map(([category, items]) => {
              const completedCount = items.filter(i => questionStatuses[i.id] === 'attempted').length;
              
              return (
                <AccordionItem key={category} value={category} className="border-b border-[#333] border-t-0 rounded-none">
                  {/* Category Header */}
                  <AccordionTrigger className="px-4 py-3 hover:bg-[#2A2D2E] hover:no-underline bg-[#252526] data-[state=open]:bg-[#333] data-[state=open]:text-white transition-colors group rounded-none border-l-2 border-transparent data-[state=open]:border-[#007ACC]">
                    <div className="flex items-center justify-between w-full pr-2">
                       <span className="text-[11px] font-bold text-[#CCC] uppercase tracking-wider group-hover:text-white truncate">
                         {category}
                       </span>
                       <span className="font-mono text-[10px] text-[#666] group-hover:text-[#AAA]">
                         {completedCount} / {items.length}
                       </span>
                    </div>
                  </AccordionTrigger>
                  
                  {/* Grid Content */}
                  <AccordionContent className="p-0 bg-[#151515]">
                    <div className="grid grid-cols-5 gap-px bg-[#333] border-b border-[#333] p-px"> 
                      {items.map((assignment, idx) => {
                        const isLocked = assignment.is_unlocked === false;
                        const isSelected = selectedId === assignment.id;
                        const status = questionStatuses[assignment.id];

                        return (
                          <button
                            key={assignment.id}
                            onClick={() => handleItemClick(assignment)}
                            className={cn(
                              "aspect-square flex flex-col items-center justify-center transition-colors relative group rounded-none",
                              getTileStyles(assignment.id, isLocked, isSelected)
                            )}
                            title={assignment.title}
                          >
                            <span className="text-[11px] font-mono font-medium">{idx + 1}</span>
                            {isLocked && <LockKeyhole className="w-2.5 h-2.5 mt-0.5 opacity-50" />}
                            {status === 'attempted' && !isSelected && <Check className="w-2.5 h-2.5 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};
