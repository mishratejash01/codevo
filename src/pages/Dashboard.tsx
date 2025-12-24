import { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ActiveEvents } from '@/components/dashboard/ActiveEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SkillsCloud } from '@/components/dashboard/SkillsCloud';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Code2, GraduationCap, Trophy, 
  Settings, Bell, Search, User, TrendingUp, Users 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- BUSINESS LOGIC: AUTHENTICATION ---
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

  // --- DATA FETCHING: PROFILE & STATS (PRESERVED) ---
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

  // --- ANALYTICS: COMPARISON DATA (NEW UI COMPONENT LOGIC) ---
  const { data: leaderboardData } = useQuery({
    queryKey: ['dashboard_leaderboard_compare'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_practice_leaderboard', { p_timeframe: 'all_time', p_limit: 5 });
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

  if (sessionLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-blue-500">Loading Intelligence...</div>;

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 antialiased font-sans">
      {/* SIDEBAR: Matches Unstop Panel */}
      <aside className="w-64 border-r border-white/5 bg-[#09090b] hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="text-white font-bold text-2xl tracking-tighter flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">C</div>
            CODEVO
          </div>
          <nav className="mt-10 space-y-2">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, active: true, path: '/dashboard' },
              { label: 'Practice Arena', icon: Code2, path: '/practice-arena' },
              { label: 'IITM Exams', icon: GraduationCap, path: '/degree' },
              { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
            ].map((item) => (
              <Link 
                key={item.label} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-blue-600/10 text-blue-400 font-semibold border-l-2 border-blue-500' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
              >
                <item.icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5 text-zinc-600">
          <div className="flex items-center gap-3 hover:text-white cursor-pointer transition-all">
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main className="flex-1 overflow-y-auto">
        {/* TOP NAVBAR */}
        <header className="h-20 border-b border-white/5 bg-[#050505]/50 backdrop-blur-2xl flex items-center justify-between px-10 sticky top-0 z-50">
          <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-full px-5 py-2 w-96">
            <Search size={16} className="text-zinc-500" />
            <input type="text" placeholder="Search analytics..." className="bg-transparent border-none text-sm focus:ring-0 w-full" />
          </div>
          <div className="flex items-center gap-8">
            <Bell size={20} className="text-zinc-500 hover:text-blue-400 cursor-pointer" />
            <div className="flex items-center gap-4 pl-8 border-l border-white/10">
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-tight">{profile?.full_name || 'Coder'}</p>
                <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">{totalPoints} Points</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px]">
                <div className="h-full w-full bg-zinc-900 rounded-[15px] flex items-center justify-center font-bold text-blue-400">
                  {profile?.full_name?.[0]}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="p-10 max-w-[1600px] mx-auto space-y-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Welcome Back, {profile?.full_name?.split(' ')[0]} 👋</h1>
            <p className="text-zinc-500 mt-2">Analytical overview of your learning journey and platform performance.</p>
          </div>

          {/* KEY METRICS: Matches the 4 boxes from Unstop UI */}
          <StatsOverview
            problemsSolved={practiceStats?.totalSolved || 0}
            totalProblems={practiceStats?.totalProblems || 0}
            currentStreak={streakData?.current_streak || 0}
            totalPoints={totalPoints}
            submissionsThisMonth={0} // Logic preserved
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUMN 1: Detailed Graphs & Analytics (8 Units) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Performance Consistency (Visualized Logic) */}
              <section className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                  <TrendingUp className="text-blue-500/20 w-32 h-32 -rotate-12" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-8">
                    <TrendingUp className="text-blue-500" size={24} />
                    Consistency Heatmap
                  </h3>
                  <ActivityCalendar userId={userId} />
                </div>
              </section>

              {/* Progress Detail (Preserved Component) */}
              <ProgressCards
                practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
                examStats={{ totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
              />

              {/* Event Listings */}
              <ActiveEvents events={userEvents || []} isLoading={eventsLoading} />
            </div>

            {/* COLUMN 2: Community & Live Feed (4 Units) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Quick Actions (Organized Management) */}
              <QuickActions lastProblemSlug={recentSubmissions?.[0]?.problem_id} />

              {/* Peer Comparison Analytics (Leaderboard Data) */}
              <section className="bg-blue-600/5 border border-blue-500/20 rounded-[2rem] p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="text-blue-500" size={20} />
                    Peer Benchmarking
                  </h3>
                  <Link to="/leaderboard" className="text-xs text-blue-400 hover:underline">View All</Link>
                </div>
                <div className="space-y-4">
                  {leaderboardData?.slice(0, 3).map((peer, i) => (
                    <div key={peer.user_id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-600">0{i+1}</span>
                        <p className="text-sm font-medium text-zinc-300">{peer.full_name}</p>
                      </div>
                      <p className="text-sm font-bold text-blue-500">{peer.total_score}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Live Activity Feed */}
              <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />

              {/* Skill Cloud Analytics */}
              <SkillsCloud skills={[]} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
