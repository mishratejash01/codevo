import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, ChevronRight, ArrowLeft, Hash, 
  CheckCircle2, Flame, Code2, Sparkles, Star, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

export default function PracticeArena() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // LOGIC & STATE (STRICTLY UNCHANGED)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
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

  // DESIGN & LAYOUT (PROFESSIONAL REDESIGN)
  return (
    <div className="min-h-screen bg-[#080808] text-[#f1f5f9] flex flex-col font-sans">
      {/* Navigation - Professional Header Style */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1f1f1f] bg-[#080808] sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-extrabold text-xl tracking-tighter">
            PRACTICE<span className="text-[#8b5cf6]">ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
            <span>DASHBOARD</span>
            <span className="text-[#1f1f1f]">/</span>
            <span className="text-white">OVERVIEW</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <Input 
              placeholder="Search challenges..." 
              className="pl-10 bg-[#111] border-[#1f1f1f] focus:border-[#8b5cf6] transition-all rounded-xl text-sm h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-[#64748b] hover:text-white hover:bg-white/5 rounded-full">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#333] to-[#111] border border-[#444]" />
        </div>
      </nav>

      {/* Main 3-Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-10 p-6 md:p-12 max-w-[1800px] mx-auto w-full">
        
        {/* LEFT SIDEBAR: Difficulty & Topics */}
        <aside className="hidden lg:flex flex-col gap-8">
          <div className="space-y-4">
             <div className="text-[10px] font-black text-[#64748b] tracking-widest px-3">DIFFICULTY</div>
             <div className="grid grid-cols-3 gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-xl">
               {['Easy', 'Medium', 'Hard'].map((d) => (
                 <button 
                   key={d} 
                   onClick={() => setFilterDifficulty(filterDifficulty === d ? null : d)}
                   className={cn(
                     "py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all",
                     filterDifficulty === d 
                       ? d === 'Easy' ? "bg-[#161616] text-[#10b981] shadow-md" : d === 'Medium' ? "bg-[#161616] text-[#f59e0b] shadow-md" : "bg-[#161616] text-[#ef4444] shadow-md"
                       : "text-[#64748b] hover:text-white"
                   )}
                 >
                   {d === 'Medium' ? 'Med' : d}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 text-[10px] font-black text-[#64748b] tracking-widest">
              <Sparkles className="w-3 h-3" /> TOPICS
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <nav className="flex flex-col gap-1">
                <div 
                  onClick={() => setSelectedTopic(null)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-colors",
                    selectedTopic === null ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : "text-[#94a3b8] hover:bg-white/5"
                  )}
                >
                  <span className="text-lg">✦</span> All Topics
                </div>
                {topics.map((topic: any) => (
                  <div 
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.name)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer",
                      selectedTopic === topic.name ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : "text-[#94a3b8] hover:bg-white/5"
                    )}
                  >
                    <Hash className="w-4 h-4 opacity-50" /> {topic.name}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* CENTER: Workspace Container */}
        <main className="bg-[#121212] border border-[#1f1f1f] rounded-[32px] p-8 md:p-10 flex flex-col shadow-2xl overflow-hidden min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Recommended Challenges</h2>
            <div className="flex gap-1 bg-[#111] p-1 border border-[#1f1f1f] rounded-lg">
               {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                 <button 
                   key={f} 
                   onClick={() => setStatusFilter(f)}
                   className={cn(
                     "px-3 py-1 text-[9px] font-bold uppercase rounded transition-all", 
                     statusFilter === f ? "bg-white/10 text-white shadow-sm" : "text-[#64748b] hover:text-[#94a3b8]"
                   )}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-1">
            {isLoading ? (
              <div className="space-y-4 pt-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
                 <Search className="w-10 h-10 mb-4 opacity-20" />
                 <p className="font-medium">No challenges match your filters</p>
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div 
                  key={problem.id}
                  onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                  className="group flex items-center justify-between py-5 border-b border-[#1e1e1e] last:border-0 hover:bg-white/[0.02] px-4 -mx-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                      solvedProblemIds.has(problem.id) ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]" : "bg-[#1a1a1a] border-[#333] text-[#64748b]"
                    )}>
                      {solvedProblemIds.has(problem.id) ? <CheckCircle2 className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-lg group-hover:text-[#8b5cf6] transition-colors">{problem.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#64748b] font-medium uppercase tracking-wider">
                        <span>#{problem.tags?.[0] || 'General'}</span>
                        <span>•</span>
                        <span className={cn(
                          problem.difficulty === 'Easy' ? "text-[#10b981]" : problem.difficulty === 'Medium' ? "text-[#f59e0b]" : "text-[#ef4444]"
                        )}>{problem.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-tight">Acceptance</div>
                      <div className="text-sm font-mono">{problem.acceptance_rate || 0}%</div>
                    </div>
                    <button className="bg-[#1a1a1a] text-white border border-[#333] px-6 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-[#8b5cf6] hover:border-[#8b5cf6] transition-all">
                      Solve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR: Progress & Activity */}
        <aside className="hidden lg:flex flex-col gap-12">
          <section>
            <div className="text-[10px] font-black text-[#64748b] tracking-widest px-1 mb-6">YOUR PROGRESS</div>
            <UserStatsCard userId={userId} />
          </section>

          <section>
            <div className="text-[10px] font-black text-[#64748b] tracking-widest px-1 mb-4">ACTIVITY STREAK</div>
            <ActivityCalendar userId={userId} />
          </section>
          
          <div className="bg-gradient-to-br from-[#111] to-[#080808] p-6 rounded-[24px] border border-[#1f1f1f] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <div className="text-xs font-bold">Daily Challenge</div>
                <div className="text-[10px] text-[#64748b]">Earn bonus XP today</div>
              </div>
            </div>
            <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c4dff] text-white font-bold rounded-xl h-10 text-xs">Start Session</Button>
          </div>
        </aside>

      </div>
    </div>
  );
}
