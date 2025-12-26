import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, ArrowLeft, CheckCircle2, Code2, 
  Terminal, Layers 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

const BRAND_COLORS = {
  outline: '#2d1d1a',
  accent: '#f39233',
  base: '#ffce8c',
  sticker: '#e0e0e0',
};

/**
 * PREMIUM LOOK HASHTAG
 * Clean, flat architectural hashtag using brand palette.
 */
const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn(
    "relative w-4 h-4 shrink-0 transition-opacity duration-300", 
    active ? "opacity-100" : "opacity-30"
  )}>
    <div className="absolute left-[30%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);

/**
 * COMPONENT: FolderIcon (Main Category)
 * Premium Sticker logic with white silhouette backing.
 */
const FolderIcon = ({ active }: { active: boolean }) => (
  <div className={cn("relative transition-all duration-300 shrink-0", active ? "scale-105" : "opacity-70 grayscale-[20%]")}>
    <div style={{ filter: `drop-shadow(2px 0 0 ${BRAND_COLORS.sticker}) drop-shadow(-2px 0 0 ${BRAND_COLORS.sticker}) drop-shadow(0 2px 0 ${BRAND_COLORS.sticker}) drop-shadow(0 -2px 0 ${BRAND_COLORS.sticker})` }}>
      <div className="relative w-7 h-5">
        <div className="absolute -top-[5px] left-0 w-[65%] h-[7px] border-[1.5px] border-b-0 rounded-t-[3px] z-10"
          style={{ backgroundColor: BRAND_COLORS.accent, borderColor: BRAND_COLORS.outline, clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }} />
        <div className="absolute inset-0 border-[1.5px] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[4px] overflow-hidden z-20"
          style={{ background: `linear-gradient(160deg, ${BRAND_COLORS.base} 0%, #f7b65d 100%)`, borderColor: BRAND_COLORS.outline }}>
          <div className="absolute top-0 left-0 w-full h-[3px] border-b-[1px]" style={{ backgroundColor: BRAND_COLORS.accent, borderColor: BRAND_COLORS.outline }} />
        </div>
      </div>
    </div>
  </div>
);

export default function PracticeArena() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id));
  }, []);

  const { data: topics = [] } = useQuery({
    queryKey: ['practice_topics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('practice_topics').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['practice_problems'],
    queryFn: async () => {
      const { data, error } = await supabase.from('practice_problems').select('*').order('order_index');
      if (error) throw error;
      return data;
    }
  });

  const { data: userSubmissions = [] } = useQuery({
    queryKey: ['user_submissions_arena', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('practice_submissions').select('problem_id, status').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const solvedProblemIds = new Set(userSubmissions.filter(s => s.status === 'completed').map(s => s.problem_id));

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty;
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    let matchesStatus = true;
    if (statusFilter === 'solved') matchesStatus = solvedProblemIds.has(p.id);
    else if (statusFilter === 'unsolved') matchesStatus = !solvedProblemIds.has(p.id);
    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  return (
    <div className="h-screen bg-[#000000] text-[#ffffff] flex flex-col font-sans overflow-hidden select-none transition-colors duration-200">
      {/* Fixed Navigation Bar */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-zinc-900 bg-[#000000] shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-extrabold text-xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
            PRACTICE<span className="text-zinc-600">ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest uppercase">
            <span className="text-zinc-500 font-normal">DASHBOARD</span>
            <span className="text-zinc-800">/</span>
            <span className="text-white font-bold">OVERVIEW</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search challenges..." 
              className="pl-10 bg-zinc-950 border-zinc-900 focus:border-zinc-500 rounded-xl text-sm h-10 font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800" />
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-10 p-6 md:p-12 max-w-[1800px] mx-auto w-full overflow-hidden">
        
        {/* LEFT COLUMN: Topic Selection (Independent Scroll) */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-hidden">
          <div className="shrink-0 space-y-4">
             <div className="text-[10px] font-bold text-zinc-500 tracking-widest px-3 uppercase">Difficulty Level</div>
             <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-xl">
               {['Easy', 'Medium', 'Hard'].map((d) => (
                 <button key={d} onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                   className={cn("py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                     filterDifficulty === d 
                       ? "bg-zinc-900 text-white shadow-md font-bold" 
                       : "text-zinc-600 hover:text-white font-normal"
                   )}>
                   {d === 'Medium' ? 'Med' : d}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <nav className="flex flex-col gap-1 pb-10">
                <div onClick={() => setSelectedTopic(null)}
                  className={cn("flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer",
                    selectedTopic === null ? "bg-zinc-900 text-white font-bold" : "text-zinc-500 hover:bg-zinc-950 font-normal"
                  )}>
                  <FolderIcon active={selectedTopic === null} />
                  <span>All Topics</span>
                </div>
                {topics.map((topic: any) => (
                  <div key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                    className={cn("flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer",
                      selectedTopic === topic.name ? "bg-zinc-900 text-white font-bold" : "text-zinc-500 hover:bg-zinc-950 font-normal"
                    )}>
                    <SubTopicHashtag active={selectedTopic === topic.name} />
                    <span>{topic.name}</span>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* MIDDLE COLUMN: REDESIGNED QUESTIONS SECTION (Independent Scroll) */}
        <main className="bg-[#0a0a0a] border border-zinc-900 rounded-lg p-8 flex flex-col shadow-2xl overflow-hidden h-full">
          <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Recommended Challenges</h2>
              <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-xl font-medium">
                Expand your algorithmic knowledge with our curated selection of coding problems.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
               {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                 <button key={f} onClick={() => setStatusFilter(f)}
                   className={cn(
                     "px-5 py-2 text-xs font-semibold rounded-full transition-all duration-200 border", 
                     statusFilter === f 
                       ? "bg-white text-black border-white shadow-sm" 
                       : "bg-zinc-950 text-zinc-500 border-zinc-900 hover:border-zinc-700 hover:text-white font-normal"
                   )}>
                   {f.charAt(0).toUpperCase() + f.slice(1)}
                 </button>
               ))}
            </div>
          </div>

          <ScrollArea className="flex-1 -mr-2 pr-4">
            <div className="flex flex-col gap-4 pb-10">
              {isLoading ? (
                [1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-900/30 border border-zinc-800 rounded-lg animate-pulse" />)
              ) : (
                filteredProblems.map((problem) => (
                  <div key={problem.id} onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                    className="group bg-zinc-950/30 border border-zinc-900 hover:border-zinc-600 rounded-lg p-4 transition-all duration-300 cursor-pointer">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5 w-full md:w-auto flex-grow">
                        {/* Status Icon Wrapper */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                          {problem.tags?.includes('Arrays') ? <Layers size={24} /> : <Terminal size={24} />}
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-bold text-white group-hover:text-zinc-400 transition-colors tracking-tight">{problem.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 font-sans">
                            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700 tracking-wider uppercase">
                              {problem.tags?.[0] || 'General'}
                            </span>
                            <span className={cn(
                              "flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded border tracking-wider uppercase",
                              problem.difficulty === 'Easy' ? "text-emerald-500 bg-emerald-950/20 border-emerald-900/30" :
                              problem.difficulty === 'Medium' ? "text-amber-500 bg-amber-950/20 border-amber-900/30" :
                              "text-rose-500 bg-rose-950/20 border-rose-900/30"
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                problem.difficulty === 'Easy' ? "bg-emerald-500" :
                                problem.difficulty === 'Medium' ? "bg-amber-500" : "bg-rose-500"
                              )} />
                              {problem.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full md:w-auto md:gap-10 pl-1 md:pl-0 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-900">
                        <div className="flex items-center gap-10">
                          <div className="flex flex-col md:items-end min-w-[100px] text-right">
                            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-0.5">Acceptance</p>
                            <span className="text-base font-bold text-white">{problem.acceptance_rate || 0}%</span>
                          </div>
                          <button className="px-6 py-2.5 bg-white text-black rounded-lg text-sm font-bold shadow-md hover:bg-zinc-200 transition-all duration-200 transform active:scale-95">
                            Solve
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </main>

        {/* RIGHT COLUMN: Analytics & Fixed Activity */}
        <aside className="hidden lg:flex flex-col gap-12 shrink-0 h-full overflow-hidden">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-zinc-500 tracking-widest px-1 uppercase">User Analytics</div>
            <UserStatsCard userId={userId} />
          </div>
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-zinc-500 tracking-widest px-1 uppercase">Activity Record</div>
            <ActivityCalendar userId={userId} />
          </div>
        </aside>

      </div>
    </div>
  );
}
