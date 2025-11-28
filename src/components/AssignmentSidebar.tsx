import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

export const AssignmentSidebar = ({ selectedId, onSelect, questionStatuses }: AssignmentSidebarProps) => {
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('category', { ascending: true })
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data as Assignment[];
    },
  });

  // Helper to get status color
  const getStatusColor = (id: string) => {
    const status = questionStatuses[id] || 'not-visited';
    switch (status) {
      case 'attempted': return 'bg-green-500/20 text-green-500 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'review': return 'bg-orange-500/20 text-orange-500 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]';
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
    <div className="flex flex-col h-full">
      {/* Legend Area */}
      <div className="p-4 border-b border-white/10 bg-black/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Question Palette</h3>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Answered</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Review</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/50" /> Visited</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border border-white/30" /> Not Visited</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {assignments.map((assignment, index) => (
              <button
                key={assignment.id}
                onClick={() => onSelect(assignment.id)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 relative group",
                  getStatusColor(assignment.id),
                  selectedId === assignment.id && "ring-2 ring-primary ring-offset-2 ring-offset-black"
                )}
              >
                <span className="text-sm font-bold font-mono">{index + 1}</span>
                {getStatusIcon(assignment.id)}
                
                {/* Tooltip for Title */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-popover border border-white/10 text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {assignment.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
