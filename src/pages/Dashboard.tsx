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
// FIXED: Added User icon to imports to resolve ReferenceError
import { 
  LayoutDashboard, 
  Code2, 
  Trophy, 
  GraduationCap, 
  Settings, 
  Bell, 
  Search, 
  User, 
  BarChart3, 
  Activity,
  Zap,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'peers'>('overview');

  // --- BUSINESS LOGIC: AUTHENTICATION (PRESERVED) ---
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

  // --- DATA FETCHING (PRESERVED) ---
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

  if (sessionLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <BrainCircuit className="text-blue-500 animate-pulse h-12 w-12" />
        <span className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase">Initializing_System_Matrix</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#020202] text-zinc-400">
      {/* SIDEBAR: Specialist Navigation Panel */}
      <aside className="w-20 lg:w-72 border-r border-white/5 bg-[#08080a] flex flex-col sticky top-0 h-screen z-[100]">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
             <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
               <Zap size={22} fill="currentColor" />
             </div>
             <span className="text-white font-black text-2xl tracking-tighter hidden lg:block uppercase">Codevo</span>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Intelligence', icon: BarChart3 },
              { id: 'peers', label: 'Peer Ranking', icon: Trophy },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative ${
                  activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 font-bold' 
                  : 'text-zinc-600 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={22} />
                <span className="text-sm hidden lg:block">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="nav_pill" className="absolute right-0 w-1 h-6 bg-blue-500 rounded-l-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
           <div className="flex items-center gap-4 text-zinc-600 hover:text-white transition-all cursor-pointer">
              <Settings size={22} />
              <span className="text-sm hidden lg:block">System Configuration</span>
           </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 min-w-0">
        <header className="h-20 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-[90]">
          <div className="flex items-center gap-6 flex-1">
             <div className="relative w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input 
                  type="text" 
                  placeholder="Scan system database..." 
                  className="bg-zinc-900/40 border border-white/5 rounded-full py-2.5 pl-11 pr-5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50" 
                />
             </div>
          </div>

          <div className="flex items-center gap-8">
            <Bell size={20} className="text-zinc-500 hover:text-white cursor-pointer" />
            <div className="flex items-center gap-4 pl-8 border-l border-white/10">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-white">{profile?.full_name || 'CODER'}</p>
                  <p className="text-[10px] text-blue-500 font-mono tracking-widest">{totalPoints} PTS</p>
               </div>
               {/* FIXED: Using User icon properly imported from lucide-react */}
               <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-blue-500">
                  {profile?.full_name?.[0] || <User size={20} />}
               </div>
            </div>
          </div>
        </header>

        {/* FULL WIDTH ANALYTICS CANVAS */}
        <div className="p-10 w-full space-y-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Command Terminal</h1>
            <p className="text-zinc-500 mt-1">Real-time performance telemetry and proficiency analytics.</p>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                {/* KPI TOP ROW */}
                <StatsOverview
                  problemsSolved={practiceStats?.totalSolved || 0}
                  totalProblems={practiceStats?.totalProblems || 0}
                  currentStreak={streakData?.current_streak || 0}
                  totalPoints={totalPoints}
                  submissionsThisMonth={0}
                />

                <div className="grid lg:grid-cols-12 gap-8 w-full">
                  <div className="lg:col-span-8 space-y-8">
                    <section className="bg-zinc-900/20 border border-white/5 rounded-[2rem] p-8">
                       <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                         <Activity className="text-blue-500" size={20} /> Persistence Heatmap
                       </h3>
                       <ActivityCalendar userId={userId} />
                    </section>
                    <ActiveEvents events={[]} isLoading={false} />
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                    <QuickActions lastProblemSlug={recentSubmissions?.[0]?.problem_id} />
                    <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#08080a] border border-white/5 rounded-[3rem] p-12">
                   <div className="flex items-center justify-between mb-12">
                      <h3 className="text-2xl font-black text-white">Algorithmic Mastery</h3>
                      <div className="flex items-center gap-4">
                        <div className="text-center px-6 border-r border-white/10">
                          <p className="text-[10px] text-zinc-500 uppercase font-black">Acceptance Rate</p>
                          <p className="text-2xl font-black text-emerald-400">{practiceStats?.acceptanceRate.toFixed(1)}%</p>
                        </div>
                        <div className="text-center px-6">
                          <p className="text-[10px] text-zinc-500 uppercase font-black">Performance Percentile</p>
                          <p className="text-2xl font-black text-blue-500">TOP 12%</p>
                        </div>
                      </div>
                   </div>
                   <ProgressCards
                     practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
                     examStats={{ totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
                   />
                </div>
              </motion.div>
            )}

            {activeTab === 'peers' && (
              <motion.div key="peers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <section className="bg-zinc-900/30 border border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-10 border-b border-white/5 bg-gradient-to-r from-blue-600/5 to-transparent">
                    <h3 className="text-2xl font-black text-white">Peer Matrix</h3>
                    <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest mt-1">Cross-referencing Global Performance</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {leaderboardData?.map((peer, i) => (
                      <div key={peer.user_id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-8">
                           <span className="text-2xl font-black text-zinc-800 font-mono">#{i + 1}</span>
                           <div className="h-12 w-12 rounded-xl bg-zinc-800" />
                           <div>
                             <p className="text-white font-bold">{peer.full_name}</p>
                             <p className="text-[10px] text-zinc-600 font-mono mt-0.5 uppercase">Persistence: {peer.current_streak}D</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-black text-white">{peer.total_score.toLocaleString()}</p>
                           <p className="text-[9px] text-blue-500 uppercase font-black tracking-tighter">Points_Accumulated</p>
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
