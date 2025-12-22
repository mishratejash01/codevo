import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStatsCardProps {
  userId: string | undefined;
}

interface ProblemStats {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  // Fetch user submissions to calculate solved problems
  const { data: submissions = [] } = useQuery({
    queryKey: ['user_submissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('problem_id, status, score')
        .eq('user_id', userId)
        .eq('status', 'completed');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  // Fetch problems to get difficulty breakdown
  const { data: problems = [] } = useQuery({
    queryKey: ['all_problems_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('id, difficulty');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch user streak
  const { data: streak } = useQuery({
    queryKey: ['user_streak', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('practice_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });

  // Calculate stats
  const solvedProblemIds = new Set(submissions.map(s => s.problem_id));
  
  const stats: ProblemStats = problems.reduce((acc, p) => {
    if (solvedProblemIds.has(p.id)) {
      if (p.difficulty === 'Easy') acc.easy++;
      else if (p.difficulty === 'Medium') acc.medium++;
      else if (p.difficulty === 'Hard') acc.hard++;
      acc.total++;
    }
    return acc;
  }, { easy: 0, medium: 0, hard: 0, total: 0 } as ProblemStats);

  const totalProblems = problems.length;
  const totalPoints = submissions.reduce((sum, s) => sum + (s.score || 0), 0);

  const difficultyData = [
    { label: 'Easy', solved: stats.easy, total: problems.filter(p => p.difficulty === 'Easy').length, color: 'text-green-400', bgColor: 'bg-green-400' },
    { label: 'Medium', solved: stats.medium, total: problems.filter(p => p.difficulty === 'Medium').length, color: 'text-yellow-400', bgColor: 'bg-yellow-400' },
    { label: 'Hard', solved: stats.hard, total: problems.filter(p => p.difficulty === 'Hard').length, color: 'text-red-400', bgColor: 'bg-red-400' },
  ];

  if (!userId) {
    return (
      <Card className="bg-[#0c0c0e] border-white/10">
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Login to track your progress
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0c0c0e] border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Circle */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white/5"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(stats.total / Math.max(totalProblems, 1)) * 220} 220`}
                className="text-primary"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-bold text-white">{stats.total}</span>
              <span className="text-[9px] text-muted-foreground">solved</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            {difficultyData.map(d => (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className={d.color}>{d.label}</span>
                  <span className="text-muted-foreground">{d.solved}/{d.total}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", d.bgColor)}
                    style={{ width: `${d.total > 0 ? (d.solved / d.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{streak?.current_streak || 0}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">Streak</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{totalPoints}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">Points</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{streak?.longest_streak || 0}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">Best</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
