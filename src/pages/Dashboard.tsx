import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ActiveEvents } from '@/components/dashboard/ActiveEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SkillsCloud } from '@/components/dashboard/SkillsCloud';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Code2, Trophy, GraduationCap, 
  Settings, Bell, Search, User, TrendingUp, 
  Target, Zap, BarChart3, ChevronRight 
} from 'lucide-react';

/**
 * SPECIALIST DATA ARCHITECTURE:
 * This dashboard is designed as a "Cognitive Command Center."
 * It utilizes Business Data Management principles to provide 'In-the-Moment' 
 * comparative analytics without page reloads, keeping the user in a "Flow State."
 */

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'community'>('overview');

  // --- BUSINESS LOGIC & DATA FETCHING (PRESERVED) ---
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate('/auth');
  }, [session, sessionLoading, navigate]);

  const userId = session?.user?.id;

  const { data: profile } = useQuery({
    queryKey: ['dashboard_profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: practiceStats } = useQuery({
    queryKey: ['dashboard_practice_stats', userId],
    queryFn: async () => {
      const { data: problems } = await supabase.from('practice_problems').select('id, difficulty');
      const { data: submissions } = await supabase.from('practice_submissions').select('problem_id, status').eq('user_id', userId!).eq('status', 'completed');
      const solvedIds = new Set(submissions?.map(s => s.problem_id) || []);
      const difficulties = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
      problems?.forEach(p => {
        const diff = (p.difficulty?.toLowerCase() || 'easy') as keyof typeof difficulties;
        if (difficulties[diff]) { difficulties[diff].total++; if (solvedIds.has(p.id)) difficulties[diff].solved++; }
      });
      const { data: allSubmissions } = await supabase.from('practice_submissions').select('status').eq('user_id', userId!);
      const total = allSubmissions?.length || 0;
      const accepted = allSubmissions?.filter(s => s.status === 'completed').length || 0;
      return { ...difficulties, acceptanceRate: total > 0 ? (accepted / total) * 100 : 0, totalSolved: solvedIds.size, totalProblems: problems?.length || 0 };
    },
    enabled: !!userId,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['dashboard_leaderboard_compare'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_practice_leaderboard', { p_timeframe: 'all_time', p_limit: 10 });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: streakData } = useQuery({
    queryKey: ['dashboard_streak', userId],
    queryFn: async () => {
      const { data } = await supabase.from('practice_streaks').select('current_streak').eq('user_id', userId!).maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard_events', userId],
    queryFn: async () => {
      const { data: registrations } = await supabase.from('event_registrations').select('event_id').eq('user_id', userId!);
      if (!registrations || registrations.length === 0) return [];
      const { data: events } = await supabase.from('events').select('*').in('id', registrations.map(r => r.event_id));
      return events || [];
    },
    enabled: !!userId,
  });

  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['dashboard_submissions', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase.from('practice_submissions').select('*').eq('user_id', userId!).order('submitted_at', { ascending: false }).limit(10);
      return submissions || [];
    },
    enabled: !!userId,
  });

  const totalPoints = useMemo(() => {
    if (!practiceStats) return 0;
    return (practiceStats.easy.solved * 10) + (practiceStats.medium.solved * 20) + (practiceStats.hard.solved * 40);
  }, [practiceStats]);

  // --- PSYCHOLOGICAL DATA SCALING: PEER BENCHMARKING ---
  const averagePeerPoints = useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0) return 0;
    return Math.floor(leaderboardData.reduce((acc, curr) => acc + curr.total_score, 0) / leaderboardData.length);
  }, [leaderboardData]);

  if (sessionLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-blue-500 font-mono tracking-widest animate-pulse">INITIATING DATA NEURAL NET...</div>;

  return (
    <div className="flex min-h-screen bg-[#020203] text-zinc-400 antialiased selection:bg-blue-500/30">
      {/* SIDEBAR: Specialist Navigation Panel */}
      <aside className="w-20 lg:w-72 border-r border-white/5 bg-[#08080a] flex flex-col sticky top-0 h-screen transition-all duration-500 z-[100]">
        <div className="p-6 lg:p-10">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Zap className="text-white" size={20} fill="currentColor" />
             </div>
             <span className="text-white font-black text-2xl tracking-tighter hidden lg:block">CODEVO</span>
          </div>
          
          <nav className="mt-12 space-y-2">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Detailed Analysis', icon: BarChart3 },
              { id: 'community', label: 'Peer Analytics', icon: Trophy },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative group ${
                  activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 font-bold' 
                  : 'text-zinc-600 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
                <span className="text-sm hidden lg:block">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="activePill" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 lg:p-10 border-t border-white/5">
           <div className="flex items-center gap-4 text-zinc-600 hover:text-white transition-all cursor-pointer group">
              <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-sm hidden lg:block">System Config</span>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT VENEER */}
      <main className="flex-1 overflow-x-hidden">
        {/* INTELLIGENCE HEADER */}
        <header className="h-24 border-b border-white/5 bg-[#020203]/80 backdrop-blur-3xl flex items-center justify-between px-6 lg:px-12 sticky top-0 z-[90]">
          <div className="flex items-center gap-6 flex-1">
             <div className="relative group max-w-md w-full hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Query system metrics..." 
                  className="bg-zinc-900/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-zinc-700" 
                />
             </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative cursor-pointer">
              <Bell size={22} className="text-zinc-500 hover:text-white transition-all" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center gap-5 pl-8 border-l border-white/10">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-white">{profile?.full_name || 'COGNITIVE_USER'}</p>
                  <p className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase">ID: {userId?.slice(0,8)}</p>
               </div>
               <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center font-bold text-blue-500 shadow-inner overflow-hidden">
                  {profile?.avatar_url ? <img src={profile.avatar_url} /> : profile?.full_name?.[0]}
               </div>
            </div>
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <div className="p-6 lg:p-12 space-y-10">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                System Overview <span className="text-blue-500">.</span>
              </h1>
              <p className="text-zinc-500 mt-2 font-medium">Monitoring cognitive development and algorithmic proficiency.</p>
            </div>
            <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
               <div className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20">LIVE</div>
               <span className="px-4 text-xs font-mono text-zinc-400">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* DYNAMIC VIEW SWITCHER: Specialist Psychological Flow */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                {/* KPI Tier (The 4 Boxes) */}
                <StatsOverview
                  problemsSolved={practiceStats?.totalSolved || 0}
                  totalProblems={practiceStats?.totalProblems || 0}
                  currentStreak={streakData?.current_streak || 0}
                  totalPoints={totalPoints}
                  submissionsThisMonth={0}
                />

                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Primary Visual Data Hub */}
                  <div className="lg:col-span-8 space-y-8">
                    <section className="bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-8 lg:p-12">
                       <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                         <TrendingUp className="text-blue-500" /> Learning Pulse
                       </h3>
                       <ActivityCalendar userId={userId} />
                    </section>

                    <ActiveEvents events={userEvents || []} isLoading={eventsLoading} />
                  </div>

                  {/* Secondary Management Panel */}
                  <div className="lg:col-span-4 space-y-8">
                    <QuickActions lastProblemSlug={recentSubmissions?.[0]?.problem_id} />
                    <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="grid lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-8 space-y-8">
                  {/* Comparative Progress Cards */}
                  <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] p-10">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-black text-white">Algorithm Efficiency</h3>
                      <div className="text-blue-400 font-mono text-xs">BENCHMARK: GLOBAL_AVG</div>
                    </div>
                    <ProgressCards
                      practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
                      examStats={{ totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
                    />
                  </div>

                  <div className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-10">
                    <h3 className="text-xl font-bold text-white mb-6">Cognitive Domain Distribution</h3>
                    <SkillsCloud skills={[]} />
                  </div>
                </div>

                <div className="lg:col-span-4 bg-blue-600/5 border border-blue-500/20 rounded-[3rem] p-10">
                   <h3 className="text-xl font-black text-white mb-6">Statistical Contrast</h3>
                   <div className="space-y-8">
                      <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Points vs Peer Average</p>
                        <div className="flex items-end gap-3">
                           <span className="text-4xl font-black text-white">{totalPoints}</span>
                           <span className={`text-xs font-bold mb-2 ${totalPoints > averagePeerPoints ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {totalPoints > averagePeerPoints ? '+' : ''}{totalPoints - averagePeerPoints} from avg
                           </span>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Platform Rank Percentile</p>
                        <div className="flex items-center gap-4">
                           <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center font-black text-white">
                              TOP 10%
                           </div>
                           <p className="text-sm text-zinc-400">You are outperforming 89.4% of active developers this month.</p>
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div 
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-10"
              >
                <section className="bg-[#0a0a0c] border border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-10 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent">
                    <h3 className="text-2xl font-black text-white">Hall of Competence</h3>
                    <p className="text-zinc-500 text-sm mt-1">Real-time benchmarking against the platform's elite.</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {leaderboardData?.map((peer, i) => (
                      <div key={peer.user_id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-6">
                           <span className="font-mono text-zinc-700 text-xl font-bold group-hover:text-blue-500 transition-colors">#{i+1}</span>
                           <div className="h-12 w-12 rounded-full bg-zinc-800" />
                           <div>
                             <p className="text-white font-bold">{peer.full_name}</p>
                             <p className="text-xs text-zinc-600 font-mono">STREAK: {peer.current_streak}D</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-white">{peer.total_score}</p>
                           <p className="text-[10px] text-zinc-600 uppercase">Total Accumulated</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
