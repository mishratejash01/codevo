import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Search, ArrowLeft, Terminal, Layers, Flame, 
  ChevronDown, Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { toast } from "sonner";

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

// --- Helper for Difficulty Styling (Italian Card Style) ---
const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return "bg-[#00ffa3]/[0.03] text-[#00ffa3] border-[#00ffa3]/20";
    case 'Medium': return "bg-[#ffce8c]/[0.03] text-[#ffce8c] border-[#ffce8c]/20";
    case 'Hard': return "bg-[#ff4d4d]/[0.03] text-[#ff4d4d] border-[#ff4d4d]/20";
    default: return "bg-[#333]/[0.1] text-zinc-500 border-zinc-700";
  }
};

// --- Premium Folder Sticker Icon ---
const TopicStickerIcon = ({ active }: { active: boolean }) => (
  <div className={cn(
    "relative w-7 h-5 transition-all duration-300 shrink-0", 
    active ? "scale-110 rotate-[-2deg] opacity-100" : "opacity-40 grayscale"
  )} 
  style={{ filter: active ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'none' }}>
    {/* Sticker Border/Outline */}
    <div className="absolute inset-[-1.5px] bg-white rounded-[4px] opacity-10 blur-[0.5px]" />
    
    {/* Folder Tab */}
    <div className="absolute top-[-4px] left-0 w-[60%] h-3 rounded-t-[4px] border-[2px] border-[#2d1d1a] z-0" 
         style={{ backgroundColor: '#f39233', clipPath: 'polygon(0 0, 80% 0, 100% 100%, 0 100%)' }} />
    
    {/* Folder Body */}
    <div className="absolute inset-0 rounded-[2px] border-[2px] border-[#2d1d1a] bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] z-10">
        <div className="w-full h-1 bg-[#f39233] border-b border-[#2d1d1a]" />
    </div>
  </div>
);

export default function PracticeArena() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const levelDropdownRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id));

    const handleClickOutside = (event: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
        setIsLevelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

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

  const { data: activeEvents = [] } = useQuery({
    queryKey: ['arena_active_events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('status', 'active').limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
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
  const attemptedProblemIds = new Set(userSubmissions.map(s => s.problem_id));

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(p.difficulty);
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    let matchesStatus = true;
    if (statusFilter === 'solved') matchesStatus = solvedProblemIds.has(p.id);
    else if (statusFilter === 'unsolved') matchesStatus = !solvedProblemIds.has(p.id);
    else if (statusFilter === 'attempted') matchesStatus = attemptedProblemIds.has(p.id) && !solvedProblemIds.has(p.id);
    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  return (
    <div className="h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans overflow-hidden select-none">
      
      {/* Navigation with CODeVO Branding */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1a1a1a] bg-[#050505] shrink-0 z-50">
        <div className="flex items-center gap-8 font-sans">
          <div className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white cursor-pointer" onClick={() => navigate('/')}>
            COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#555]">
            <span>DASHBOARD</span>
            <span>/</span>
            <span className="text-white font-bold">PRACTICE ARENA</span>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <Input 
              placeholder="Search challenges..." 
              className="pl-10 bg-[#0c0c0c] border-[#1a1a1a] focus:border-[#333] rounded-[3px] text-sm h-10 font-sans text-[#ccc] placeholder:text-[#333]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-[#555] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           <div className="w-9 h-9 rounded-full bg-[#0c0c0c] border border-[#1a1a1a]" />
        </div>
      </nav>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-6 p-4 md:p-6 w-full overflow-hidden">
        
        {/* LEFT COLUMN: Topic Sidebar with Folder Sticker Icons */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-hidden font-sans">
          <div className="flex-1 flex flex-col min-h-0 pt-2">
            <ScrollArea className="flex-1 pr-2">
              <nav className="flex flex-col gap-1 pb-10">
                <div onClick={() => setSelectedTopic(null)}
                  className={cn("flex items-center gap-4 px-3 py-3 rounded-[8px] text-sm transition-all cursor-pointer font-sans",
                    selectedTopic === null ? "bg-white/5 text-white border border-white/10" : "text-[#555] hover:text-[#999]"
                  )}>
                  <TopicStickerIcon active={selectedTopic === null} />
                  <span className="font-bold tracking-tight">All Topics</span>
                </div>
                {topics.map((topic: any) => (
                  <div key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                    className={cn("flex items-center gap-4 px-3 py-3 rounded-[8px] text-sm transition-all cursor-pointer font-sans",
                      selectedTopic === topic.name ? "bg-white/5 text-white border border-white/10" : "text-[#555] hover:text-[#999]"
                    )}>
                    <TopicStickerIcon active={selectedTopic === topic.name} />
                    <span className="font-bold tracking-tight">{topic.name}</span>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Problem List & Filters */}
        <main className="flex flex-col h-full overflow-hidden rounded-[3px]">
          <div className="shrink-0 py-4 mb-2 bg-[#050505] flex items-center justify-between">
            <div className="flex items-center gap-2">
               {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                 <button key={f} onClick={() => setStatusFilter(f)}
                   className={cn(
                     "px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans", 
                     statusFilter === f 
                       ? "bg-white text-black border-white shadow-md font-bold" 
                       : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white font-medium"
                   )}>
                   {f}
                 </button>
               ))}

               <div className="relative" ref={levelDropdownRef}>
                  <button 
                    onClick={() => setIsLevelOpen(!isLevelOpen)}
                    className={cn(
                      "px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans flex items-center gap-2",
                      selectedDifficulties.length > 0 || isLevelOpen
                        ? "bg-[#141414] text-white border-[#333]" 
                        : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white"
                    )}
                  >
                    Level <ChevronDown className={cn("w-3 h-3 transition-transform", isLevelOpen && "rotate-180")} />
                  </button>

                  {isLevelOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-[#0c0c0c] border border-[#333] rounded-[4px] shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200">
                      {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <div 
                          key={diff}
                          onClick={() => toggleDifficulty(diff)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded-[2px] cursor-pointer group"
                        >
                          <div className={cn(
                            "w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-all",
                            selectedDifficulties.includes(diff) 
                              ? "bg-white border-white" 
                              : "border-[#555] group-hover:border-[#777]"
                          )}>
                            {selectedDifficulties.includes(diff) && <Check className="w-2.5 h-2.5 text-black stroke-[4]" />}
                          </div>
                          <span className={cn(
                            "text-[10px] uppercase font-bold tracking-widest",
                            selectedDifficulties.includes(diff) ? "text-white" : "text-[#777] group-hover:text-[#ccc]"
                          )}>
                            {diff}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 pb-10 font-sans">
              {isLoading ? (
                [1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] animate-pulse" />)
              ) : (
                filteredProblems.map((problem) => (
                  <div key={problem.id} 
                    className="group relative bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] p-5 md:px-7 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:border-[#333] hover:bg-[#0f0f0f] cursor-default"
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                        {problem.tags?.includes('Arrays') ? <Layers size={20} /> : <Terminal size={20} />}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-white text-[1.1rem] font-bold tracking-[-0.01em] m-0 leading-tight group-hover:text-white transition-colors cursor-pointer" onClick={() => navigate(`/practice-arena/${problem.slug}`)}>
                          {problem.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[0.55rem] font-extrabold uppercase tracking-[1.5px] px-2.5 py-[3px] rounded-[3px] border",
                            getDifficultyStyle(problem.difficulty)
                          )}>
                            {problem.difficulty}
                          </span>
                          <span className="text-[0.55rem] font-extrabold text-[#555] bg-[#1a1a1a] border border-[#252525] uppercase tracking-[1.5px] px-2.5 py-[3px] rounded-[3px]">
                            {problem.tags?.[0] || 'GENERAL'}
                          </span>
                          {problem.is_daily && (
                            <Flame className="w-3 h-3 text-[#ff4d4d] fill-[#ff4d4d]/10 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 md:gap-10 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                      <div className="text-right">
                        <span className="block text-[0.55rem] font-bold text-[#555] uppercase tracking-[3px] mb-0.5">Acceptance</span>
                        <span className="text-[1.4rem] font-light text-white leading-none">{problem.acceptance_rate || 0}%</span>
                      </div>

                      <button 
                        onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                        className="relative bg-white text-black border border-white px-8 py-3 rounded-[3px] text-[0.65rem] font-extrabold uppercase tracking-[3px] cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-400 group/btn hover:bg-transparent hover:text-white hover:pl-10"
                      >
                        <span className="absolute left-[-20px] opacity-0 text-[1rem] transition-all duration-400 text-white group-hover/btn:left-3 group-hover/btn:opacity-100">→</span>
                        <span className="transition-all duration-400 group-hover/btn:translate-x-2">SOLVE</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </main>

        {/* RIGHT COLUMN */}
        <aside className="hidden lg:flex flex-col h-full overflow-hidden">
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col gap-6 pb-10">
              
              {!userId ? (
                <>
                  <div className="relative w-full bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] p-8 flex flex-col items-center text-center">
                     <div className="w-12 h-12 bg-[#141414] border border-[#1a1a1a] rounded-[3px] flex items-center justify-center mb-6">
                        <svg className="text-[#555]" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                     </div>
                     <h1 className="text-white text-[1rem] font-bold uppercase tracking-[2px] mb-3">Access Progress</h1>
                     <button onClick={handleGoogleLogin} className="w-full bg-white text-black py-3 rounded-[3px] text-[0.7rem] font-extrabold uppercase tracking-[2px] mt-4 hover:bg-[#e5e5e5] transition-colors flex items-center justify-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.89 2.69-6.62z" /><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33A8.99 8.99 0 0 0 9 18z" /><path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.64 9c0-.59.1-1.17.28-1.71V4.96H.95a8.99 8.99 0 0 0 0 8.08l3.01-2.33z" /><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.96 8.96 0 0 0 9 0C5.48 0 2.44 2.02.95 4.96l3.01 2.33C4.67 5.16 6.66 3.58 9 3.58z" /></svg>
                        Google
                     </button>
                  </div>
                  <div className="w-full h-[160px] bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] opacity-50" />
                </>
              ) : (
                activeEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1 font-sans">
                      <span className="text-[10px] font-bold text-[#555] tracking-widest uppercase">Ongoing Events</span>
                      <Button variant="link" onClick={() => navigate('/events')} className="h-auto p-0 text-[10px] text-[#555] hover:text-white uppercase font-bold">All</Button>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap rounded-[3px]">
                      <div className="flex gap-4 pb-4 snap-x snap-mandatory font-sans">
                        {activeEvents.map((event) => (
                          <div key={event.id} className="inline-block w-[280px] bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] p-6 shrink-0 snap-center">
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight mb-2">{event.title}</h4>
                            <div className="text-[10px] text-[#555] mb-4">{new Date(event.start_date).toLocaleDateString()}</div>
                            <Button onClick={() => navigate(`/events/${event.slug}`)} className="w-full bg-[#1a1a1a] hover:bg-[#fff] hover:text-black text-white font-bold h-8 text-[9px] rounded-[3px] tracking-[2px] uppercase transition-colors">
                              Participate
                            </Button>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="h-1.5" />
                    </ScrollArea>
                  </div>
                )
              )}

              <div className="flex flex-col gap-6 font-sans">
                <UserStatsCard userId={userId} />
                <ActivityCalendar userId={userId} />
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
