import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ArrowLeft, CheckCircle2, Code2 } from 'lucide-react';
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
 * EXACT COMPONENT: SubTopicHashtag
 * Derived ditto from the provided HTML/CSS design
 */
const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn("relative w-5 h-5 shrink-0 transition-opacity", active ? "opacity-100" : "opacity-40")}>
    <div className="relative w-full h-full scale-[0.25] origin-top-left">
      {/* Integrated Marker */}
      <div 
        className="absolute top-[2px] left-[20px] w-[25px] h-[8px] border-[3px] border-b-0 rounded-t-[4px] z-0" 
        style={{ 
          backgroundColor: BRAND_COLORS.accent, 
          borderColor: BRAND_COLORS.outline,
          clipPath: 'polygon(0 0, 70% 0, 100% 100%, 0 100%)' 
        }} 
      />
      {/* Horizontal Bars */}
      <div 
        className="absolute w-full h-[14px] border-[3px] rounded-[4px] z-[2] top-[20px]" 
        style={{ backgroundColor: BRAND_COLORS.base, borderColor: BRAND_COLORS.outline }} 
      />
      <div 
        className="absolute w-full h-[14px] border-[3px] rounded-[4px] z-[2] bottom-[20px]" 
        style={{ backgroundColor: BRAND_COLORS.base, borderColor: BRAND_COLORS.outline }} 
      />
      {/* Vertical Bars */}
      <div 
        className="absolute h-full w-[14px] border-[3px] rounded-[4px] z-[1] left-[20px]" 
        style={{ backgroundColor: BRAND_COLORS.accent, borderColor: BRAND_COLORS.outline }} 
      />
      <div 
        className="absolute h-full w-[14px] border-[3px] rounded-[4px] z-[1] right-[20px]" 
        style={{ backgroundColor: BRAND_COLORS.accent, borderColor: BRAND_COLORS.outline }} 
      />
    </div>
  </div>
);

/**
 * COMPONENT: FolderIcon (Main Category)
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
    queryKey: ['user_submissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('practice_submissions').select('problem_id, status').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const solvedProblemIds = new Set(userSubmissions.filter(s => s.status === 'completed').map(s => s.problem_id));
  const attemptedProblemIds = new Set(userSubmissions.map(s => s.problem_id));

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty;
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    let matchesStatus = true;
    if (statusFilter === 'solved') matchesStatus = solvedProblemIds.has(p.id);
    else if (statusFilter === 'unsolved') matchesStatus = !solvedProblemIds.has(p.id);
    else if (statusFilter === 'attempted') matchesStatus = attemptedProblemIds.has(p.id) && !solvedProblemIds.has(p.id);
    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  return (
    <div className="h-screen bg-[#080808] text-[#f1f5f9] flex flex-col font-sans overflow-hidden select-none">
      {/* Navigation Layer */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1f1f1f] bg-[#080808] shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-extrabold text-xl tracking-tighter">
            PRACTICE<span className="text-blue-500">ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest uppercase">
            <span className="text-[#64748b] font-normal">DASHBOARD</span>
            <span className="text-[#1f1f1f]">/</span>
            <span className="text-white font-bold">OVERVIEW</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <Input 
              placeholder="Search challenges..." 
              className="pl-10 bg-[#111] border-[#1f1f1f] focus:border-blue-500 rounded-xl text-sm h-10 font-normal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-[#64748b] hover:text-white hover:bg-white/5 rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#333] to-[#111] border border-[#444]" />
        </div>
      </nav>

      {/* Main Grid: Left, Middle (Independent Scroll), Right (Fixed) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-10 p-6 md:p-12 max-w-[1800px] mx-auto w-full overflow-hidden">
        
        {/* LEFT COLUMN: Topic Sidebar (Independent Scroll) */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-hidden">
          <div className="shrink-0 space-y-4">
             <div className="text-[10px] font-bold text-[#64748b] tracking-widest px-3 uppercase">Difficulty Level</div>
             <div className="grid grid-cols-3 gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-xl">
               {['Easy', 'Medium', 'Hard'].map((d) => (
                 <button key={d} onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                   className={cn("py-2 text-[10px] font-bold uppercase rounded-lg transition-all",
                     filterDifficulty === d 
                       ? "bg-[#161616] text-blue-400 shadow-md" 
                       : "text-[#64748b] hover:text-white font-normal"
                   )}>
                   {d === 'Medium' ? 'Med' : d}
                 </button>
               ))}
             </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 font-sans">
              <nav className="flex flex-col gap-1 pb-10">
                <div onClick={() => setSelectedTopic(null)}
                  className={cn("flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer",
                    selectedTopic === null ? "bg-blue-500/10 text-blue-400 font-bold" : "text-[#94a3b8] hover:bg-white/5 font-normal"
                  )}>
                  <FolderIcon active={selectedTopic === null} />
                  <span>All Topics</span>
                </div>
                {topics.map((topic: any) => (
                  <div key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                    className={cn("flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all cursor-pointer",
                      selectedTopic === topic.name ? "bg-blue-500/10 text-blue-400 font-bold" : "text-[#94a3b8] hover:bg-white/5 font-normal"
                    )}>
                    <SubTopicHashtag active={selectedTopic === topic.name} /> 
                    <span>{topic.name}</span>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Main Scrollable Workspace */}
        <main className="bg-[#121212] border border-[#1f1f1f] rounded-[32px] p-8 md:p-10 flex flex-col shadow-2xl overflow-hidden h-full">
          <div className="shrink-0 flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Recommended Challenges</h2>
            <div className="flex gap-1 bg-[#111] p-1 border border-[#1f1f1f] rounded-lg">
               {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                 <button key={f} onClick={() => setStatusFilter(f)}
                   className={cn("px-3 py-1 text-[9px] font-bold uppercase rounded transition-all", 
                     statusFilter === f ? "bg-white/10 text-white shadow-sm" : "text-[#64748b] hover:text-[#94a3b8] font-normal"
                   )}>
                   {f}
                 </button>
               ))}
            </div>
          </div>

          <ScrollArea className="flex-1 -mr-2 pr-4">
            <div className="space-y-1 pb-10">
              {isLoading ? (
                <div className="space-y-4 pt-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)}
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-[#64748b]">
                   <Search className="w-10 h-10 mb-4 opacity-20" />
                   <p className="font-bold">No matches found</p>
                </div>
              ) : (
                filteredProblems.map((problem) => (
                  <div key={problem.id} onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                    className="group flex items-center justify-between py-5 border-b border-[#1e1e1e] last:border-0 hover:bg-white/[0.02] px-4 -mx-4 transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                        solvedProblemIds.has(problem.id) ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-[#1a1a1a] border-[#333] text-[#64748b]"
                      )}>
                        {solvedProblemIds.has(problem.id) ? <CheckCircle2 className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-blue-400 transition-colors tracking-tight font-sans">{problem.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] uppercase tracking-wider text-[#64748b]">
                          <span className="font-bold">#{problem.tags?.[0] || 'General'}</span>
                          <span>•</span>
                          <span className={cn("font-bold",
                            problem.difficulty === 'Easy' ? "text-emerald-400" : problem.difficulty === 'Medium' ? "text-amber-400" : "text-rose-400"
                          )}>{problem.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden md:block text-right">
                        <div className="text-[10px] text-[#64748b] font-normal uppercase tracking-tight font-sans">Acceptance</div>
                        <div className="text-sm font-bold font-mono">{problem.acceptance_rate || 0}%</div>
                      </div>
                      <button className="bg-[#1a1a1a] text-white border border-[#333] px-6 py-2 rounded-xl text-[11px] font-bold uppercase hover:bg-blue-500 hover:border-blue-500 transition-all font-sans">
                        Solve
                      </button>
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
            <div className="text-[10px] font-bold text-[#64748b] tracking-widest px-1 uppercase font-sans">User Analytics</div>
            <UserStatsCard userId={userId} />
          </div>
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-[#64748b] tracking-widest px-1 uppercase font-sans">Activity Record</div>
            <ActivityCalendar userId={userId} />
          </div>
        </aside>

      </div>
    </div>
  );
}
