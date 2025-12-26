import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Sheet, SheetContent, SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Popover, PopoverContent, PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Search, ArrowLeft, Layers, Flame, 
  ChevronDown, Check, User, LogOut, QrCode,
  Menu 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { QRCodeSVG } from 'qrcode.react';

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

// --- PREMIUM FOLDER STICKER (Your Exact Design Logic) ---
const FolderSticker = ({ active }: { active: boolean }) => (
  <div className={cn(
    "relative transition-all duration-300 shrink-0", 
    active ? "scale-105 opacity-100" : "opacity-40 hover:opacity-70"
  )}>
    <div className="filter 
      drop-shadow-[1.5px_0_0_#e0e0e0] 
      drop-shadow-[-1.5px_0_0_#e0e0e0] 
      drop-shadow-[0_1.5px_0_#e0e0e0] 
      drop-shadow-[0_-1.5px_0_#e0e0e0]
      drop-shadow-[0_0_1px_rgba(255,255,255,0.2)]
      drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
    >
      <div className="relative w-[26px] h-[18px]">
        <div 
          className="absolute top-[-4.2px] left-0 w-[16px] h-[5.2px] bg-[#f39233] border-[1px] border-[#2d1d1a] border-b-0 rounded-tl-[2.2px] rounded-tr-[3.4px]"
          style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1px] border-[#2d1d1a] rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] overflow-hidden box-border">
          <div className="absolute top-0 left-0 w-full h-[3.8px] bg-[#f39233] border-b-[1px] border-[#2d1d1a]" />
        </div>
      </div>
    </div>
  </div>
);

// --- TOPIC HASHTAG ICON ---
const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn("relative w-4 h-4 shrink-0 transition-opacity duration-300", active ? "opacity-100" : "opacity-30")}>
    <div className="absolute left-[30%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);

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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [userId, setUserId] = useState<string | undefined>();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [placeholderTopic, setPlaceholderTopic] = useState("Arrays");
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id));
    const handleClickOutside = (event: MouseEvent) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(undefined);
    setIsProfileOpen(false);
  };

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  const handleSetUsername = async () => {
    if (!userId || !newUsername.trim()) return;
    setIsUpdatingUsername(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim() })
        .eq('id', userId);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['user_profile_arena', userId] });
        setNewUsername('');
      }
    } catch (err) {
      console.error('Error updating username:', err);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const TopicNavigation = () => (
    <nav className="flex flex-col gap-1 pb-10">
      <div 
        onClick={() => { setSelectedTopic(null); setIsMobileMenuOpen(false); }}
        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-sm transition-all cursor-pointer font-sans",
          selectedTopic === null ? "bg-[#141414] text-white border border-[#1a1a1a]" : "text-[#555] hover:text-[#999]"
        )}
      >
        <FolderSticker active={selectedTopic === null} />
        <span className="tracking-tight font-medium">All Topics</span>
      </div>
      {topics.map((topic: any) => (
        <div 
          key={topic.id} 
          onClick={() => { setSelectedTopic(topic.name); setIsMobileMenuOpen(false); }}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-[3px] text-sm transition-all cursor-pointer font-sans",
            selectedTopic === topic.name ? "bg-[#141414] text-white border border-[#1a1a1a]" : "text-[#555] hover:text-[#999]"
          )}
        >
          <SubTopicHashtag active={selectedTopic === topic.name} />
          <span className="tracking-tight font-medium">{topic.name}</span>
        </div>
      ))}
    </nav>
  );

  const profileLink = profile?.username 
    ? `${window.location.origin}/u/${profile.username}` 
    : `${window.location.origin}/profile`;

  return (
    <div className="h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans overflow-hidden select-none">
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1a1a1a] bg-[#050505] shrink-0 z-50">
        <div className="flex items-center gap-4 md:gap-8 font-sans">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-[#555] hover:text-white hover:bg-[#141414]">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#050505] border-[#1a1a1a] p-0 w-72">
              <div className="flex flex-col h-full p-4">
                <div className="font-neuropol text-xl font-bold text-white mb-8 pt-4 px-2">
                  COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
                </div>
                <ScrollArea className="flex-1">
                  <TopicNavigation />
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

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

                 <div className="mt-1 p-3 bg-white rounded-lg flex flex-col items-center gap-2 relative overflow-hidden">
                    <div className="relative">
                      <div className={cn("transition-all duration-500", !profile?.username && "blur-md select-none")}>
                        <QRCodeSVG 
                          value={profileLink} 
                          size={96} 
                          level="H" 
                          includeMargin={false}
                        />
                      </div>
                      
                      {!profile?.username && (
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 px-1">
                          <div className="w-full flex flex-col gap-1">
                            <Input 
                              placeholder="Set username"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="h-7 text-[10px] bg-white border-black/20 text-black placeholder:text-black/40 focus-visible:ring-black/40"
                              onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                            />
                            <Button 
                              onClick={handleSetUsername}
                              disabled={isUpdatingUsername || !newUsername.trim()}
                              className="h-6 text-[8px] bg-black text-white hover:bg-black/90 font-bold uppercase tracking-widest"
                            >
                              {isUpdatingUsername ? "..." : "Save"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3 h-3 text-black" />
                      <span className="text-[9px] text-black font-bold uppercase tracking-wider">
                        {!profile?.username ? "Claim Username" : "Scan Profile Card"}
                      </span>
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-6 p-4 md:p-6 w-full overflow-hidden">
        <aside className="hidden lg:flex flex-col gap-8 h-full overflow-hidden font-sans">
          <div className="flex-1 flex flex-col min-h-0 pt-2">
            <ScrollArea className="flex-1 pr-2">
              <TopicNavigation />
            </ScrollArea>
          </div>
        </aside>

        <main className="flex flex-col h-full overflow-hidden rounded-[3px]">
          <div className="shrink-0 py-4 mb-2 bg-[#050505] flex items-center justify-between">
            <ScrollArea className="w-full" orientation="horizontal">
              <div className="flex items-center gap-2 pb-3 px-1 min-w-max">
                 {(['all', 'solved', 'unsolved', 'attempted'] as StatusFilter[]).map((f) => (
                   <button key={f} onClick={() => setStatusFilter(f)}
                     className={cn(
                       "px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans", 
                       statusFilter === f ? "bg-white text-black border-white shadow-md font-bold" : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white font-medium"
                     )}>{f}</button>
                 ))}
                 
                 <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn("px-6 py-2 text-xs font-semibold rounded-full transition-all duration-200 border uppercase tracking-wider font-sans flex items-center gap-2",
                          selectedDifficulties.length > 0 ? "bg-[#141414] text-white border-[#333]" : "bg-[#0c0c0c] text-zinc-500 border-[#1a1a1a] hover:border-[#333] hover:text-white"
                      )}>
                        Level <ChevronDown className="w-3 h-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-40 bg-[#0c0c0c] border-[#333] p-1 shadow-2xl z-[60]">
                      <div className="flex flex-col gap-0.5">
                        {['Easy', 'Medium', 'Hard'].map((diff) => (
                          <div key={diff} onClick={() => toggleDifficulty(diff)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] rounded-[2px] cursor-pointer group">
                            <div className={cn("w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center transition-all",
                              selectedDifficulties.includes(diff) ? "bg-white border-white" : "border-[#555] group-hover:border-[#777]"
                            )}>{selectedDifficulties.includes(diff) && <Check className="w-2.5 h-2.5 text-black stroke-[4]" />}</div>
                            <span className={cn("text-[10px] uppercase font-bold tracking-widest", selectedDifficulties.includes(diff) ? "text-white" : "text-[#777] group-hover:text-[#ccc]")}>{diff}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                 </Popover>
              </div>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
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

        <aside className="hidden lg:flex flex-col h-full overflow-hidden">
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col gap-6 pb-10">
              <div className="flex flex-col gap-6 font-sans">
                {/* Conditionally render Guest Card or User Stats */}
                {!userId ? (
                  <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-[3px] p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#1a1a1a] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#555]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white font-bold tracking-tight">Track Your Progress</h3>
                      <p className="text-xs text-[#555] leading-relaxed">
                        Sign in to save your solutions, track your daily activity, and compete on the leaderboard.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="w-full bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-[2px] h-9 rounded-[2px]"
                    >
                      Get Started
                    </Button>
                  </div>
                ) : (
                  <>
                    <UserStatsCard userId={userId} />
                    <ActivityCalendar userId={userId} />
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
