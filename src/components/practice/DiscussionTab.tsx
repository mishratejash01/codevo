import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, Send, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DiscussionTabProps {
  problemId: string;
  userId: string | undefined;
}

export function DiscussionTab({ problemId, userId }: DiscussionTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['problem_discussions', problemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_discussions')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('problem_id', problemId)
        .is('parent_id', null)
        .order('upvotes', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!problemId
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not logged in');
      const { error } = await supabase.from('practice_discussions').insert({
        problem_id: problemId,
        user_id: userId,
        title,
        content
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem_discussions', problemId] });
      setTitle('');
      setContent('');
      setShowForm(false);
      toast({ title: 'Posted!', description: 'Your discussion has been created.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to post discussion', variant: 'destructive' });
    }
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Login to view and participate in discussions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* New Discussion Form */}
      <div className="p-3 border-b border-white/5">
        {showForm ? (
          <div className="space-y-3">
            <Input
              placeholder="Discussion title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#151515] border-white/10 text-sm"
            />
            <Textarea
              placeholder="Share your approach or ask a question..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-[#151515] border-white/10 text-sm min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || !content.trim() || createMutation.isPending}
                className="h-8 text-xs"
              >
                <Send className="w-3 h-3 mr-1" /> Post
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="w-full h-8 text-xs border-white/10 bg-white/5"
          >
            <MessageSquare className="w-3 h-3 mr-2" /> Start a Discussion
          </Button>
        )}
      </div>

      {/* Discussions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {discussions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No discussions yet. Be the first to share your approach!
            </div>
          ) : (
            discussions.map((disc: any) => (
              <div
                key={disc.id}
                className="p-3 rounded-lg bg-[#151515] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <button className="p-1 hover:bg-white/10 rounded">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium">{disc.upvotes || 0}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white mb-1 truncate">
                      {disc.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {disc.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-[8px] bg-primary/20">
                          {disc.profiles?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{disc.profiles?.full_name || 'Anonymous'}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(disc.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
