import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, ThumbsUp, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

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
      // Fetch profiles separately
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
        <Loader2 className="animate-spin h-6 w-6 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-cyan-500 rounded-full" />
        Discussions
      </h3>

      {/* New comment form */}
      {userId && (
        <div className="bg-[#151518] border border-white/10 rounded-xl p-4">
          <Textarea
            placeholder="Start a discussion or ask a question..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-[#09090b] border-white/10 text-white min-h-[100px] mb-3"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || !newComment.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post
            </Button>
          </div>
        </div>
      )}

      {/* Discussions list */}
      {discussions.length > 0 ? (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-[#151518] border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={discussion.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-purple-500/20 text-purple-400">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">
                      {discussion.profiles?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-300">{discussion.content}</p>

                  <div className="flex items-center gap-4 mt-4">
                    <button 
                      onClick={() => handleUpvote(discussion.id, discussion.upvotes)}
                      className="flex items-center gap-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{discussion.upvotes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#151518] rounded-2xl border border-white/10">
          <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No discussions yet</p>
          <p className="text-gray-500 text-sm">Be the first to start a conversation!</p>
        </div>
      )}
    </div>
  );
}
