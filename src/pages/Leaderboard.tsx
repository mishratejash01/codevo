import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Clock, Calendar, Globe, Target, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const Leaderboard = () => {
  const [viewMode, setViewMode] = useState<'global' | 'exam'>('global');
  const [timeframe, setTimeframe] = useState<'all_time' | 'current_month'>('all_time');
  const [selectedExam, setSelectedExam] = useState<string>('all');

  // 1. Fetch Available Exam Sets for the Dropdown
  const { data: examSets = [] } = useQuery({
    queryKey: ['available_exam_sets'],
    queryFn: async () => {
      const { data } = await supabase
        .from('iitm_exam_question_bank')
        .select('set_name, title')
        .not('set_name', 'is', null);
      
      // Unique sets
      const map = new Map();
      data?.forEach(item => {
        if (!map.has(item.set_name)) {
          map.set(item.set_name, item.title || item.set_name);
        }
      });
      
      return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
    }
  });

  // 2. Fetch Leaderboard Data
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['leaderboard', viewMode, timeframe, selectedExam],
    queryFn: async () => {
      let query = supabase
        .from('iitm_exam_sessions')
        .select(`
          user_id,
          total_score,
          duration_seconds,
          end_time,
          full_name,
          user_email,
          set_name
        `)
        .eq('status', 'completed');
        // Removed .gt('total_score', 0) to include 0 scores if needed based on your data

      // Date Filtering
      if (timeframe === 'current_month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('end_time', startOfMonth);
      }

      // Exam Filtering (Only applies if in Exam Mode)
      if (viewMode === 'exam' && selectedExam !== 'all') {
        query = query.eq('set_name', selectedExam);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Leaderboard error:", error);
        return [];
      }

      if (viewMode === 'global') {
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

      } else {
        // --- EXAM SPECIFIC MODE: Best Score per User per Exam ---
        // Logic: Higher Score > Lower Time > Later Date
        const bestAttempts = new Map();

        data.forEach((session: any) => {
          const key = `${session.user_id}_${session.set_name}`;
          const existing = bestAttempts.get(key);

          if (!existing) {
            bestAttempts.set(key, session);
          } else {
            const scoreImprovement = session.total_score > existing.total_score;
            // Tie-breaker: If scores are equal, lower duration wins
            const timeImprovement = session.total_score === existing.total_score && session.duration_seconds < existing.duration_seconds;
            
            if (scoreImprovement || timeImprovement) {
              bestAttempts.set(key, session);
            }
          }
        });

        return Array.from(bestAttempts.values())
          .sort((a: any, b: any) => {
            if (b.total_score !== a.total_score) return b.total_score - a.total_score; // Higher score first
            return a.duration_seconds - b.duration_seconds; // Lower time second
          })
          .slice(0, 50);
      }
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

      <div className="w-full max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide text-white">
              Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Compete with the best. Rankings are updated in real-time based on exam performance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             {/* View Mode Toggle */}
             <div className="bg-[#121212] p-1 rounded-lg border border-white/10 flex">
                <button
                  onClick={() => setViewMode('global')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'global' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Globe className="w-4 h-4" /> Global
                </button>
                <button
                  onClick={() => setViewMode('exam')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    viewMode === 'exam' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Target className="w-4 h-4" /> Exam Specific
                </button>
             </div>

             {/* Timeframe Filter */}
             <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-[160px] bg-[#121212] border-white/10 text-white h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                  <SelectItem value="all_time">All Time</SelectItem>
                  <SelectItem value="current_month">This Month</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>

        {/* Filters Row (Only for Exam Mode) */}
        {viewMode === 'exam' && (
          <div className="flex items-center gap-4 bg-[#121212] p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
             <Search className="w-5 h-5 text-muted-foreground" />
             <div className="flex-1">
               <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full md:w-[300px] bg-transparent border-none text-white h-auto p-0 focus:ring-0 text-base">
                    <SelectValue placeholder="Select an Exam Set" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-white max-h-[300px]">
                    <SelectItem value="all">All Exams (Mixed)</SelectItem>
                    {examSets.map((set: any) => (
                      <SelectItem key={set.id} value={set.id}>{set.label}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
             </div>
             <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono hidden md:block">
               Filtering by Set
             </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <Card className="bg-[#0c0c0e]/80 border-white/10 backdrop-blur-sm shadow-2xl overflow-hidden min-h-[500px]">
          <CardHeader className="border-b border-white/5 py-4 px-6 bg-white/[0.02]">
            <div className="grid grid-cols-12 text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
              <div className="col-span-2 md:col-span-1 text-center">Rank</div>
              <div className="col-span-6 md:col-span-5">User</div>
              <div className="col-span-4 md:col-span-3 text-right">Score</div>
              <div className="hidden md:block col-span-3 text-right">Details</div>
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
                      <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110", getRankStyle(index))}>
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
                          {viewMode === 'global' ? `${user.exams_taken} Exams Taken` : (user.set_name || 'Proctored Exam')}
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
                      {viewMode === 'exam' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-3 h-3" />
                          {user.duration_seconds ? `${Math.floor(user.duration_seconds/60)}m ${user.duration_seconds%60}s` : '--'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.last_active).toLocaleDateString()}
                        </div>
                      )}
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
                  Be the first to complete an exam in this category to claim the throne!
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
