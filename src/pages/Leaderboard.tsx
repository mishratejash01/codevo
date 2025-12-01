import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Clock, Calendar, ArrowUpRight, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header'; // Ensure Header is used if not handled by layout

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'current' | 'last_month'>('current');

  // Fetch Leaderboard Data
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['global_leaderboard', timeframe],
    queryFn: async () => {
      // Logic for "Monthly Reset": Filter submissions by date
      const now = new Date();
      const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      let query = supabase
        .from('iitm_leaderboard') // Assuming this view exists or using raw table
        .select('*');

      // Since we might not have a view with date filtering built-in easily via simple client query on a view,
      // we will simulate the "Top 100" by fetching recent high scores from submissions/sessions.
      // For this demo, we'll fetch from the 'exam_sessions' table which tracks total score per session.
      
      const { data, error } = await supabase
        .from('iitm_exam_sessions') // Or 'exam_sessions' based on context
        .select(`
          user_id,
          total_score,
          duration_seconds,
          end_time,
          full_name,
          user_email
        `)
        .eq('status', 'completed')
        .gt('total_score', 0)
        .order('total_score', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Leaderboard fetch error:", error);
        return [];
      }

      // Client-side filtering for month (Simulating DB date filter)
      const filtered = data.filter((item: any) => {
        if (!item.end_time) return false;
        const d = new Date(item.end_time);
        if (timeframe === 'current') return d >= new Date(firstDayCurrentMonth);
        if (timeframe === 'last_month') return d >= new Date(firstDayLastMonth) && d <= new Date(lastDayLastMonth);
        return true;
      });

      // Dedup by User (Keep highest score)
      const uniqueUsers = new Map();
      filtered.forEach((item: any) => {
        if (!uniqueUsers.has(item.user_id) || uniqueUsers.get(item.user_id).total_score < item.total_score) {
          uniqueUsers.set(item.user_id, item);
        }
      });

      return Array.from(uniqueUsers.values()).sort((a: any, b: any) => b.total_score - a.total_score).slice(0, 20); // Top 20 for display
    }
  });

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case 1: return "bg-gray-400/20 text-gray-400 border-gray-400/50";
      case 2: return "bg-amber-700/20 text-amber-600 border-amber-700/50";
      default: return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="font-mono font-bold text-sm w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-primary/20 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent drop-shadow-2xl">
            Hall of Fame
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Top performers for {timeframe === 'current' ? 'this month' : 'last month'}. 
            <br/>Leaderboards reset automatically on the 1st of every month.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center">
          <Tabs defaultValue="current" className="w-[400px]" onValueChange={(v: any) => setTimeframe(v)}>
            <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 p-1">
              <TabsTrigger value="current" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Calendar className="w-4 h-4 mr-2" /> This Month
              </TabsTrigger>
              <TabsTrigger value="last_month" className="data-[state=active]:bg-white/10">
                <History className="w-4 h-4 mr-2" /> Past Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Leaderboard Card */}
        <Card className="bg-[#0c0c0e]/80 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" /> 
                {timeframe === 'current' ? 'Current Standings' : 'Historical Records'}
              </CardTitle>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                Top {leaderboardData.length}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="divide-y divide-white/5">
                {leaderboardData.map((user: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border bg-gradient-to-br", getRankStyle(index))}>
                        {getMedalIcon(index)}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-white/10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                          <AvatarFallback className="bg-white/10 text-xs">{user.full_name?.slice(0,2) || 'VN'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {user.full_name || user.user_email?.split('@')[0] || 'Anonymous'}
                            {index === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">KING</span>}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {user.duration_seconds ? `${Math.floor(user.duration_seconds/60)}m ${user.duration_seconds%60}s` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-white group-hover:text-primary transition-colors">
                        {user.total_score}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">PTS</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No records found for this period.</p>
                <Button variant="link" className="mt-2 text-primary">Be the first to compete!</Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Leaderboard;
