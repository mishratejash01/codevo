import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, ThumbsUp, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Discussion {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
  user_id: string | null;
  parent_id: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface EventDiscussionsProps {
  eventId: string;
}

export function EventDiscussions({ eventId }: EventDiscussionsProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscussions();
    checkAuth();
  }, [eventId]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  }

  async function fetchDiscussions() {
    const { data, error } = await supabase
      .from('event_discussions')
      .select('*')
      .eq('event_id', eventId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const userIds = data.filter(d => d.user_id).map(d => d.user_id as string);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const discussionsWithProfiles = data.map(d => ({
        ...d,
        profiles: profiles?.find(p => p.id === d.user_id) || null
      }));
      setDiscussions(discussionsWithProfiles as Discussion[]);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newComment.trim() || !userId) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('event_discussions')
      .insert({
        event_id: eventId,
        user_id: userId,
        content: newComment.trim(),
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      toast.success('Comment posted!');
      setNewComment('');
      fetchDiscussions();
    }
    setSubmitting(false);
  }

  async function handleUpvote(discussionId: string, currentUpvotes: number) {
    if (!userId) {
      toast.error('Please login to upvote');
      return;
    }

    const { error } = await supabase
      .from('event_discussions')
      .update({ upvotes: currentUpvotes + 1 })
      .eq('id', discussionId);

    if (!error) {
      setDiscussions(prev => 
        prev.map(d => d.id === discussionId ? { ...d, upvotes: currentUpvotes + 1 } : d)
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-[#ff8c00]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- Section Header --- */}
      <div className="flex items-center gap-[15px] mb-[40px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Join the Conversation
        </h3>
      </div>

      {/* --- Write a comment (Auth Protected) --- */}
      {userId ? (
        <div className="border border-[#1a1a1a] bg-[#050505] p-[30px] mb-[60px] relative overflow-hidden group">
          <label className="block text-[0.7rem] uppercase tracking-[2px] text-[#666666] mb-[15px] font-bold">
            Write your message
          </label>
          <textarea
            placeholder="Share your thoughts or ask a question..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-transparent border-none border-b border-[#1a1a1a] focus:border-[#ff8c00] text-white font-inter text-[1.1rem] min-h-[60px] resize-none outline-none pb-[15px] mb-[25px] font-light placeholder:text-[#333] transition-colors"
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="bg-[#ff8c00] hover:bg-white text-black border-none px-[40px] py-[16px] text-[0.75rem] font-extrabold uppercase tracking-[3px] cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Post Comment'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] bg-[#050505] p-[40px] mb-[60px] text-center">
          <p className="text-[#666666] text-sm uppercase tracking-widest">
            Authentication Required to Join the Assembly
          </p>
        </div>
      )}

      {/* --- Conversations List --- */}
      {discussions.length > 0 ? (
        <div className="divide-y divide-[#1a1a1a]">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="py-[40px] flex flex-col md:flex-row gap-[25px] first:pt-0"
            >
              {/* Avatar */}
              <div className="w-[45px] h-[45px] border border-[#1a1a1a] flex items-center justify-center bg-[#080808] text-[0.8rem] text-[#666666] shrink-0 overflow-hidden">
                {discussion.profiles?.avatar_url ? (
                  <img 
                    src={discussion.profiles.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover grayscale"
                  />
                ) : (
                  discussion.profiles?.full_name?.substring(0, 2).toUpperCase() || <User className="w-4 h-4" />
                )}
              </div>

              {/* Comment Content */}
              <div className="grow">
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="font-medium text-[1rem] text-white">
                    {discussion.profiles?.full_name || 'Anonymous Operative'}
                  </span>
                  <span className="text-[0.7rem] text-[#666666] uppercase tracking-[1px]">
                    {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-[#e0e0e0] text-[1rem] leading-[1.6] font-light mb-[20px] whitespace-pre-wrap">
                  {discussion.content}
                </p>

                {/* Upvote Action */}
                <button 
                  onClick={() => handleUpvote(discussion.id, discussion.upvotes)}
                  className="inline-flex items-center gap-[8px] bg-transparent border border-[#1a1a1a] px-[16px] py-[8px] text-[#666666] hover:border-white hover:text-white transition-all cursor-pointer text-[0.75rem]"
                >
                  <ThumbsUp className="w-[14px] h-[14px] stroke-[2px]" />
                  <span>{discussion.upvotes} Likes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#050505] border border-[#1a1a1a]">
          <MessageCircle className="w-12 h-12 text-[#1a1a1a] mx-auto mb-4" />
          <p className="text-[#666666] uppercase tracking-widest text-xs font-bold">
            No Intel Shared Yet
          </p>
          <p className="text-[#333] text-sm mt-2">Initiate the protocol by sharing your thoughts.</p>
        </div>
      )}
    </div>
  );
}
