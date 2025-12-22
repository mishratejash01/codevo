import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Zap, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SubmissionHistoryProps {
  problemId: string;
  userId: string | undefined;
  onSelectSubmission?: (code: string, language: string) => void;
}

export function SubmissionHistory({ problemId, userId, onSelectSubmission }: SubmissionHistoryProps) {
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['problem_submissions', problemId, userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!problemId
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
        <p className="text-sm">Login to see your submissions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No submissions yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-1">
        {submissions.map((sub, idx) => (
          <button
            key={sub.id}
            onClick={() => onSelectSubmission?.(sub.code || '', sub.language || 'python')}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all",
              sub.status === 'completed'
                ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
                : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {sub.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  sub.status === 'completed' ? "text-green-400" : "text-red-400"
                )}>
                  {sub.status === 'completed' ? 'Accepted' : 'Wrong Answer'}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5">
                {sub.language || 'python'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {sub.runtime_ms && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {sub.runtime_ms}ms
                </span>
              )}
              {sub.memory_kb && (
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> {Math.round(sub.memory_kb / 1024)}MB
                </span>
              )}
              {sub.test_cases_passed !== null && sub.test_cases_total !== null && (
                <span>
                  {sub.test_cases_passed}/{sub.test_cases_total} passed
                </span>
              )}
              <span className="ml-auto">
                {sub.submitted_at && formatDistanceToNow(new Date(sub.submitted_at), { addSuffix: true })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
