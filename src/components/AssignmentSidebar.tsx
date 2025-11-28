import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  category: string | null;
  deadline: string | null;
}

interface AssignmentSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const AssignmentSidebar = ({ selectedId, onSelect }: AssignmentSidebarProps) => {
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

  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const category = assignment.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(assignment);
    return acc;
  }, {} as Record<string, Assignment[]>);

  return (
    <ScrollArea className="h-full bg-transparent">
      <div className="p-4 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-4 px-2">Modules</h2>
        {Object.entries(groupedAssignments).map(([category, items]) => (
          <CategoryGroup
            key={category}
            category={category}
            assignments={items}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

const CategoryGroup = ({
  category,
  assignments,
  selectedId,
  onSelect,
}: {
  category: string;
  assignments: Assignment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-start text-sm font-medium text-foreground hover:bg-white/5 px-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />}
        {category}
      </Button>
      
      {expanded && (
        <div className="ml-4 space-y-1 border-l border-white/10 pl-2">
          {assignments.map((assignment) => (
            <Button
              key={assignment.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm transition-all duration-200 border border-transparent h-9",
                selectedId === assignment.id 
                  ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)] font-medium translate-x-1" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 hover:translate-x-1"
              )}
              onClick={() => onSelect(assignment.id)}
            >
              <span className="truncate">{assignment.title}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
