import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col items-center justify-center h-full text-[#808080] py-8 bg-[#0a0a0a]">
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium tracking-wide">LOGIN TO PARTICIPATE</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6 bg-[#0a0a0a] h-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-[#1c1c1c] border border-white/5 rounded-[4px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-[#f2f2f2] font-sans selection:bg-white/20">
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto w-full">
          
          {/* Post Creator Section */}
          <div className="mb-10">
            {showForm ? (
              <div className="bg-[#141414] border border-white/10 rounded-[4px] p-6 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Give your post a title..." 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none border-b border-white/10 text-xl font-serif text-[#f2f2f2] placeholder:text-[#808080] pb-3 mb-4 focus:outline-none focus:border-white/30 transition-colors"
                />
                <textarea 
                  placeholder="Share your thoughts with the community..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent border-none resize-none min-h-[100px] text-[15px] text-[#f2f2f2] placeholder:text-[#808080] focus:outline-none p-0 leading-relaxed"
                />
                <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setShowForm(false)}
                    className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#808080] hover:text-[#f2f2f2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => createMutation.mutate()}
                    disabled={!title.trim() || !content.trim() || createMutation.isPending}
                    className="px-6 py-2.5 bg-[#f2f2f2] text-black border border-[#f2f2f2] rounded-[2px] text-[11px] font-semibold uppercase tracking-[0.5px] hover:bg-transparent hover:text-[#f2f2f2] transition-all disabled:opacity-50 disabled:hover:bg-[#f2f2f2] disabled:hover:text-black"
                  >
                    {createMutation.isPending ? 'Posting...' : 'Post Discussion'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-4 border border-dashed border-white/10 rounded-[4px] text-[#808080] text-xs font-semibold uppercase tracking-widest hover:border-white/20 hover:text-[#f2f2f2] hover:bg-[#141414] transition-all"
              >
                + Start New Discussion
              </button>
            )}
          </div>

          <h2 className="text-[11px] text-[#808080] font-semibold uppercase tracking-[2px] mb-4 pl-1">
            Latest Conversations
          </h2>

          {/* Discussion Cards */}
          <div className="space-y-3">
            {discussions.length === 0 ? (
              <div className="text-center py-16 text-[#808080] text-sm italic font-serif">
                The silence is waiting to be broken...
              </div>
            ) : (
              discussions.map((disc: any) => (
                <div
                  key={disc.id}
                  className="group bg-[#1c1c1c] border border-white/10 p-6 rounded-[4px] cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-white/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#808080]">
                      <div className="w-[5px] h-[5px] bg-[#444] rounded-full" />
                      <span className="text-[#f2f2f2] tracking-wide">
                        {disc.profiles?.full_name || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#f2f2f2] font-semibold text-[11px]">
                      <span className="text-[10px] text-emerald-500/80">▲</span>
                      {disc.upvotes || 0}
                    </div>
                  </div>

                  <h3 className="font-serif text-[19px] text-[#f2f2f2] mb-2 leading-tight group-hover:text-white transition-colors">
                    {disc.title}
                  </h3>
                  
                  <p className="text-sm text-[#808080] leading-relaxed line-clamp-2 mb-4">
                    {disc.content}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#808080] font-medium tracking-wide">
                    <span>View Thread</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(disc.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
