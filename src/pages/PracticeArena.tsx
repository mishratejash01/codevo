import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, ArrowLeft, Layers, Flame, 
  ChevronDown, Check, User, LogOut, QrCode 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';

// Imported Separate Components
import { SubTopicIcon } from '@/components/practice/SubTopicIcon';
import { FolderSticker } from '@/components/practice/FolderSticker';

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

// Question Type Icons
const TerminalBoxIcon = () => (
  <div className="w-[42px] h-[42px] bg-[#141414] rounded-[3px] flex items-center justify-center text-[#555] border border-[#1a1a1a]">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  </div>
);

const LayersBoxIcon = () => (
  <div className="w-[42px] h-[42px] bg-[#141414] rounded-[3px] flex items-center justify-center text-[#555] border border-[#1a1a1a]">
    <Layers size={18} strokeWidth={2.5} />
  </div>
);

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return "bg-[#00ffa3]/[0.03] text-[#00ffa3] border-[#00ffa3]/20";
    case 'Medium': return "bg-[#ffce8c]/[0.03] text-[#ffce8c] border-[#ffce8c]/20";
    case 'Hard': return "bg-[#ff4d4d]/[0.03] text-[#ff4d4d] border-[#ff4d4d]/20";
    default: return "bg-[#333]/[0.1] text-zinc-500 border-zinc-700";
  }
};

export default function PracticeArena() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isLevelOpen, setIsLevelOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [userId, setUserId] = useState<string | undefined>();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [placeholderTopic, setPlaceholderTopic] = useState("Arrays");
  
  const levelDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id));
    const handleClickOutside = (event: MouseEvent) => {
      if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) setIsLevelOpen(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    const topicsArr = ["Arrays", "Dynamic Programming", "Trees", "Graphs", "Hash Maps"];
    let index = 0;
    const intervalId = setInterval(() => {
      index = (index + 1) % topicsArr.length;
      setPlaceholderTopic(topicsArr[index]);
    }, 3000);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(intervalId);
    };
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['user_profile_arena', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      return data;
    },
    enabled: !!userId
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(undefined);
    setIsProfileOpen(false);
  };

  const profileLink = profile?.username 
    ? `${window.location.origin}/u/${profile.username}` 
    : `${window.location.origin}/profile`;

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
    const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(p.difficulty);
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    let matchesStatus = true;
    if (statusFilter === 'solved') matchesStatus = solvedProblemIds.has(p.id);
    else if (statusFilter === 'unsolved') matchesStatus = !solvedProblemIds.has(p.id);
    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  return (
    <div className="h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans overflow-hidden select-none">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1a1a1a] bg-[#050505] shrink-0 z-50">
        <div className="flex items-center gap-8 font-sans">
          <div className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white cursor-pointer" onClick={() => navigate('/')}>
            COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <Input 
              placeholder={`Practice ${placeholderTopic}`}
              className="pl-10 bg-[#0c0c0c] border-[#1a1a1a] focus:border-[#333] rounded-[3px] text-sm h-10 font-sans text-[#ccc] placeholder:text-[#444] placeholder:italic transition-all duration-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 relative" ref={profileDropdownRef}>
           <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-[#555] hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5" />
           </Button>
           
           <div 
             className="w-9 h-9 rounded-full bg-[#0c0c0c] border border-[#1a1a1a] flex items-center justify-center cursor-pointer hover:border-[#333] transition-colors"
             onClick={() => setIsProfileOpen(!isProfileOpen)}
           >
             <User className="w-4 h-4 text-[#777]" />
           </div>
           
           {isProfileOpen && (
             <div className="absolute top-12 right-0 w-64 bg-[#0c0c0e] border border-white/10 rounded-[4px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
               <div className="flex flex-col gap-3">
                 <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                     {(profile?.full_name || "U").charAt(0).toUpperCase()}
                   </div>
                   <div className="flex flex-col overflow-hidden">
                     <span className="text-sm font-bold text-white uppercase tracking-wider truncate">{profile?.full_name || "User"}</span>
                     <span className="text-[10px] text-[#555] font-mono truncate">@{profile?.username || "username"}</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                   <div className="bg-white/5 rounded-[2px] p-2 text-center border border-white/5">
                     <span className="block text-[10px] text-[#555] uppercase tracking-wider">Solved</span>
                     <span className="text-white font-bold">{solvedProblemIds.size}</span>
                   </div>
                   <div className="bg-white/5 rounded-[2px] p-2 text-center border border-white/5">
                     <span className="block text-[10px] text-[#555] uppercase tracking-wider">Rank</span>
                     <span className="text-[#00ffa3] font-bold">Top 5%</span>
                   </div>
                 </div>

                 <div className="mt-1 p-3 bg-white rounded-lg flex flex-col items-center gap-2">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(profileLink)}`} 
                      alt="Profile QR"
                      className="w-24 h-24"
                    />
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3 h-3 text-black" />
                      <span className="text-[9px] text-black font-bold uppercase tracking-wider">Scan Profile Card</span>
                    </div>
                 </div>

                 {userId && (
                   <Button variant="ghost" className="w-full justify-start text-[11px] h-8 text-[#ff4d4d] hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 uppercase tracking-widest gap-2 mt-2" onClick={handleLogout}>
                     <LogOut className="w-3 h-3" /> Log Out
                   </Button>
                 )}
               </div>
             </div>
           )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-6 p-4 md:p-6 w-full overflow-hidden">
        {/* Left Sidebar: Topics */}
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-hidden font-sans">
          <div className="flex-1 flex flex-col min-h-0 pt-2">
            <ScrollArea className="flex-1 pr-2">
              <nav className="flex flex-col gap-1 pb-10">
                <div onClick={() => setSelectedTopic(null)}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-sm transition-all cursor-pointer font-sans",
                    selectedTopic === null ? "bg-[#141414] text-white border border-[#1a1a1a]" : "text-[#555] hover:text-[#999]"
                  )}>
                  <FolderSticker active={selectedTopic === null} />
                  <span className="tracking-tight">All Topics</span>
                </div>
                {topics.map((topic: any) => (
                  <div key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                    className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-sm transition-all cursor-pointer font-sans",
                      selectedTopic === topic.name ? "bg-[#141414] text-white border border-[#1a1a1a]" : "text-[#555] hover:text-[#999]"
                    )}>
                    <SubTopicIcon active={selectedTopic === topic.name} />
                    <span className="tracking-tight">{topic.name}</span>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Center Main: Problems List */}
        <main className="flex flex-col h-full overflow-hidden rounded-[3px]">
          <div className="shrink-0 py-4 mb-2 bg-[#050505] flex items-center justify-between">
            <div className="flex items-center gap-2">
               {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                 <button key={f} onClick={() => setStatusFilter(f)}
                   className={cn(
                     "px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans", 
                     statusFilter === f ? "bg-white text-black border-white shadow-md font-bold" : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white font-medium"
                   )}>{f}</button>
               ))}
               <div className="relative" ref={levelDropdownRef}>
                  <button onClick={() => setIsLevelOpen(!isLevelOpen)} className={cn("px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans flex items-center gap-2",
                      selectedDifficulties.length > 0 || isLevelOpen ? "bg-[#141414] text-white border-[#333]" : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white"
                  )}>Level <ChevronDown className={cn("w-3 h-3 transition-transform", isLevelOpen && "rotate-180")} /></button>
                  {isLevelOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-[#0c0c0c] border border-[#333] rounded-[4px] shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200">
                      {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <div key={diff} onClick={() => toggleDifficulty(diff)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded-[2px] cursor-pointer group">
                          <div className={cn("w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-all",
                            selectedDifficulties.includes(diff) ? "bg-white border-white" : "border-[#555] group-hover:border-[#777]"
                          )}>{selectedDifficulties.includes(diff) && <Check className="w-2.5 h-2.5 text-black stroke-[4]" />}</div>
                          <span className={cn("text-[10px] uppercase font-bold tracking-widest", selectedDifficulties.includes(diff) ? "text-white" : "text-[#777] group-hover:text-[#ccc]")}>{diff}</span>
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
                  <div key={problem.id} className="group relative bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] p-5 md:px-7 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:border-[#333] hover:bg-[#0f0f0f] cursor-default">
                    <div className="flex items-center gap-5">
                      {problem.tags?.includes('Arrays') ? <LayersBoxIcon /> : <TerminalBoxIcon />}
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-white text-[1.1rem] font-bold tracking-[-0.01em] m-0 leading-tight group-hover:text-white transition-colors cursor-pointer" onClick={() => navigate(`/practice-arena/${problem.slug}`)}>{problem.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[0.55rem] font-extrabold uppercase tracking-[1.5px] px-2.5 py-[3px] rounded-[3px] border", getDifficultyStyle(problem.difficulty))}>{problem.difficulty}</span>
                          <span className="text-[0.55rem] font-extrabold text-[#555] bg-[#1a1a1a] border border-[#252525] uppercase tracking-[1.5px] px-2.5 py-[3px] rounded-[3px]">{problem.tags?.[0] || 'GENERAL'}</span>
                          {problem.is_daily && <Flame className="w-3 h-3 text-[#ff4d4d] fill-[#ff4d4d]/10 ml-1" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 md:gap-10 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                      <div className="text-right">
                        <span className="block text-[0.55rem] font-bold text-[#555] uppercase tracking-[3px] mb-0.5">Acceptance</span>
                        <span className="text-[1.4rem] font-light text-white leading-none">{problem.acceptance_rate || 0}%</span>
                      </div>
                      <button onClick={() => navigate(`/practice-arena/${problem.slug}`)} className="relative bg-white text-black border border-white px-8 py-3 rounded-[3px] text-[0.65rem] font-extrabold uppercase tracking-[3px] cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-400 group/btn hover:bg-transparent hover:text-white hover:pl-10">
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

        {/* Right Sidebar: Stats */}
        <aside className="hidden lg:flex flex-col h-full overflow-hidden">
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col gap-6 pb-10">
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
