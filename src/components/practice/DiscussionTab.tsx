import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, ChevronUp, User } from 'lucide-react';
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
        // Fixed: Sort by created_at descending so new posts appear at the top
        .order('created_at', { ascending: false })
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
      toast({ title: 'Posted!', description: 'Your discussion is now live.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to post discussion', variant: 'destructive' });
    }
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#475569] py-12 bg-[#0c0c0c]">
        <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
        <p className="font-serif italic text-sm text-[#94a3b8]">Authenticate to access secure comms.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 bg-[#0c0c0c] h-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-[#141414] border border-white/[0.05] rounded-[2px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c] font-sans">
      
      {/* Post Creator */}
      <div className="p-6 border-b border-white/[0.08] shrink-0">
        {showForm ? (
          <div className="bg-[#141414] border border-white/[0.08] rounded-[2px] p-5 animate-in fade-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Subject Line..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-none text-[#f8fafc] text-lg font-serif italic placeholder:text-[#475569] focus:ring-0 px-0 pb-2 mb-2 border-b border-white/[0.05] rounded-none"
            />
            <textarea
              placeholder="Transmit your findings..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none text-[#94a3b8] text-sm resize-none min-h-[80px] focus:ring-0 px-0 leading-relaxed custom-scrollbar placeholder:text-[#475569]"
            />
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/[0.05]">
              <button
                onClick={() => setShowForm(false)}
                className="text-[10px] uppercase tracking-widest text-[#666] hover:text-[#999] px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!title.trim() || !content.trim() || createMutation.isPending}
                className="bg-[#f8fafc] text-[#080808] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-[2px] hover:bg-[#94a3b8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createMutation.isPending ? 'Transmitting...' : (
                  <>
                    <Send className="w-3 h-3" /> Post
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full h-12 border border-dashed border-white/[0.1] rounded-[2px] text-[#475569] text-[10px] uppercase tracking-widest hover:border-white/[0.2] hover:text-[#94a3b8] hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Initialize New Thread
          </button>
        )}
      </div>

      {/* Discussions Feed */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {discussions.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif italic text-[#475569]">No transmissions received yet.</p>
            </div>
          ) : (
            discussions.map((disc: any) => (
              <div
                key={disc.id}
                className="group relative bg-[#141414] border border-white/[0.05] hover:border-white/[0.1] p-5 rounded-[2px] transition-all hover:bg-[#181818]"
              >
                <div className="flex gap-4">
                  {/* Vote Column */}
                  <div className="flex flex-col items-center gap-1 text-[#475569]">
                    <button className="hover:text-[#f8fafc] transition-colors">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono">{disc.upvotes || 0}</span>
                  </div>
                  
                  {/* Content Column */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] text-[#f8fafc] font-medium mb-2 group-hover:text-white transition-colors line-clamp-1">
                      {disc.title}
                    </h4>
                    
                    <p className="text-[13px] text-[#94a3b8] leading-relaxed line-clamp-2 mb-4">
                      {disc.content}
                    </p>
                    
                    {/* Meta Footer */}
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[#475569]">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-4 h-4 rounded-full border border-white/[0.1]">
                          <AvatarFallback className="bg-[#1f1f1f] text-[#f8fafc] text-[8px]">
                            {disc.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[#666] group-hover:text-[#888] transition-colors">
                          {disc.profiles?.full_name || 'Unknown Agent'}
                        </span>
                      </div>
                      <span className="text-[#333]">•</span>
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
