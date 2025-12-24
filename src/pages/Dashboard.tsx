import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  LayoutDashboard, Code2, Trophy, GraduationCap, Settings, Bell, 
  Search, User, BarChart3, Activity, Zap, BrainCircuit, Target, 
  Flame, Calendar, MapPin, Clock, ArrowRight, Terminal, Sparkles, 
  ChevronRight, LogOut, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// --- INTERNAL COMPONENTS FOR UNIFIED DESIGN ---

const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0c0c0e]/50 backdrop-blur-xl p-6 group"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${color.replace('text-', 'bg-').replace('400', '500/10')} border border-white/5`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
        {subValue && <div className="text-xs text-zinc-400">{subValue}</div>}
      </div>
    </div>
  </motion.div>
);

const ActionCard = ({ icon: Icon, label, desc, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-[#0c0c0e]/50 hover:bg-white/5 hover:border-white/10 transition-all group text-left"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color} border border-white/5 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-zinc-200 text-sm group-hover:text-white transition-colors">{label}</div>
      <div className="text-xs text-zinc-500 truncate">{desc}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
  </button>
);

const EventCard = ({ event }: any) => (
  <div className="flex flex-col p-5 rounded-3xl border border-white/5 bg-[#0c0c0e]/30 hover:bg-[#0c0c0e]/50 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    <div className="flex justify-between items-start mb-4">
       <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] uppercase tracking-wider">
         {event.mode}
       </Badge>
       <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
         <Clock className="w-3 h-3" />
         {format(new Date(event.start_date), 'MMM dd')}
       </div>
    </div>
    <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors mb-2 line-clamp-1">{event.title}</h4>
    <div className="mt-auto flex items-center gap-2 text-xs text-zinc-500">
      <MapPin className="w-3 h-3" />
      <span className="truncate max-w-[150px]">{event.location || 'Online'}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'peers'>('overview');

  // --- DATA FETCHING ---
  // FIXED: Using returned data directly instead of setting local state inside queryFn
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
    queryKey: ['dashboard_stats', userId],
    queryFn: async () => {
      const { data: problems } = await supabase.from('practice_problems').select('id, difficulty');
      const { data: submissions } = await supabase.from('practice_submissions').select('problem_id, status').eq('user_id', userId!).eq('status', 'completed');
      
      const solvedIds = new Set(submissions?.map(s => s.problem_id) || []);
      const stats = { easy: 0, medium: 0, hard: 0, total: 0 };
      
      problems?.forEach(p => {
        if (solvedIds.has(p.id)) {
           const diff = (p.difficulty?.toLowerCase() || 'easy') as keyof typeof stats;
           if (stats[diff] !== undefined) stats[diff]++;
        }
      });
      return { ...stats, totalSolved: solvedIds.size, totalProblems: problems?.length || 0 };
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

  const { data: activeEvents = [] } = useQuery({
    queryKey: ['dashboard_events'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('*').eq('status', 'published').gte('end_date', new Date().toISOString()).limit(3);
      return data || [];
    }
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['dashboard_activity', userId],
    queryFn: async () => {
      const { data } = await supabase.from('practice_submissions').select('*, practice_problems(title, slug)').eq('user_id', userId!).order('submitted_at', { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!userId,
  });

  const totalPoints = useMemo(() => {
    if (!practiceStats) return 0;
    return (practiceStats.easy * 10) + (practiceStats.medium * 20) + (practiceStats.hard * 40);
  }, [practiceStats]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (sessionLoading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <BrainCircuit className="text-primary animate-pulse h-12 w-12" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-400 font-inter selection:bg-primary/30 overflow-hidden">
      
      {/* --- SIDEBAR NAVIGATION --- */}
      <motion.aside 
        initial={{ x: -100 }} animate={{ x: 0 }}
        className="w-20 lg:w-72 border-r border-white/5 bg-[#08080a] flex flex-col sticky top-0 h-screen z-50"
      >
        <div className="p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-12">
             <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
               <Zap size={20} fill="currentColor" />
             </div>
             <span className="text-white font-bold text-xl tracking-tighter hidden lg:block font-neuropol">
               CODEVO<span className="text-blue-500">.ID</span>
             </span>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
              { id: 'analytics', label: 'Performance', icon: Activity },
              { id: 'peers', label: 'Leaderboard', icon: Trophy },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group",
                  activeTab === item.id 
                    ? "bg-white/5 text-white shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                <item.icon size={20} className={activeTab === item.id ? "text-blue-400" : "group-hover:text-blue-400 transition-colors"} />
                <span className="text-sm font-medium hidden lg:block">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="nav_glow" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 lg:p-8 border-t border-white/5 space-y-2">
           <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
              <User size={20} />
              <span className="text-sm font-medium hidden lg:block">Profile</span>
           </button>
           <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={20} />
              <span className="text-sm font-medium hidden lg:block">Logout</span>
           </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto relative scroll-smooth">
        
        {/* Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
           <div className="absolute bottom-[0%] right-[0%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]" />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 h-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-10">
           <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full hidden md:block">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search problems, users, or events..." 
                   className="w-full bg-[#0c0c0e] border border-white/5 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
                 />
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <button className="relative text-zinc-500 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]" />
              </button>
              
              <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{profile?.full_name || 'Operative'}</div>
                    <div className="text-[10px] text-blue-400 font-mono tracking-wider">LVL {Math.floor(totalPoints / 1000) + 1}</div>
                 </div>
                 <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{profile?.full_name?.[0]}</AvatarFallback>
                 </Avatar>
              </div>
           </div>
        </header>

        <div className="p-6 lg:p-10 relative z-10 max-w-[1600px] mx-auto space-y-10">
           
           {/* Welcome Section */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                 <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase font-neuropol">
                   Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{profile?.full_name?.split(' ')[0]}</span>
                 </h1>
                 <p className="text-zinc-500 mt-2 flex items-center gap-2 text-sm">
                   <Shield className="w-4 h-4 text-emerald-500" /> System Operational. Ready for deployment.
                 </p>
              </div>
              <div className="flex gap-2">
                 <Button onClick={() => navigate('/practice-arena')} className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-6">
                   <Target className="w-4 h-4 mr-2" /> Resume Training
                 </Button>
              </div>
           </motion.div>

           {/* Stats Grid */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
           >
              <StatCard 
                label="Total XP" 
                value={totalPoints.toLocaleString()} 
                icon={Trophy} 
                color="text-yellow-400" 
                subValue="Top 5% of users"
              />
              <StatCard 
                label="Problems Solved" 
                value={practiceStats?.totalSolved || 0} 
                icon={Code2} 
                color="text-emerald-400" 
                subValue={`${practiceStats?.totalProblems || 0} Available`}
              />
              <StatCard 
                label="Day Streak" 
                value={streakData?.current_streak || 0} 
                icon={Flame} 
                color="text-orange-400" 
                subValue="Keep it burning!"
              />
              <StatCard 
                label="Global Rank" 
                value="#42" 
                icon={BarChart3} 
                color="text-blue-400" 
                subValue="+3 positions this week"
              />
           </motion.div>

           {/* Bento Grid Layout */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Left Column (Activity & Events) */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="lg:col-span-8 space-y-6"
              >
                 {/* Activity Graph */}
                 <div className="rounded-[2.5rem] border border-white/5 bg-[#0c0c0e]/30 p-8 backdrop-blur-md relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <Activity className="w-5 h-5 text-blue-500" /> Neural Activity
                       </h3>
                       <Badge variant="outline" className="border-white/10 text-zinc-400 bg-white/5">Last 365 Days</Badge>
                    </div>
                    <div className="relative z-10">
                       <ActivityCalendar userId={userId} />
                    </div>
                 </div>

                 {/* Active Operations (Events) */}
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-blue-900/10 to-transparent flex flex-col justify-center">
                       <h3 className="text-xl font-bold text-white mb-2">Active Protocols</h3>
                       <p className="text-zinc-500 text-sm mb-6">Upcoming hackathons and competitive events requiring your attention.</p>
                       <Button variant="outline" onClick={() => navigate('/events')} className="w-fit rounded-full border-white/10 hover:bg-white/10 hover:text-white">
                         View All Events
                       </Button>
                    </div>
                    <div className="space-y-3">
                       {activeEvents.length > 0 ? (
                         activeEvents.map((event: any) => <EventCard key={event.id} event={event} />)
                       ) : (
                         <div className="h-full rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-center">
                            <Calendar className="w-8 h-8 text-zinc-600 mb-2" />
                            <p className="text-sm text-zinc-500">No active events found.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </motion.div>

              {/* Right Column (Quick Actions & History) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="lg:col-span-4 space-y-6"
              >
                 {/* Quick Access */}
                 <div className="rounded-[2rem] border border-white/5 bg-[#0c0c0e]/50 p-6 backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-purple-500" /> Command Shortcuts
                    </h3>
                    <div className="space-y-3">
                       <ActionCard 
                         icon={Code2} label="Practice Arena" desc="Solve algorithmic challenges" 
                         color="bg-emerald-500/10 text-emerald-500" 
                         onClick={() => navigate('/practice-arena')} 
                       />
                       <ActionCard 
                         icon={GraduationCap} label="Degree Exams" desc="IITM academic preparation" 
                         color="bg-blue-500/10 text-blue-500" 
                         onClick={() => navigate('/degree')} 
                       />
                       <ActionCard 
                         icon={Terminal} label="Web Compiler" desc="Run code in 40+ languages" 
                         color="bg-purple-500/10 text-purple-500" 
                         onClick={() => navigate('/compiler')} 
                       />
                    </div>
                 </div>

                 {/* Recent Activity Feed */}
                 <div className="rounded-[2rem] border border-white/5 bg-[#0c0c0e]/30 p-6">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Recent Transmissions</h3>
                    <ScrollArea className="h-[300px] pr-4">
                       <div className="space-y-4">
                          {recentActivity.map((sub: any) => (
                             <div key={sub.id} className="flex gap-4 group">
                                <div className={cn(
                                  "w-2 h-2 mt-2 rounded-full ring-4 ring-black",
                                  sub.status === 'completed' ? "bg-emerald-500" : "bg-red-500"
                                )} />
                                <div className="pb-4 border-b border-white/5 w-full">
                                   <div className="flex justify-between items-start">
                                      <div className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                                        {sub.practice_problems?.title || 'Unknown Problem'}
                                      </div>
                                      <div className="text-[10px] text-zinc-600 font-mono">
                                        {format(new Date(sub.submitted_at), 'HH:mm')}
                                      </div>
                                   </div>
                                   <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/5 text-zinc-400 border-transparent">
                                        {sub.language}
                                      </Badge>
                                      <span>•</span>
                                      <span className={sub.status === 'completed' ? "text-emerald-500/70" : "text-red-500/70"}>
                                        {sub.status === 'completed' ? 'Success' : 'Failed'}
                                      </span>
                                   </div>
                                </div>
                             </div>
                          ))}
                          {recentActivity.length === 0 && (
                             <div className="text-center py-10 text-zinc-600 text-sm">No recent activity detected.</div>
                          )}
                       </div>
                    </ScrollArea>
                 </div>
              </motion.div>

           </div>
        </div>
      </main>
    </div>
  );
}
