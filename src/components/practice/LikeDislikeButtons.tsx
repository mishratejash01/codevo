import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LikeDislikeButtonsProps {
  problemId: string;
  userId: string | undefined;
  likes: number;
  dislikes: number;
}

export function LikeDislikeButtons({ problemId, userId, likes, dislikes }: LikeDislikeButtonsProps) {
  const queryClient = useQueryClient();

  const { data: userReaction } = useQuery({
    queryKey: ['reaction', problemId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('practice_reactions')
        .select('reaction_type')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.reaction_type || null;
    },
    enabled: !!userId && !!problemId
  });

  const reactMutation = useMutation({
    mutationFn: async (reactionType: 'like' | 'dislike') => {
      if (!userId) throw new Error('Not logged in');
      
      if (userReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('practice_reactions')
          .delete()
          .eq('problem_id', problemId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Upsert reaction
        const { error } = await supabase
          .from('practice_reactions')
          .upsert({
            problem_id: problemId,
            user_id: userId,
            reaction_type: reactionType
          }, {
            onConflict: 'user_id,problem_id'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reaction', problemId, userId] });
      queryClient.invalidateQueries({ queryKey: ['practice_problem', problemId] });
    }
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => userId && reactMutation.mutate('like')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "h-7 px-2 gap-1.5",
          userReaction === 'like' ? "text-green-400 bg-green-400/10" : "text-muted-foreground hover:text-white"
        )}
      >
        <ThumbsUp className={cn("w-3.5 h-3.5", userReaction === 'like' && "fill-current")} />
        <span className="text-xs">{likes || 0}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => userId && reactMutation.mutate('dislike')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "h-7 px-2 gap-1.5",
          userReaction === 'dislike' ? "text-red-400 bg-red-400/10" : "text-muted-foreground hover:text-white"
        )}
      >
        <ThumbsDown className={cn("w-3.5 h-3.5", userReaction === 'dislike' && "fill-current")} />
        <span className="text-xs">{dislikes || 0}</span>
      </Button>
    </div>
  );
}
