import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProblemNotesProps {
  problemId: string;
  userId: string | undefined;
}

export function ProblemNotes({ problemId, userId }: ProblemNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data: note } = useQuery({
    queryKey: ['problem_note', problemId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('practice_notes')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!problemId
  });

  useEffect(() => {
    if (note?.content) {
      setContent(note.content);
    }
  }, [note]);

  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!userId) throw new Error('Not logged in');
      
      const { error } = await supabase
        .from('practice_notes')
        .upsert({
          user_id: userId,
          problem_id: problemId,
          content: newContent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,problem_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
      setSaveStatus('idle');
    }
  });

  // Debounced auto-save
  useEffect(() => {
    if (!userId || content === (note?.content || '')) return;
    
    setSaveStatus('saving');
    const timeout = setTimeout(() => {
      saveMutation.mutate(content);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [content, userId]);

  if (!userId) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Login to save personal notes
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StickyNote className="w-3.5 h-3.5" />
          <span>Personal Notes</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] transition-opacity",
          saveStatus === 'idle' ? "opacity-0" : "opacity-100"
        )}>
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Saved</span>
            </>
          )}
        </div>
      </div>
      <Textarea
        placeholder="Write your notes, approach, or key insights here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-[#151515] border-white/10 text-sm min-h-[120px] resize-none"
      />
    </div>
  );
}
