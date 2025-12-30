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
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock, Menu, Code2, X, Trophy, Target, Flame, BarChart3, Activity, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

// --- SHARED COMPONENTS ---
const ArchiveToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="relative inline-block w-[94px] h-[42px] cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={cn("absolute inset-0 border-2 rounded-[40px] transition-all duration-300", checked ? "border-[#5ec952]" : "border-[#ef4444]")}>
      <span className={cn("absolute bottom-[4px] left-[4px] h-[30px] w-[30px] rounded-full transition-all duration-300", checked ? "translate-x-[52px] bg-[#5ec952]" : "translate-x-0 bg-[#ef4444]")} />
      <span className={cn("absolute top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-white uppercase transition-all duration-300", checked ? "left-[14px]" : "right-[14px]")}>{checked ? "ON" : "OFF"}</span>
    </span>
  </label>
);

const ScrollingPlaceholder = ({ statements, visible }: { statements: string[], visible: boolean }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % statements.length), 5000);
    return () => clearInterval(timer);
  }, [statements.length]);
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldScroll(textRef.current.offsetWidth > containerRef.current.offsetWidth - 20);
    }
  }, [index]);
  if (!visible) return null;
  return (
    <div ref={containerRef} className="absolute inset-y-0 left-10 right-4 pointer-events-none flex items-center overflow-hidden" style={{ clipPath: 'inset(0 0 0 0)' }}>
      <span ref={textRef} className={cn("text-[10px] uppercase font-bold tracking-widest text-[#3f3f46] font-sans whitespace-nowrap", shouldScroll ? "animate-placeholder-scroll" : "")}>{statements[index]}</span>
      <style>{`@keyframes placeholder-scroll { 0%, 25% { transform: translateX(0); } 75%, 100% { transform: translateX(calc(-100% + 200px)); } } .animate-placeholder-scroll { animation: placeholder-scroll 8s ease-in-out infinite alternate; }`}</style>
    </div>
  );
};

export default function QuestionSetSelection() {
  const { subjectId, subjectName, examType, mode } = useParams();
  const navigate = useNavigate();
  const isProctored = mode === 'proctored';

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState([20]); 
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);

  // --- DATA FETCHING ---
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });
  const userId = session?.user?.id;

  const { data: proctoredStats } = useQuery({
    queryKey: ['accurate_proctored_stats', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('score, status')
        .eq('user_id', userId!)
        .eq('status', 'completed');
      
      const totalSolved = submissions?.length || 0;
      const avgMarks = submissions?.length 
        ? (submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / submissions.length).toFixed(1)
        : '0';

      return { 
        solved: totalSolved, 
        points: submissions?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 0,
        avgMarks: `${avgMarks}%`
      };
    },
    enabled: !!userId && isProctored,
  });

  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['real_proctored_leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_practice_leaderboard', { 
        p_timeframe: 'all_time', 
        p_limit: 20 
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isProctored,
  });

  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');
      if (isProctored) {
        const { data, error } = await supabase
          .from('iitm_exam_question_bank')
          .select('set_name, expected_time, title, sequence_number, description, exam_type')
          .eq('subject_id', subjectId)
          .ilike('exam_type', currentExamType);
        if (error) throw error;
        
        const setMap: Record<string, any> = {};
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               setMap[item.set_name] = { 
                 totalTime: 0, title: item.title || item.set_name, name: item.set_name,
                 description: item.description || '', sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });
        return Object.values(setMap).sort((a: any, b: any) => a.sequence_number - b.sequence_number);
      } else {
        const { data, error } = await supabase.from('iitm_assignments').select('*').eq('subject_id', subjectId).ilike('exam_type', currentExamType).order('title');
        if (error) throw error;
        return data || [];
      }
    }
  });

  const filteredData = useMemo(() => {
    return (fetchedData as any[]).filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    });
  }, [fetchedData, searchTerm]);

  const handleStart = async (targetId: string, isSetSelection = false) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) return setShowProfileSheet(true);
    const params = new URLSearchParams({ iitm_subject: subjectId || '', name: subjectName || '', type: examType || '', timer: noTimeLimit ? '0' : timeLimit[0].toString(), mode: mode || 'learning' });
    if (isSetSelection) params.set('set_name', targetId);
    else params.set('q', targetId);
    navigate(`/${isProctored ? 'exam' : 'practice'}?${params.toString()}`);
  };

  // --- PROCTORED MODE VIEW ---
  if (isProctored) {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
        <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
        
        {/* --- OPTIMIZED HEADER --- */}
        <header className="px-6 py-4 md:px-12 md:py-6 border-b border-[#1a1a1c] bg-[#050505] z-30 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-6">
              <h1 className="font-['Playfair_Display'] text-3xl italic font-bold tracking-tight">
                {decodeURIComponent(subjectName || '')}
              </h1>
              <Badge variant="outline" className="border-red-500/20 bg-red-500/5 text-red-400 uppercase tracking-widest text-[10px] px-3 h-6">
                {decodeURIComponent(examType || '')}
              </Badge>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Input 
                className="bg-[#0c0c0d] border-[#1a1a1c] p-[10px_20px] rounded-sm text-white text-[13px] h-10 focus:border-[#444] transition-all"
                placeholder="Search set name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* --- SPLIT PANE --- */}
        <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
          <main className="flex-1 flex flex-col overflow-y-auto border-r border-[#1a1a1c] pt-8">
            <div className="px-6 md:px-12 flex items-center justify-between mb-8">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#666] hover:text-white transition-all">
                <ArrowLeft size={12} /> Return
              </button>
            </div>

            <div className="px-6 md:px-12 space-y-3 pb-12">
              {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="font-extrabold text-2xl tracking-[10px] animate-pulse">CODÉVO</div></div>
              ) : filteredData.map((set) => (
                <div key={set.name} className="bg-[#0a0a0b] border border-[#1a1a1c] p-5 md:p-[20px_25px] flex flex-col md:flex-row items-center rounded-sm transition-all hover:border-[#333] group">
                  <div className="w-10 h-10 bg-black border border-[#1a1a1c] flex items-center justify-center mr-0 md:mr-6 text-[#333] group-hover:text-red-500 rounded-sm shrink-0 mb-4 md:mb-0 transition-colors">
                    <Lock width={18} height={18} strokeWidth={2.5}/>
                  </div>
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-[18px] font-bold tracking-tight text-zinc-100 truncate pr-4">{set.title}</h3>
                    <div className="inline-flex items-center gap-2 text-[8px] uppercase font-extrabold text-[#ef4444] mt-1.5 tracking-widest opacity-80">
                      <span className="w-1 h-1 bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]" /> Secure Test
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[12px] text-[#888] mx-0 md:mx-4 mb-4 md:mb-0 uppercase">Set {String(set.sequence_number || 1).padStart(2, '0')}</div>
                  <div className="bg-white/[0.02] border border-[#1a1a1c] rounded-sm px-3 py-1.5 font-mono text-[12px] text-[#888] mx-0 md:mx-4 mb-6 md:mb-0 uppercase shrink-0">{set.totalTime} MIN</div>
                  <button onClick={() => handleStart(set.name, true)} className="bg-white text-black px-8 py-3 text-[10px] font-extrabold uppercase tracking-[2px] transition-all hover:bg-[#e4e4e7]">Start Test</button>
                </div>
              ))}
            </div>
          </main>

          {/* --- RIGHT SIDEBAR: ANALYTICS & LEADERBOARD --- */}
          <div className="hidden lg:flex w-[400px] bg-[#070708] p-10 flex-col overflow-y-auto">
            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-[72px] font-light leading-none tracking-[-4px] text-white">{proctoredStats?.solved || 0}</span>
              <span className="font-['Playfair_Display'] italic text-2xl text-[#52525b]">Solved</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm">
                <span className="text-[20px] font-bold block mb-1 text-white">{proctoredStats?.points.toLocaleString() || 0}</span>
                <span className="text-[9px] text-[#444] uppercase font-extrabold tracking-widest">Total Points</span>
              </div>
              <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm">
                <span className="text-[20px] font-bold block mb-1 text-white">{proctoredStats?.avgMarks || '0%'}</span>
                <span className="text-[9px] text-[#444] uppercase font-extrabold tracking-widest">Avg. Marks</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#1a1a1c]">
              <h3 className="text-[11px] uppercase tracking-[2px] text-[#666] font-bold italic">Hall of Fame</h3>
              <button onClick={() => setIsLeaderboardModalOpen(true)} className="bg-transparent border border-[#333] text-[#888] text-[8px] px-2.5 py-1 rounded-sm uppercase font-extrabold hover:bg-white transition-all">Full List</button>
            </div>

            <div className="divide-y divide-white/[0.02] flex-1">
              {leaderboardData.slice(0, 8).map((entry: any, i: number) => (
                <div key={entry.user_id} className="flex justify-between py-3.5 items-center">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[9px] text-[#333]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] font-medium text-zinc-300 truncate w-36">{entry.full_name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">{entry.total_score.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-[10px] uppercase tracking-[2px] text-[#222] font-bold text-center">Verified Performance Archive</p>
          </div>
        </div>

        {/* --- LEADERBOARD MODAL --- */}
        {isLeaderboardModalOpen && (
          <div className="fixed inset-0 bg-black z-[1000] flex flex-col p-12 md:p-[80px_100px] overflow-y-auto animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-end mb-[60px] pb-[30px] border-b border-[#111] gap-6">
              <div>
                <p className="uppercase tracking-[5px] text-[#444] text-[10px] mb-2.5">Official Candidate Ranking</p>
                <h2 className="font-['Playfair_Display'] text-[48px] italic font-bold text-white">Security Performance Metrics</h2>
              </div>
              <button onClick={() => setIsLeaderboardModalOpen(false)} className="bg-white text-black px-10 py-4 text-[11px] font-extrabold uppercase transition-all active:scale-95">Back to Tests</button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Rank</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Candidate</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Tests Taken</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Day Streak</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Total Score</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm divide-y divide-[#111]">
                {leaderboardData.map((row: any, i: number) => (
                  <tr key={row.user_id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5 text-[#333] group-hover:text-[#666]">{String(i + 1).padStart(2, '0')}</td>
                    <td className="p-5 text-zinc-100 font-sans font-medium">{row.full_name}</td>
                    <td className="p-5 text-zinc-400">{row.problems_solved} Solved</td>
                    <td className="p-5 text-zinc-400">{row.current_streak} Days</td>
                    <td className="p-5 text-zinc-400 font-bold">{row.total_score.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={cn("px-2 py-1 rounded-sm text-[9px] font-extrabold uppercase", i < 3 ? "bg-[#10b9811a] text-[#10b981]" : "bg-[#222] text-[#888]")}>{i < 3 ? 'Elite' : 'Candidate'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- PRACTICE MODE (PRESERVED VIEW) ---
  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans select-none">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
      <aside className="hidden lg:flex w-[260px] border-r border-[#1f1f23] bg-[#080808] p-[40px_25px] flex flex-col shrink-0">
        <span className="font-extrabold text-[22px] tracking-tight mb-10 block uppercase cursor-pointer" onClick={() => navigate('/')}>CODÉVO</span>
        <nav className="flex flex-col gap-1 pr-2 overflow-y-auto">
          <button onClick={() => setSelectedTopic(null)} className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left", !selectedTopic ? "text-white" : "text-[#666] hover:text-white")}>
            All Problems
          </button>
          {topics.map((t: string) => <button key={t} onClick={() => setSelectedTopic(t)} className={cn("text-[13px] py-3 text-left transition-colors truncate", selectedTopic === t ? "text-white" : "text-[#666] hover:text-white")}># {t}</button>)}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative bg-[#050505]">
        <header className="px-6 py-8 md:p-[40px_60px] border-b border-[#1f1f23] sticky top-0 bg-[#050505]/95 backdrop-blur-md z-20 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-white mb-2"><ArrowLeft size={12} /> Return</button>
            <h1 className="text-xl md:text-[28px] font-bold tracking-tight leading-none uppercase">{decodeURIComponent(subjectName || '')}</h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46] z-30" />
            <div className="relative flex items-center h-11 bg-[#0d0d0d] border border-[#1f1f23] rounded-md overflow-hidden">
              <ScrollingPlaceholder statements={searchPlaceholders} visible={searchTerm === ''} />
              <Input className="bg-transparent border-none text-white h-full w-full pl-10 pr-4 text-xs font-mono focus-visible:ring-0 z-20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </header>

        <div className="px-6 py-8 md:p-[40px_60px] max-w-[1200px] w-full mx-auto space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6"><div className="font-extrabold text-4xl md:text-[42px] tracking-[12px] animate-pulse uppercase">CODÉVO</div></div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1f1f23] rounded-sm font-mono text-xs uppercase tracking-widest">Zero results found in directory</div>
          ) : filteredData.map((assignment: any) => {
            const isLocked = assignment.is_unlocked === false;
            const isExpanded = expandedQuestion === assignment.id;
            return (
              <div key={assignment.id} className="relative mb-[15px]">
                {isLocked && <PremiumLockOverlay />}
                <div className={cn("bg-[#0d0d0d] border border-[#1f1f23] rounded-sm transition-all duration-300", isExpanded && "border-[#444] shadow-[0_0_30px_rgba(255,255,255,0.02)]")}>
                  <div className={cn("flex flex-wrap md:flex-nowrap items-center p-5 md:p-[24px_30px] cursor-pointer gap-6", isLocked && "opacity-50 cursor-not-allowed")} onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : assignment.id)}>
                    <div className="w-[48px] h-[48px] bg-[#141414] border border-[#1f1f23] flex items-center justify-center text-[#555] rounded-sm shrink-0"><Code2 size={22} /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-lg md:text-[22px] font-bold text-white mb-[10px] leading-tight pr-4 tracking-tight">{assignment.title}</h3><Badge variant="outline" className="text-[9px] uppercase tracking-widest text-[#666] border-white/5 bg-white/5">{assignment.category || 'General'}</Badge></div>
                    <div className="flex items-center gap-2.5 bg-white/[0.03] border border-[#1f1f23] p-[7px_16px] rounded-[6px] shrink-0"><span className={cn("w-[7px] h-[7px] rounded-full", assignment.difficulty === 'Hard' ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444]" : "bg-[#10b981] shadow-[0_0_10px_#10b981]")} /><span className="text-white text-[11px] font-extrabold uppercase tracking-widest">{assignment.difficulty || 'Easy'}</span></div>
                    <div className="bg-white/[0.03] border border-[#1f1f23] rounded-[6px] p-[7px_15px] font-mono text-[17px] text-[#ccc] shrink-0">{String(assignment.expected_time || 20).padStart(2, '0')} MIN</div>
                  </div>
                  <div className={cn("bg-[#090909] transition-all duration-400 ease-in-out px-5 md:px-[30px] overflow-hidden", isExpanded ? "max-h-[600px] border-t border-[#1f1f23] p-[40px_30px] opacity-100" : "max-h-0 py-0 opacity-0")}>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 lg:gap-[60px]">
                      <div className="flex-1 w-full space-y-6">
                        <div className="flex items-center gap-[12px] mb-[25px]"><span className="text-[11px] text-[#666] font-bold uppercase tracking-widest italic">Set Duration</span><div className={cn("flex items-center gap-[10px]", noTimeLimit && "opacity-30 pointer-events-none")}><input type="text" className="bg-black border border-[#1f1f23] text-white w-[65px] p-2 text-center font-mono rounded-sm text-[16px]" value={timeLimit[0]} readOnly /><span className="text-[12px] text-[#444] font-semibold uppercase tracking-widest">min</span></div></div>
                        <div className={cn("w-full transition-opacity duration-300", noTimeLimit && "opacity-30 pointer-events-none")}><Slider value={timeLimit} onValueChange={setTimeLimit} min={2} max={30} step={2} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_[role=slider]]:shadow-none [&>.relative>.absolute]:bg-white py-4" /><div className="flex justify-between text-[9px] text-[#3f3f46] font-mono uppercase tracking-[1.5px] mt-4"><span>02 MIN</span><span>15 MIN</span><span>30 MIN (OVERRIDE)</span></div></div>
                      </div>
                      <div className="flex flex-col items-end gap-[20px] shrink-0 w-full md:w-auto">
                        <div className="flex flex-col gap-3 items-center"><span className="text-[#666] text-[10px] uppercase tracking-[2px] font-bold">Free Mode</span><ArchiveToggle checked={noTimeLimit} onChange={setNoTimeLimit} /></div>
                        <button onClick={() => handleStart(assignment.id, false)} className="w-full lg:w-auto bg-white text-black p-[16px_50px] text-[11px] font-extrabold uppercase tracking-[2px] rounded-[2px] hover:bg-[#e0e0e0] transition-all flex items-center justify-center gap-3">{noTimeLimit ? <InfinityIcon size={14} strokeWidth={3} /> : <Play size={14} fill="black" />}Start Practice</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
