import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, Search, Layers, Clock, Play, 
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock, Menu, Code2, X, Trophy, Target, BarChart3, Activity, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- DESIGN COMPONENTS ---
const FolderSticker = ({ active }: { active: boolean }) => (
  <div className={cn("relative transition-all duration-300 shrink-0", active ? "scale-105 opacity-100" : "opacity-40 hover:opacity-70")}>
    <div className="filter drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
      <div className="relative w-[22px] h-[15px]">
        <div className="absolute top-[-3.5px] left-0 w-[13px] h-[4px] bg-[#f39233] border-[1px] border-[#2d1d1a] border-b-0 rounded-tl-[2px] rounded-tr-[3px]" style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1px] border-[#2d1d1a] rounded-tr-[2px] rounded-br-[2px] rounded-bl-[2px] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-[#f39233] border-b-[1px] border-[#2d1d1a]" />
        </div>
      </div>
    </div>
  </div>
);

const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn("relative w-3.5 h-3.5 shrink-0 transition-opacity duration-300", active ? "opacity-100" : "opacity-30")}>
    <div className="absolute left-[30%] top-0 w-[1.5px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[1.5px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);

const ArchiveToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="relative inline-block w-[80px] h-[36px] cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={cn("absolute inset-0 border-2 rounded-[30px] transition-all duration-300", checked ? "border-[#5ec952]" : "border-[#ef4444]")}>
      <span className={cn("absolute bottom-[3px] left-[3px] h-[26px] w-[26px] rounded-full transition-all duration-300", checked ? "translate-x-[44px] bg-[#5ec952]" : "translate-x-0 bg-[#ef4444]")} />
      <span className={cn("absolute top-1/2 -translate-y-1/2 text-[10px] font-black text-white uppercase transition-all duration-300", checked ? "left-[12px]" : "right-[12px]")}>{checked ? "ON" : "OFF"}</span>
    </span>
  </label>
);

const MovingHeaderTitle = ({ subject, exam }: { subject: string, exam: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldMarquee(textRef.current.scrollWidth > containerRef.current.clientWidth);
    }
  }, [subject, exam]);

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative mr-4">
      <h1 ref={textRef} className={cn("font-['Playfair_Display'] text-[18px] md:text-[24px] italic font-bold tracking-tight uppercase whitespace-nowrap inline-block", shouldMarquee && "animate-header-marquee")}>
        {decodeURIComponent(subject)} <span className="text-[#52525b] font-sans not-italic text-[12px] md:text-[16px] ml-2 opacity-60">- {decodeURIComponent(exam)}</span>
      </h1>
      <style>{`
        @keyframes header-marquee { 0%, 10% { transform: translateX(0); } 90%, 100% { transform: translateX(calc(-100% + 250px)); } }
        .animate-header-marquee { animation: header-marquee 10s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
};

const ScrollingPlaceholder = ({ statements, visible }: { statements: string[], visible: boolean }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % statements.length), 5000);
    return () => clearInterval(timer);
  }, [statements.length]);
  if (!visible) return null;
  return (
    <div className="absolute inset-y-0 left-10 right-4 pointer-events-none flex items-center overflow-hidden">
      <span className="text-[10px] uppercase font-bold tracking-widest text-[#3f3f46] font-sans whitespace-nowrap animate-marquee-text">{statements[index]}</span>
      <style>{`@keyframes marquee-text { 0%, 25% { transform: translateX(0); } 75%, 100% { transform: translateX(-20%); } } .animate-marquee-text { animation: marquee-text 6s ease-in-out infinite alternate; }`}</style>
    </div>
  );
};

export default function QuestionSetSelection() {
  const { subjectId, subjectName, examType, mode } = useParams();
  const navigate = useNavigate();
  const isProctored = mode === 'proctored';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState([20]); 
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);

  const searchPlaceholders = ['Search archive...', 'Filter by level...', 'Modules query...', 'Question name...'];

  const { data: session } = useQuery({ queryKey: ['session'], queryFn: async () => (await supabase.auth.getSession()).data.session });
  const userId = session?.user?.id;

  const { data: userStats } = useQuery({
    queryKey: ['proctored_user_stats', userId],
    queryFn: async () => {
      const { data: sub } = await supabase.from('practice_submissions').select('score, status').eq('user_id', userId!).eq('status', 'completed');
      return { solved: sub?.length || 0, points: sub?.reduce((acc, c) => acc + (c.score || 0), 0) || 0 };
    },
    enabled: !!userId,
  });

  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['global_leaderboard'],
    queryFn: async () => (await supabase.rpc('get_practice_leaderboard', { p_timeframe: 'all_time', p_limit: 20 })).data || [],
  });

  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');
      if (isProctored) {
        const { data, error } = await supabase.from('iitm_exam_question_bank').select('*').eq('subject_id', subjectId).ilike('exam_type', currentExamType);
        if (error) throw error;
        const setMap: Record<string, any> = {};
        data?.forEach(item => {
          const key = item.set_name;
          if (!setMap[key]) setMap[key] = { totalTime: 0, title: item.title || item.set_name, name: item.set_name, sequence_number: item.sequence_number ?? 9999, exam_type: item.exam_type };
          setMap[key].totalTime += (item.expected_time || 0);
        });
        return Object.values(setMap).sort((a: any, b: any) => a.sequence_number - b.sequence_number);
      }
      return (await supabase.from('iitm_assignments').select('*').eq('subject_id', subjectId).ilike('exam_type', currentExamType).order('title')).data || [];
    }
  });

  const topics = useMemo(() => isProctored ? [] : Array.from(new Set(fetchedData.map((a: any) => a.category || 'General'))).sort(), [fetchedData, isProctored]);
  const filteredData = useMemo(() => (fetchedData as any[]).filter(i => {
    const t = (i.title || i.name || '').toLowerCase();
    const matchesSearch = t.includes(searchTerm.toLowerCase());
    return isProctored ? matchesSearch : (matchesSearch && (selectedTopic ? (i.category || 'General') === selectedTopic : true));
  }), [fetchedData, searchTerm, selectedTopic, isProctored]);

  const handleStart = async (targetId: string, isSetSelection = false) => {
    const isOk = await checkUserProfile(); if (!isOk) return setShowProfileSheet(true);
    const params = new URLSearchParams({ iitm_subject: subjectId || '', name: subjectName || '', type: examType || '', timer: noTimeLimit ? '0' : timeLimit[0].toString(), mode: mode || 'learning' });
    if (isSetSelection) params.set('set_name', targetId); else params.set('q', targetId);
    navigate(`/${isProctored ? 'exam' : 'practice'}?${params.toString()}`);
  };

  const SidebarStats = () => (
    <div className="flex flex-col h-full p-8 space-y-10">
      <div className="flex items-baseline gap-2 border-b border-[#1a1a1c] pb-8 shrink-0">
        <span className="text-[64px] font-light leading-none tracking-[-3px] text-white">{userStats?.solved || 0}</span>
        <span className="font-['Playfair_Display'] italic text-xl text-[#52525b]">Archived</span>
      </div>
      <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm shrink-0">
        <span className="text-[20px] font-bold block text-white">{userStats?.points.toLocaleString()}</span>
        <span className="text-[9px] text-[#444] uppercase font-black tracking-widest">Aggregate Marks</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        <h3 className="text-[10px] uppercase tracking-[2px] text-[#666] font-bold italic sticky top-0 bg-[#070708] py-2 border-b border-[#1a1a1c]">Top Transmissions</h3>
        {leaderboardData.slice(0, 10).map((e: any, i: number) => (
          <div key={e.user_id} className="flex justify-between py-2 text-[12px] items-center border-b border-white/[0.02]">
            <div className="flex gap-4 min-w-0"><span className="font-mono text-[#333] shrink-0">{String(i + 1).padStart(2, '0')}</span><span className="truncate text-zinc-300 font-medium">{e.full_name}</span></div>
            <span className="font-mono text-[#555] shrink-0">{e.total_score} XP</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
      
      {/* --- UNIFIED HEADER --- */}
      <header className="px-4 py-3 md:px-10 md:py-4 border-b border-[#1a1a1c] bg-[#050505] z-30 shrink-0">
        <div className="flex justify-between items-center gap-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors shrink-0"><ArrowLeft size={18} className="text-[#666] hover:text-white" /></button>
            <MovingHeaderTitle subject={subjectName || ''} exam={examType || ''} />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3f3f46] z-30" />
              <div className="relative flex items-center h-9 bg-[#0d0d0d] border border-[#1f1f23] rounded-sm overflow-hidden">
                <ScrollingPlaceholder statements={searchPlaceholders} visible={searchTerm === ''} />
                <Input className="bg-transparent border-none text-white h-full w-full pl-9 pr-4 text-[11px] font-mono focus-visible:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Mobile Navigations */}
            {isProctored && (
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden text-[#52525b] hover:text-white"><Trophy size={18} /></Button></SheetTrigger>
                <SheetContent side="right" className="bg-[#070708] border-[#1a1a1c] text-white w-[320px] p-0"><SidebarStats /></SheetContent>
              </Sheet>
            )}
            {!isProctored && (
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden text-[#52525b] hover:text-white"><Menu size={18} /></Button></SheetTrigger>
                <SheetContent side="left" className="bg-[#080808] border-[#1a1a1c] text-white w-[280px] p-6">
                  <h3 className="text-[10px] uppercase font-black text-[#444] mb-6 tracking-[2px]">Archive Directory</h3>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setSelectedTopic(null)} className={cn("text-left py-3 px-4 rounded-sm text-xs font-bold transition-all", !selectedTopic ? "bg-white/10 text-white" : "text-[#666]")}>All Archive</button>
                    {topics.map((t: any) => <button key={t} onClick={() => setSelectedTopic(t)} className={cn("text-left py-3 px-4 rounded-sm text-xs font-bold truncate transition-all", selectedTopic === t ? "bg-white/10 text-white" : "text-[#666]")}># {t}</button>)}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full relative">
        {!isProctored && (
          <aside className="hidden lg:flex w-[250px] border-r border-[#1a1a1c] bg-[#080808] p-8 flex-col shrink-0 overflow-y-auto">
            <span className="font-extrabold text-[18px] tracking-tight mb-8 block uppercase text-[#333]">Directory</span>
            <nav className="flex flex-col gap-1 pr-2">
              <button onClick={() => setSelectedTopic(null)} className={cn("flex items-center gap-3 py-3 px-3 rounded-sm text-[12px] font-bold transition-colors text-left", selectedTopic === null ? "text-white bg-white/5 border border-white/5" : "text-[#666] hover:text-white")}>
                <FolderSticker active={selectedTopic === null} />All Records
              </button>
              {topics.map((t: string) => (
                <button key={t} onClick={() => setSelectedTopic(t)} className={cn("flex items-center gap-3 py-3 px-3 rounded-sm text-[12px] font-bold transition-colors text-left truncate", selectedTopic === t ? "text-white bg-white/5 border border-white/5" : "text-[#666] hover:text-white")}>
                  <SubTopicHashtag active={selectedTopic === t} />{t}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pt-6 px-4 md:px-12">
          {isLoading ? (
             <div className="flex items-center justify-center py-40 gap-3">
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
             </div>
          ) : (
            <div className={cn("pb-12", isProctored ? "space-y-6" : "space-y-3")}>
              {filteredData.map((item: any) => {
                const id = isProctored ? item.name : item.id;
                const isExpanded = expandedQuestion === id;
                const isLocked = !isProctored && item.is_unlocked === false;

                return (
                  <div key={id} className="relative group">
                    {isLocked && <PremiumLockOverlay />}
                    <div className={cn("bg-[#0a0a0b] border border-[#1a1a1c] rounded-sm transition-all duration-300", isExpanded && "border-[#333]")}>
                      <div 
                        className={cn(
                          "flex flex-nowrap items-center p-4 md:p-6 cursor-pointer gap-4 md:gap-6 overflow-x-auto scrollbar-hide select-none",
                          isLocked && "opacity-40"
                        )}
                        onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : id)}
                      >
                        <div className="w-10 h-10 bg-black border border-[#1a1a1c] flex items-center justify-center text-[#333] group-hover:text-red-500 rounded-sm shrink-0 transition-colors">
                          {isProctored ? <Shield size={16} /> : <Code2 size={16} />}
                        </div>
                        <div className="min-w-[160px] flex-1 truncate">
                          <h3 className="text-[15px] md:text-[18px] font-bold text-zinc-100 truncate tracking-tight">{item.title || item.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            {isProctored ? (
                               <div className="inline-flex items-center gap-1.5 bg-transparent border border-white/10 px-2 py-0.5 rounded-[2px] text-[8px] uppercase font-black text-white tracking-widest">
                                 <span className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_red]" /> Secured Test
                               </div>
                            ) : (
                               <Badge variant="outline" className="text-[8px] uppercase tracking-widest text-[#52525b] border-[#1a1a1c] px-2 py-0 h-4">{item.category || 'Module'}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[11px] text-[#666] shrink-0 uppercase tracking-tighter">
                          {isProctored ? `REC-${String(item.sequence_number || 1).padStart(2, '0')}` : (item.difficulty || 'Normal')}
                        </div>
                        <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[11px] text-[#666] shrink-0 uppercase">
                          {String(item.totalTime || item.expected_time || 20).padStart(2, '0')} MIN
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStart(id, isProctored); }} 
                          className="bg-white text-black px-6 py-3 text-[9px] font-black uppercase tracking-[2px] transition-all hover:bg-transparent hover:text-white border border-transparent hover:border-white/20 flex items-center gap-2 shrink-0"
                        >
                          Launch <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>

                      {!isProctored && (
                        <div className={cn("bg-[#080809] transition-all duration-500 ease-in-out px-6 overflow-hidden", isExpanded ? "max-h-[500px] border-t border-[#1a1a1c] py-8 opacity-100" : "max-h-0 py-0 opacity-0")}>
                          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                            <div className="flex-1 w-full space-y-6">
                              <div className="flex items-center gap-4"><span className="text-[10px] text-[#444] uppercase font-black tracking-[2px] italic">Set Duration</span><div className={cn("flex items-center gap-2", noTimeLimit && "opacity-20")}><input type="text" className="bg-black border border-[#1a1a1c] text-white w-14 p-2 text-center font-mono rounded-sm text-sm" value={timeLimit[0]} readOnly /><span className="text-[11px] text-[#333] font-bold">MIN</span></div></div>
                              <div className={cn("w-full transition-opacity", noTimeLimit && "opacity-20")}><Slider value={timeLimit} onValueChange={setTimeLimit} min={2} max={30} step={2} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&>.relative>.absolute]:bg-white py-4" /></div>
                            </div>
                            <div className="flex flex-col items-end gap-4 shrink-0">
                              <div className="flex flex-col gap-2 items-center"><span className="text-[#333] text-[9px] uppercase tracking-[2px] font-black">Free Mode</span><ArchiveToggle checked={noTimeLimit} onChange={setNoTimeLimit} /></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {isProctored && <aside className="hidden lg:flex w-[350px] bg-[#070708] border-l border-[#1a1a1c] flex-col overflow-y-auto scrollbar-hide"><SidebarStats /></aside>}
      </div>

      {isLeaderboardModalOpen && (
        <div className="fixed inset-0 bg-black z-[1000] flex flex-col p-6 md:p-[80px_100px] overflow-y-auto animate-in fade-in duration-500">
          <div className="flex justify-between items-end mb-12 pb-8 border-b border-[#111]">
            <div><p className="uppercase tracking-[6px] text-[#333] text-[10px] mb-3 font-black">Ranking Metrics</p><h2 className="font-['Playfair_Display'] text-[32px] md:text-[54px] italic font-bold text-white tracking-tighter">Transmission hall of fame</h2></div>
            <button onClick={() => setIsLeaderboardModalOpen(false)} className="bg-white text-black px-8 py-3.5 text-[10px] font-black uppercase transition-all hover:bg-transparent hover:text-white border border-transparent hover:border-white/30">Close</button>
          </div>
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#111]"><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">Rank</th><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">Agent</th><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">Transmissions</th><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">Streak</th><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">XP Score</th><th className="p-5 text-[10px] uppercase tracking-[3px] text-[#333] font-black">Status</th></tr>
            </thead>
            <tbody className="font-mono text-[13px] divide-y divide-[#111]">
              {leaderboardData.map((row: any, i: number) => (
                <tr key={row.user_id} className="hover:bg-white/[0.01] transition-colors"><td className="p-5 text-[#333]">{String(i + 1).padStart(2, '0')}</td><td className="p-5 text-zinc-100 font-sans font-bold">{row.full_name}</td><td className="p-5 text-zinc-500">{row.problems_solved}</td><td className="p-5 text-zinc-500">{row.current_streak}D</td><td className="p-5 text-zinc-400 font-black">{row.total_score}</td><td className="p-5"><span className={cn("px-3 py-1 rounded-[1px] text-[9px] font-black uppercase", i < 3 ? "bg-[#10b9811a] text-[#10b981]" : "bg-[#111] text-[#333]")}>{i < 3 ? 'Elite' : 'Operative'}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
