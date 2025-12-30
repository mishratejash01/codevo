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
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock, Menu, Code2, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- COMPONENTS FOR PRACTICE MODE ---
const FolderSticker = ({ active }: { active: boolean }) => (
  <div className={cn("relative transition-all duration-300 shrink-0", active ? "scale-105 opacity-100" : "opacity-40 hover:opacity-70")}>
    <div className="filter drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.5)]">
      <div className="relative w-[26px] h-[18px]">
        <div className="absolute top-[-4.2px] left-0 w-[16px] h-[5.2px] bg-[#f39233] border-[1px] border-[#2d1d1a] border-b-0 rounded-tl-[2.2px] rounded-tr-[3.4px]" style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1px] border-[#2d1d1a] rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3.8px] bg-[#f39233] border-b-[1px] border-[#2d1d1a]" />
        </div>
      </div>
    </div>
  </div>
);

const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn("relative w-4 h-4 shrink-0 transition-opacity duration-300", active ? "opacity-100" : "opacity-30")}>
    <div className="absolute left-[30%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);

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

  // --- COMPONENT STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState([20]); 
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const searchPlaceholders = [
    'Filter results by level: "Easy", "Medium", or "Hard"...',
    'Enter a topic name to find specific modules...',
    'Search for specific question titles...',
    'Filter by category to narrow your archive...'
  ];

  // --- DATA FETCHING (PRESERVING FULL ORIGINAL LOGIC) ---
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');
      if (isProctored) {
        const { data, error } = await supabase
          .from('iitm_exam_question_bank')
          .select('set_name, expected_time, title, sequence_number, description')
          .eq('subject_id', subjectId) 
          .ilike('exam_type', currentExamType); 
        if (error) throw error;
        const setMap: Record<string, { totalTime: number; title: string; sequence_number: number; description: string }> = {};
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               setMap[item.set_name] = { 
                 totalTime: 0, title: item.title || item.set_name,
                 description: item.description || '', sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });
        return Object.entries(setMap).map(([name, val]) => ({ name, ...val })).sort((a, b) => a.sequence_number - b.sequence_number);
      } else {
        const { data, error } = await supabase.from('iitm_assignments').select('*').eq('subject_id', subjectId).ilike('exam_type', currentExamType).order('title');
        if (error) throw error;
        return data || [];
      }
    }
  });

  const topics = useMemo(() => {
    if (isProctored) return [];
    const uniqueTopics = new Set(fetchedData.map((a: any) => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  const filteredData = useMemo(() => {
    return (fetchedData as any[]).filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      const matchesSearch = title.includes(searchTerm.toLowerCase());
      const matchesTopic = isProctored ? true : (selectedTopic ? (item.category || 'General') === selectedTopic : true);
      return matchesSearch && matchesTopic;
    });
  }, [fetchedData, searchTerm, selectedTopic, isProctored]);

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
      <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans">
        <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
        
        {/* --- MAIN VIEWPORT --- */}
        <main className="flex-1 flex flex-col overflow-y-auto border-r border-[#1a1a1c]">
          <header className="p-12 md:p-[50px_60px_20px_60px] flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="header-left">
              <span className="text-[10px] uppercase tracking-[4px] text-[#52525b] mb-2.5 block">Secure Proctored Environment</span>
              <h1 className="font-['Playfair_Display'] text-[38px] italic font-bold tracking-tight">{decodeURIComponent(subjectName || '')}</h1>
            </div>
            <div className="relative w-full md:w-[400px]">
              <Input 
                className="bg-[#0c0c0d] border-[#1a1a1c] p-[12px_20px] rounded-sm text-white text-[13px] h-11 focus:border-[#444] transition-all"
                placeholder="Filter by sequence or set ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </header>

          <div className="p-2.5 md:p-[10px_60px_30px_60px] flex flex-wrap gap-3">
            <button className={cn("p-[8px_20px] rounded-sm text-[11px] font-extrabold uppercase bg-transparent border border-[#1a1a1c] text-[#52525b] transition-all", !selectedTopic && "bg-white text-black border-white")}>All Sets</button>
            <button className="p-[8px_20px] rounded-sm text-[11px] font-extrabold uppercase bg-transparent border border-[#1a1a1c] text-[#52525b]">OPPE 1</button>
            <button className="p-[8px_20px] rounded-sm text-[11px] font-extrabold uppercase bg-transparent border border-[#1a1a1c] text-[#52525b]">OPPE 2</button>
            <button className="p-[8px_20px] rounded-sm text-[11px] font-extrabold uppercase bg-transparent border border-[#1a1a1c] text-[#52525b] md:ml-auto">Security History ▾</button>
          </div>

          <div className="p-0 md:p-[0_60px_60px_60px] space-y-3">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <div className="font-extrabold text-2xl tracking-[10px] animate-pulse">CODÉVO</div>
               </div>
            ) : filteredData.map((set) => (
              <div key={set.name} className="bg-[#0a0a0b] border border-[#1a1a1c] p-7 md:p-[28px_35px] flex flex-col md:flex-row items-center rounded-sm transition-all hover:border-[#333] hover:scale-[1.005]">
                <div className="w-[54px] h-[54px] bg-black border border-[#1a1a1c] flex items-center justify-center mr-0 md:mr-8 text-[#333] rounded-sm shrink-0 mb-4 md:mb-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-[22px] font-bold tracking-tight">{set.title}</h3>
                  <div className="inline-flex items-center gap-2 bg-[#ef444408] border border-[#ef44441a] p-[4px_10px] rounded-[2px] text-[9px] uppercase font-extrabold text-[#ef4444] mt-2.5">
                    <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]" /> Secure Session
                  </div>
                </div>
                <div className="bg-[#ffffff05] border border-[#1a1a1c] rounded-sm p-[8px_18px] font-mono text-[15px] text-[#888] mx-0 md:mx-8 mb-4 md:mb-0">SET {String(set.sequence_number || 1).padStart(2, '0')}</div>
                <div className="bg-[#ffffff05] border border-[#1a1a1c] rounded-sm p-[8px_18px] font-mono text-[15px] text-[#888] mx-0 md:mx-8 mb-6 md:mb-0 uppercase">{set.totalTime} MIN</div>
                <button 
                  onClick={() => handleStart(set.name, true)}
                  className="bg-white text-black p-[16px_45px] text-[11px] font-extrabold uppercase tracking-[2px] transition-all active:scale-95"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        </main>

        {/* --- SIDE PROFILE & LEADERBOARD --- */}
        <div className="hidden lg:flex w-[420px] bg-[#070708] p-[50px_40px] flex-col overflow-y-auto">
          <div className="flex items-baseline gap-4 mb-12">
            <span className="text-[84px] font-light leading-none tracking-[-4px]">08</span>
            <span className="font-['Playfair_Display'] italic text-2xl text-[#52525b]">Solved</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm">
              <span className="text-[22px] font-bold block mb-1">2,450</span>
              <span className="text-[10px] color-[#444] uppercase font-extrabold tracking-widest">Points</span>
            </div>
            <div className="bg-[#0c0c0e] border border-[#1a1a1c] p-5 rounded-sm">
              <span className="text-[22px] font-bold block mb-1">99.2th</span>
              <span className="text-[10px] color-[#444] uppercase font-extrabold tracking-widest">Percentile</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#1a1a1c]">
            <h3 className="text-[11px] uppercase tracking-[2px] text-[#666] font-bold">Leaderboard</h3>
            <button onClick={() => setIsLeaderboardOpen(true)} className="bg-transparent border border-[#333] text-[#888] text-[9px] p-[5px_12px] rounded-sm uppercase font-extrabold hover:bg-white hover:text-black hover:border-white transition-all">Detail View</button>
          </div>

          <div className="divide-y divide-[#ffffff05]">
            <div className="flex justify-between py-3.5 items-center">
              <div className="flex items-center gap-4"><span className="font-mono text-[10px] text-[#333]">01</span><span className="text-sm font-medium">A. Veratti</span></div>
              <span className="font-mono text-[12px] text-white">99.8th %</span>
            </div>
            <div className="flex justify-between py-3.5 items-center">
              <div className="flex items-center gap-4"><span className="font-mono text-[10px] text-[#333]">02</span><span className="text-sm font-medium">L. Bianchi</span></div>
              <span className="font-mono text-[12px] text-white">99.6th %</span>
            </div>
            <div className="flex justify-between py-3.5 items-center">
              <div className="flex items-center gap-4"><span className="font-mono text-[10px] text-[#333]">03</span><span className="text-sm font-medium">M. Romano</span></div>
              <span className="font-mono text-[12px] text-white">99.1th %</span>
            </div>
          </div>
        </div>

        {/* --- FULL SCREEN LEADERBOARD MODAL --- */}
        {isLeaderboardOpen && (
          <div className="fixed inset-0 bg-black z-[1000] flex flex-col p-20 md:p-[80px_100px] overflow-y-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-[60px] pb-[30px] border-b border-[#111]">
              <div>
                <p className="uppercase tracking-[5px] text-[#444] text-[10px] mb-2.5">Deep Dive Analytics</p>
                <h2 className="font-['Playfair_Display'] text-[48px] italic font-bold">Performance Ranking Archive</h2>
              </div>
              <button onClick={() => setIsLeaderboardOpen(false)} className="bg-white text-black p-[12px_30px] text-[11px] font-extrabold uppercase transition-all active:scale-95">Back to Archive</button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Rank</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Candidate</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Secured Tests</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Avg. Marks</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Total Pts</th>
                  <th className="p-5 text-[10px] uppercase tracking-[2px] text-[#444] font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm divide-y divide-[#111]">
                {[
                  { r: '01', n: 'Alessandro Veratti', t: '14/15', m: '94.2%', p: '5,820', s: 'Elite' },
                  { r: '02', n: 'Lucia Bianchi', t: '13/15', m: '92.8%', p: '5,410', s: 'Elite' },
                  { r: '03', n: 'Marco Romano', t: '15/15', m: '89.4%', p: '5,150', s: 'Candidate' },
                ].map((row) => (
                  <tr key={row.r} className="hover:bg-[#ffffff05] transition-colors">
                    <td className="p-5 text-[#888]">{row.r}</td>
                    <td className="p-5 text-white">{row.n}</td>
                    <td className="p-5 text-white">{row.t}</td>
                    <td className="p-5 text-white">{row.m}</td>
                    <td className="p-5 text-white">{row.p}</td>
                    <td className="p-5">
                      <span className={cn("p-[4px_10px] rounded-sm text-[10px] font-extrabold bg-[#222] text-[#888]", row.s === 'Elite' && "bg-[#10b9811a] text-[#10b981]")}>
                        {row.s}
                      </span>
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

  // --- PRACTICE MODE VIEW (AS BEFORE) ---
  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans select-none">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />
      <aside className="hidden lg:flex w-[260px] border-r border-[#1f1f23] bg-[#080808] p-[40px_25px] flex-col shrink-0">
        <div className="flex flex-col h-full">
          <span className="font-extrabold text-[22px] tracking-tight mb-10 block uppercase cursor-pointer" onClick={() => navigate('/')}>CODÉVO</span>
          <nav className="flex flex-col gap-1 pr-2 overflow-y-auto">
            <button onClick={() => setSelectedTopic(null)} className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left", selectedTopic === null ? "text-white" : "text-[#666] hover:text-white")}>
              <FolderSticker active={selectedTopic === null} />All Problems
            </button>
            {topics.map((topic: string) => (
              <button key={topic} onClick={() => setSelectedTopic(topic)} className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left truncate", selectedTopic === topic ? "text-white" : "text-[#666] hover:text-white")}>
                <SubTopicHashtag active={selectedTopic === topic} />{topic}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative bg-[#050505]">
        <header className="px-6 py-8 md:p-[40px_60px] border-b border-[#1f1f23] sticky top-0 bg-[#050505]/95 backdrop-blur-md z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden -ml-2 text-white"><Menu className="w-6 h-6" /></Button></SheetTrigger>
                <SheetContent side="left" className="bg-[#080808] border-[#1f1f23] p-[40px_25px] text-white w-[280px]">
                  <span className="font-extrabold text-[22px] block uppercase mb-10">CODÉVO</span>
                  <nav className="flex flex-col gap-1">
                    <button onClick={() => setSelectedTopic(null)} className={cn("flex items-center gap-3 py-3 text-[13px] font-medium", !selectedTopic ? "text-white" : "text-[#666]")}>All Problems</button>
                    {topics.map((t: string) => <button key={t} onClick={() => setSelectedTopic(t)} className={cn("text-[13px] py-3 text-left", selectedTopic === t ? "text-white" : "text-[#666]")}>{t}</button>)}
                  </nav>
                </SheetContent>
              </Sheet>
              <div>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-white transition-all mb-2"><ArrowLeft className="w-3 h-3" />Return</button>
                <h1 className="text-xl md:text-[28px] font-bold tracking-tight leading-none uppercase">{decodeURIComponent(subjectName || '')}</h1>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46] z-30" />
              <div className="relative flex items-center h-11 bg-[#0d0d0d] border border-[#1f1f23] rounded-md overflow-hidden">
                <ScrollingPlaceholder statements={searchPlaceholders} visible={searchTerm === ''} />
                <Input className="bg-transparent border-none text-white h-full w-full pl-10 pr-4 text-xs font-mono focus-visible:ring-0 z-20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8 md:p-[40px_60px] max-w-[1200px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
               <div className="font-extrabold text-4xl md:text-[42px] tracking-[12px] text-white animate-pulse uppercase">CODÉVO</div>
               <div className="flex gap-2"><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" /></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1f1f23] rounded-sm font-mono text-xs uppercase tracking-widest">Zero results found in this directory</div>
          ) : filteredData.map((assignment: any) => {
            const isLocked = assignment.is_unlocked === false;
            const isExpanded = expandedQuestion === assignment.id;
            return (
              <div key={assignment.id} className="relative mb-[15px]">
                {isLocked && <PremiumLockOverlay />}
                <div className={cn("bg-[#0d0d0d] border border-[#1f1f23] rounded-sm transition-all duration-300", isExpanded && "border-[#444] shadow-[0_0_30px_rgba(255,255,255,0.02)]")}>
                  <div className={cn("flex flex-wrap md:flex-nowrap items-center p-5 md:p-[24px_30px] cursor-pointer gap-6", isLocked && "opacity-50 cursor-not-allowed")} onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : assignment.id)}>
                    <div className="w-[48px] h-[48px] bg-[#141414] border border-[#1f1f23] flex items-center justify-center text-[#555] rounded-sm shrink-0"><Code2 size={22} /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-lg md:text-[22px] font-bold text-white mb-[10px] leading-tight pr-4 tracking-tight">{assignment.title}</h3><div className="inline-flex bg-white/[0.03] border border-[#1f1f23] p-[5px_12px] rounded-[6px] text-[10px] text-[#666] uppercase font-bold tracking-[0.5px]">{assignment.category || 'Standard Lab'}</div></div>
                    <div className="flex items-center gap-[10px] bg-white/[0.03] border border-[#1f1f23] p-[7px_16px] rounded-[6px] shrink-0"><span className={cn("w-[7px] h-[7px] rounded-full", assignment.difficulty === 'Hard' ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444]" : "bg-[#10b981] shadow-[0_0_10px_#10b981]")} /><span className="text-white text-[11px] font-extrabold uppercase tracking-widest">{assignment.difficulty || 'Easy'}</span></div>
                    <div className="bg-white/[0.03] border border-[#1f1f23] rounded-[6px] p-[7px_15px] font-mono text-[17px] text-[#ccc] shrink-0">{String(assignment.expected_time || 20).padStart(2, '0')} MIN</div>
                  </div>
                  <div className={cn("bg-[#090909] transition-all duration-400 ease-in-out px-5 md:px-[30px] overflow-hidden", isExpanded ? "max-h-[600px] border-t border-[#1f1f23] py-8 md:py-10 opacity-100" : "max-h-0 py-0 opacity-0")}>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 lg:gap-[60px]">
                      <div className="flex-1 w-full space-y-6">
                        <div className="flex items-center gap-[12px]"><span className="text-[11px] text-[#666] font-bold uppercase tracking-widest">Set Duration</span><div className={cn("flex items-center gap-[10px]", noTimeLimit && "opacity-30 pointer-events-none")}><input type="text" className="bg-black border border-[#1f1f23] text-white w-[65px] p-[10px] text-center font-mono rounded-[4px] text-[16px]" value={timeLimit[0]} readOnly /><span className="text-[12px] text-[#444] font-semibold uppercase tracking-widest">min</span></div></div>
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
