import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, Medal, Calendar, History, Flame, Clock, Target, 
  TrendingUp, Crown, Star, ChevronUp, Search, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header'; 
import { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  problems_solved: number;
  total_score: number;
  total_submissions: number;
  current_streak: number;
  longest_streak: number;
  time_spent_minutes: number;
  last_active: string;
}

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState<'all_time' | 'this_month' | 'this_week'>('all_time');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['practice_leaderboard', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_practice_leaderboard', {
        p_timeframe: timeframe,
        p_limit: 50
      });
      if (error) return [];
      return (data || []) as LeaderboardEntry[];
    },
  });

  const currentUserRank = session?.user?.id 
    ? leaderboardData.findIndex(u => u.user_id === session.user.id) + 1
    : 0;

  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const PodiumCard = ({ user, rank }: { user: LeaderboardEntry; rank: number }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: rank * 0.1 }}
        className={cn(
          "relative flex flex-col items-center",
          isFirst ? "order-2 -mt-12 z-20 scale-110" : isSecond ? "order-1 z-10" : "order-3 z-10"
        )}
      >
        {/* Crown for #1 */}
        {isFirst && (
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute -top-16 text-yellow-500"
          >
            <Crown className="w-12 h-12 fill-yellow-500 shadow-glow-gold" />
          </motion.div>
        )}

        <div className="relative group cursor-pointer">
          {/* Glowing Ring */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity",
            isFirst ? "bg-yellow-500" : isSecond ? "bg-gray-300" : "bg-amber-700"
          )} />
          
          <Link to={user.username ? `/u/${user.username}` : '#'}>
            <Avatar className={cn(
              "border-4 transition-transform duration-500 group-hover:scale-105",
              isFirst ? "w-32 h-32 border-yellow-500" : isSecond ? "w-24 h-24 border-gray-300" : "w-24 h-24 border-amber-700"
            )}>
              <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
              <AvatarFallback className="bg-black text-white text-xl font-bold">{user.full_name?.slice(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          
          {/* Rank Badge */}
          <div className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border shadow-lg flex items-center gap-1",
            isFirst ? "bg-yellow-500 text-black border-yellow-400" : isSecond ? "bg-gray-300 text-black border-gray-200" : "bg-amber-700 text-white border-amber-600"
          )}>
            <span>#{rank}</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-1">
          <Link to={user.username ? `/u/${user.username}` : '#'} className="block text-white font-bold text-lg hover:text-primary transition-colors">
            {user.full_name}
          </Link>
          <div className="text-primary font-mono text-xl font-bold tracking-tight">
            {user.total_score.toLocaleString()} <span className="text-xs text-muted-foreground ml-1">XP</span>
          </div>
          
          {/* Mini Stats for Podium */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-white/5 px-2 py-1 rounded-full">
               <Target className="w-3 h-3" /> {user.problems_solved}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 bg-white/5 px-2 py-1 rounded-full">
               <Flame className="w-3 h-3 text-orange-500" /> {user.current_streak}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30 relative overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />
      
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse opacity-40" />
        <div className="absolute bottom-[0%] right-[0%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-5xl pt-24 pb-20">
        
        {/* Header Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Official Rankings</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">
            Hall of Legends
          </h1>
          
          {/* Timeframe Toggles */}
          <div className="flex justify-center mt-8">
            <div className="p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-xl flex gap-1">
              {[
                { id: 'all_time', label: 'All Time', icon: History },
                { id: 'this_month', label: 'Monthly', icon: Calendar },
                { id: 'this_week', label: 'Weekly', icon: Zap }
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={cn(
                    "relative px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300",
                    timeframe === tf.id 
                      ? "text-black" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  {timeframe === tf.id && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tf.icon className={cn("w-3.5 h-3.5", timeframe === tf.id ? "text-black" : "text-current")} />
                    {tf.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- TOP 3 PODIUM --- */}
        {!isLoading && leaderboardData.length > 0 && (
          <div className="flex justify-center items-end gap-4 md:gap-12 mb-20 min-h-[300px]">
            {top3.length >= 2 && <PodiumCard user={top3[1]} rank={2} />}
            {top3.length >= 1 && <PodiumCard user={top3[0]} rank={1} />}
            {top3.length >= 3 && <PodiumCard user={top3[2]} rank={3} />}
          </div>
        )}

        {/* --- MAIN LIST --- */}
        <div className="space-y-4">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-b border-white/5">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5 md:col-span-4">Agent</div>
            <div className="col-span-3 text-center hidden md:block">Stats</div>
            <div className="col-span-3 md:col-span-2 text-right">Score</div>
            <div className="col-span-2 hidden md:block text-right">Activity</div>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
               [1,2,3,4,5].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-xl animate-pulse" />)
            ) : rest.length > 0 ? (
              rest.map((user, idx) => {
                const rank = idx + 4;
                const isCurrentUser = session?.user?.id === user.user_id;

                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group relative grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl border border-white/5 bg-[#0c0c0e]/50 hover:bg-[#0c0c0e] hover:border-white/10 transition-all duration-300",
                      isCurrentUser && "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                    )}
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none rounded-xl" />

                    {/* Rank */}
                    <div className="col-span-1 font-mono font-bold text-zinc-500 group-hover:text-white transition-colors">
                      #{rank}
                    </div>

                    {/* Agent Info */}
                    <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                      <Link to={user.username ? `/u/${user.username}` : '#'}>
                        <Avatar className="w-10 h-10 border border-white/10 group-hover:border-primary/50 transition-colors">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback className="bg-zinc-800 text-xs">{user.full_name?.slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0">
                         <div className="font-bold text-sm text-zinc-200 group-hover:text-white truncate flex items-center gap-2">
                           {user.full_name}
                           {isCurrentUser && <span className="text-[9px] bg-primary text-black px-1.5 rounded font-bold">YOU</span>}
                         </div>
                         <div className="text-[10px] text-zinc-500 font-mono truncate">@{user.username || 'user'}</div>
                      </div>
                    </div>

                    {/* Detailed Stats (Desktop) */}
                    <div className="col-span-3 hidden md:flex items-center justify-center gap-6">
                       <div className="flex items-center gap-1.5 text-xs text-zinc-400" title="Solved">
                          <Target className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-mono">{user.problems_solved}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-zinc-400" title="Streak">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <span className="font-mono">{user.current_streak}</span>
                       </div>
                    </div>

                    {/* Score */}
                    <div className="col-span-3 md:col-span-2 text-right">
                       <div className="font-mono font-bold text-primary text-sm md:text-base group-hover:scale-110 transition-transform origin-right">
                         {user.total_score.toLocaleString()}
                       </div>
                    </div>

                    {/* Activity (Desktop) */}
                    <div className="col-span-2 hidden md:block text-right">
                      <div className="text-xs text-zinc-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeSpent(user.time_spent_minutes)}
                      </div>
                    </div>

                    {/* Mobile Only Stats */}
                    <div className="col-span-3 md:hidden flex flex-col items-end gap-1 text-[10px] text-zinc-500">
                       <div className="flex items-center gap-1"><Target className="w-3 h-3 text-emerald-500"/> {user.problems_solved}</div>
                       <div className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500"/> {user.current_streak}</div>
                    </div>

                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5/30">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-zinc-600" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-1">No Legends Yet</h3>
                 <p className="text-zinc-500 text-sm">Be the first to claim the throne.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Current User Floating Action (If not in top view) */}
        {session && currentUserRank > 3 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-[#1a1a1c] border border-primary/30 shadow-[0_0_50px_-10px_rgba(var(--primary),0.3)] rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 text-primary font-bold">
                    #{currentUserRank}
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Your Rank</div>
                    <div className="text-sm font-bold text-white">Keep Pushing!</div>
                  </div>
               </div>
               <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <ChevronUp className="w-4 h-4 mr-2" /> Top
               </Button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
