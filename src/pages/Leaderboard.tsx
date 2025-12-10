import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Clock, Calendar, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'all_time' | 'current_month'>('all_time');

  // Fetch Leaderboard Data (Global Only)
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['leaderboard', 'global', timeframe],
    queryFn: async () => {
      let query = supabase
        .from('iitm_exam_sessions')
        .select(`
          user_id,
          total_score,
          duration_seconds,
          end_time,
          full_name,
          user_email
        `)
        .eq('status', 'completed')
        .gt('total_score', 0);

      // Date Filtering
      if (timeframe === 'current_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('end_time', startOfMonth);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Leaderboard error:", error);
        return [];
      }

      // --- GLOBAL MODE: Aggregate User Scores ---
      const userMap = new Map();

      data.forEach((session: any) => {
        if (!userMap.has(session.user_id)) {
          userMap.set(session.user_id, {
            user_id: session.user_id,
            full_name: session.full_name,
            user_email: session.user_email,
            total_score: 0,
            exams_taken: 0,
            last_active: session.end_time
          });
        }
        const user = userMap.get(session.user_id);
        user.total_score += (session.total_score || 0);
        user.exams_taken += 1;
        if (new Date(session.end_time) > new Date(user.last_active)) {
          user.last_active = session.end_time;
        }
      });

      return Array.from(userMap.values())
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 50);
    }
  });

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
      case 1: return "bg-gray-400/20 text-gray-400 border-gray-400/50 shadow-[0_0_15px_rgba(156,163,175,0.2)]";
      case 2: return "bg-amber-700/20 text-amber-600 border-amber-700/50 shadow-[0_0_15px_rgba(180,83,9,0.2)]";
      default: return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 fill-current" />;
    if (index === 1) return <Medal className="w-5 h-5 fill-current" />;
    if (index === 2) return <Medal className="w-5 h-5 fill-current" />;
    return <span className="font-mono font-bold text-sm w-5 text-center">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-4 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide text-white flex items-center gap-3">
              <Globe className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              Global Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-lg">
              The hall of fame. Rankings are calculated based on the total points accumulated across all proctored exams.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="text-sm font-medium text-muted-foreground hidden md:block">Timeframe:</div>
             <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-[160px] bg-[#121212] border-white/10 text-white h-11 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="current_month">This Month</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <Card className="bg-[#0c0c0e]/80 border-white/10 backdrop-blur-sm shadow-2xl overflow-hidden min-h-[500px]">
          <CardHeader className="border-b border-white/5 py-4 px-6 bg-white/[0.02]">
            <div className="grid grid-cols-12 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
              <div className="col-span-2 md:col-span-1 text-center">Rank</div>
              <div className="col-span-6 md:col-span-5">User</div>
              <div className="col-span-4 md:col-span-3 text-right">Total Score</div>
              <div className="hidden md:block col-span-3 text-right">Last Active</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="divide-y divide-white/5">
                {leaderboardData.map((user: any, index: number) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-12 items-center p-4 hover:bg-white/5 transition-all duration-200 group"
                  >
                    {/* Rank */}
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110", getRankStyle(index))}>
                        {getMedalIcon(index)}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 md:gap-4 pl-2">
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 border border-white/10 ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                        <AvatarFallback className="bg-white/10 text-[10px]">{user.full_name?.slice(0,2) || 'VN'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm md:text-base truncate flex items-center gap-2">
                          {user.full_name || user.user_email?.split('@')[0] || 'Anonymous'}
                          {index === 0 && <span className="hidden sm:inline-flex text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 rounded border border-yellow-500/30">KING</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate hidden sm:block">
                          {user.exams_taken} Exams Completed
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-4 md:col-span-3 text-right">
                      <div className="text-lg md:text-2xl font-bold font-mono text-white group-hover:text-primary transition-colors">
                        {user.total_score}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Points</div>
                    </div>

                    {/* Details (Desktop Only) */}
                    <div className="hidden md:block col-span-3 text-right text-sm text-gray-400 font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.last_active).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                  <Trophy className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-lg font-medium text-white/50">No champions found.</p>
                <p className="text-sm opacity-50 max-w-xs mx-auto mt-1">
                  Start completing proctored exams to rank up!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Leaderboard;
