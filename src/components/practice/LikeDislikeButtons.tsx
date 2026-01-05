import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      // Invalidate specific user reaction
      queryClient.invalidateQueries({ queryKey: ['reaction', problemId, userId] });
      // Invalidate ALL practice problem queries to ensure the parent (fetching by slug) updates the counts
      queryClient.invalidateQueries({ queryKey: ['practice_problem'] });
    }
  });

  return (
    <div className="flex items-center bg-[#1a1a1a] border border-white/[0.08] rounded-[2px] overflow-hidden h-[30px]">
      
      {/* Like Button */}
      <button
        onClick={() => userId && reactMutation.mutate('like')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "flex items-center gap-2 px-3 h-full bg-transparent border-none text-[10px] font-semibold tracking-[0.02em] font-sans transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none",
          userReaction === 'like' 
            ? "text-[#f8fafc] bg-white/[0.06]" 
            : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.03]"
        )}
      >
        <ThumbsUp 
          className={cn(
            "w-3 h-3 stroke-[2.2px]",
            userReaction === 'like' && "fill-white/10"
          )} 
        />
        <span className="tabular-nums">{likes || 0}</span>
      </button>

      {/* Divider */}
      <div className="w-[1px] h-[12px] bg-white/[0.08]" />

      {/* Dislike Button */}
      <button
        onClick={() => userId && reactMutation.mutate('dislike')}
        disabled={!userId || reactMutation.isPending}
        className={cn(
          "flex items-center gap-2 px-3 h-full bg-transparent border-none text-[10px] font-semibold tracking-[0.02em] font-sans transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none",
          userReaction === 'dislike' 
            ? "text-[#f8fafc] bg-white/[0.06]" 
            : "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/[0.03]"
        )}
      >
        <ThumbsDown 
          className={cn(
            "w-3 h-3 stroke-[2.2px]",
            userReaction === 'dislike' && "fill-white/10"
          )} 
        />
        <span className="tabular-nums">{dislikes || 0}</span>
      </button>

    </div>
  );
}
