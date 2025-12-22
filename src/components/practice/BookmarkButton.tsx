import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookmarkButtonProps {
  problemId: string;
  userId: string | undefined;
  variant?: 'icon' | 'full';
}

export function BookmarkButton({ problemId, userId, variant = 'icon' }: BookmarkButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isBookmarked } = useQuery({
    queryKey: ['bookmark', problemId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('practice_bookmarks')
        .select('id')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!userId && !!problemId
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not logged in');
      
      if (isBookmarked) {
        const { error } = await supabase
          .from('practice_bookmarks')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('practice_bookmarks')
          .insert({ problem_id: problemId, user_id: userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', problemId, userId] });
      queryClient.invalidateQueries({ queryKey: ['user_bookmarks', userId] });
      toast({
        title: isBookmarked ? 'Removed from bookmarks' : 'Bookmarked!',
        description: isBookmarked ? 'Problem removed from your list' : 'Problem saved to your bookmarks'
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update bookmark', variant: 'destructive' });
    }
  });

  if (!userId) return null;

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={cn(
          "h-8 w-8",
          isBookmarked ? "text-yellow-400 hover:text-yellow-300" : "text-muted-foreground hover:text-white"
        )}
      >
        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className={cn(
        "h-8 text-xs border-white/10",
        isBookmarked ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-white/5"
      )}
    >
      <Bookmark className={cn("w-3.5 h-3.5 mr-1.5", isBookmarked && "fill-current")} />
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  );
}
