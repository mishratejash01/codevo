import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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
    <ScrollArea className="h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">Modules</h2>
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
        className="w-full justify-start text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
        {category}
      </Button>
      {expanded && (
        <div className="ml-6 space-y-1">
          {assignments.map((assignment) => (
            <Button
              key={assignment.id}
              variant={selectedId === assignment.id ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => onSelect(assignment.id)}
            >
              {assignment.title}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
