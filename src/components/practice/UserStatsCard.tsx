import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Maximize2, X } from 'lucide-react';
import { 
  ResponsiveContainer, Tooltip, AreaChart, Area,
  LineChart, Line, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { cn } from '@/lib/utils';

interface UserStatsCardProps {
  userId: string | undefined;
}

export function UserStatsCard({ userId }: UserStatsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user_stats_silver', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Fetch completed submissions
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('problem_id, status, score, submitted_at, practice_problems(difficulty)')
        .eq('user_id', userId)
        .eq('status', 'completed');

      // 2. Fetch total problem counts
      const { data: allProblems } = await supabase
        .from('practice_problems')
        .select('difficulty');

      // 3. Process Difficulty Stats
      const difficultyStats = {
        Easy: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Easy').length || 0 },
        Medium: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Medium').length || 0 },
        Hard: { solved: 0, total: allProblems?.filter(p => p.difficulty === 'Hard').length || 0 },
      };

      submissions?.forEach((s: any) => {
        const diff = s.practice_problems?.difficulty as keyof typeof difficultyStats;
        if (diff) difficultyStats[diff].solved++;
      });

      // 4. Sparkline Data (Last 7 Days)
      const sparklineData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const count = submissions?.filter(s => s.submitted_at?.startsWith(dateStr)).length || 0;
        return { day: dateStr, count };
      });

      // 5. Full History Data for Modal
      const historyMap = submissions?.reduce((acc: any, curr: any) => {
        const date = curr.submitted_at?.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const historyData = Object.keys(historyMap || {})
        .sort()
        .map(date => ({ date, count: historyMap[date] }));

      // 6. Streak & Points
      const { data: streak } = await supabase.from('practice_streaks').select('current_streak').eq('user_id', userId).maybeSingle();
      const points = submissions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;

      return {
        solved: submissions?.length || 0,
        points,
        streak: streak?.current_streak || 0,
        difficulty: difficultyStats,
        sparkline: sparklineData,
        history: historyData
      };
    },
    enabled: !!userId,
  });

  if (isLoading || !stats) return <div className="h-[500px] w-full animate-pulse bg-[#0c0c0c] rounded-[32px] border border-[#1a1a1a]" />;

  return (
    <>
      {/* Italian Silver Professional Card */}
      <div className="relative w-full bg-[#0c0c0c] border border-[#1a1a1a] rounded-[32px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden font-sans">
        
        {/* Subtle Silver Top-Lighting Effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif font-medium text-[1.1rem] tracking-[1.5px] text-[#555555] uppercase">
            Activity Profile
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[#555555] hover:text-white transition-colors"
          >
            <Maximize2 size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Hero Section: Big Number & Sparkline */}
        <div className="flex justify-between items-end gap-5 mb-10">
          <div className="flex flex-col">
            <span className="text-[5.5rem] font-thin leading-[0.8] tracking-[-4px] bg-gradient-to-b from-white to-[#999999] bg-clip-text text-transparent select-none">
              {stats.solved}
            </span>
            <span className="font-serif italic text-[1.3rem] text-[#555555] mt-1 pl-1">
              Solved
            </span>
          </div>

          <div className="flex-grow h-[80px] pb-2 relative flex items-end opacity-80 hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sparkline}>
                <defs>
                  <linearGradient id="silverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.2)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ffffff" 
                  strokeWidth={2} 
                  fill="url(#silverGrad)" 
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Grid - Silver Style */}
        <div className="grid grid-cols-3 gap-3 mb-9">
          {['Easy', 'Medium', 'Hard'].map((label) => {
            const d = label as keyof typeof stats.difficulty;
            return (
              <div key={label} className="bg-white/[0.02] border border-[#1a1a1a] rounded-[20px] py-6 px-3 text-center transition-all duration-300 hover:bg-white/[0.05] hover:border-[#444] hover:-translate-y-1">
                <span className="block text-[0.65rem] text-[#555555] uppercase tracking-[2px] font-semibold mb-3">
                  {label}
                </span>
                <div className="text-[2.2rem] font-light text-white leading-none">
                  {stats.difficulty[d].solved}
                  <small className="text-[#333] text-[1rem] font-normal">/{stats.difficulty[d].total}</small>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Metrics */}
        <div className="flex justify-between items-center pt-8 border-t border-[#1a1a1a]">
          <div className="flex flex-col">
            <span className="text-[0.6rem] tracking-[2px] text-[#555555] uppercase mb-2">Streak</span>
            <span className="text-[1.6rem] font-normal text-white">{stats.streak}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.6rem] tracking-[2px] text-[#555555] uppercase mb-2">Points</span>
            <span className="text-[1.6rem] font-normal text-white">{stats.points}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[0.6rem] tracking-[2px] text-[#555555] uppercase mb-2">World Rank</span>
            <span className="font-serif font-semibold italic text-[1.8rem] bg-gradient-to-b from-white to-[#999999] bg-clip-text text-transparent">
              Top 5%
            </span>
          </div>
        </div>
      </div>

      {/* Full Screen History Modal - Silver Theme */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex justify-center items-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="w-full max-w-[1000px] bg-[#0c0c0c] border border-[#1a1a1a] rounded-[32px] p-8 md:p-12 relative shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="font-serif text-[2.5rem] text-white leading-tight">Performance History</h1>
                <p className="text-[#555555] mt-2 font-serif italic text-lg">A detailed view of your algorithmic journey.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#555555] hover:text-white transition-colors p-2"
              >
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#555555', fontSize: 11, fontFamily: 'Inter' }} 
                    minTickGap={30}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#555555', fontSize: 11, fontFamily: 'Inter' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ffffff" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#0c0c0c', stroke: '#fff', strokeWidth: 2 }} 
                    activeDot={{ r: 6, fill: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
