import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Search, Layers, Filter, Clock, Play, 
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock, Menu, Code2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- CUSTOM DESIGN: PREMIUM FOLDER STICKER ---
const FolderSticker = ({ active }: { active: boolean }) => (
  <div className={cn("relative transition-all duration-300 shrink-0", active ? "scale-105 opacity-100" : "opacity-40 hover:opacity-70")}>
    <div className="filter drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.5)]">
      <div className="relative w-[26px] h-[18px]">
        <div 
          className="absolute top-[-4.2px] left-0 w-[16px] h-[5.2px] bg-[#f39233] border-[1px] border-[#2d1d1a] border-b-0 rounded-tl-[2.2px] rounded-tr-[3.4px]"
          style={{ clipPath: 'polygon(0 0, 78% 0, 100% 100%, 0 100%)' }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#ffce8c] to-[#f7b65d] border-[1px] border-[#2d1d1a] rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3.8px] bg-[#f39233] border-b-[1px] border-[#2d1d1a]" />
        </div>
      </div>
    </div>
  </div>
);

// --- CUSTOM DESIGN: TOPIC HASHTAG ICON ---
const SubTopicHashtag = ({ active }: { active: boolean }) => (
  <div className={cn("relative w-4 h-4 shrink-0 transition-opacity duration-300", active ? "opacity-100" : "opacity-30")}>
    <div className="absolute left-[30%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);

// --- CUSTOM DESIGN: DARK THEME OUTLINE TOGGLE ---
const ArchiveToggle = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <label className="relative inline-block w-[94px] h-[42px] cursor-pointer">
    <input type="checkbox" className="opacity-0 w-0 h-0" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className={cn(
      "absolute inset-0 border-2 rounded-[40px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
      checked ? "border-[#5ec952]" : "border-[#ef4444]"
    )}>
      <span className={cn(
        "absolute bottom-[4px] left-[4px] h-[30px] w-[30px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        checked ? "translate-x-[52px] bg-[#5ec952]" : "translate-x-0 bg-[#ef4444]"
      )} />
      <span className={cn(
        "absolute top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-white tracking-[0.5px] uppercase transition-all duration-300",
        checked ? "left-[14px]" : "right-[14px]"
      )}>
        {checked ? "ON" : "OFF"}
      </span>
    </span>
  </label>
);

// --- CUSTOM DESIGN: SCROLLING PLACEHOLDER COMPONENT ---
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
      <span ref={textRef} className={cn("text-[10px] uppercase font-bold tracking-widest text-[#3f3f46] font-sans whitespace-nowrap", shouldScroll ? "animate-placeholder-scroll" : "")}>
        {statements[index]}
      </span>
      <style>{`
        @keyframes placeholder-scroll { 0%, 25% { transform: translateX(0); } 75%, 100% { transform: translateX(calc(-100% + 200px)); } }
        .animate-placeholder-scroll { animation: placeholder-scroll 8s ease-in-out infinite alternate; }
      `}</style>
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

  const searchPlaceholders = [
    'Filter results by searching for a specific level like "Easy", "Medium", or "Hard"...',
    'Enter a topic "name" to find modules within this subject archive...',
    'Search for specific question "titles" to find them instantly...',
    'Filter by module "category" to narrow down your archive search...'
  ];

  // --- DATA FETCHING (ORIGINAL LOGIC) ---
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
        
        if (error) {
          console.error("Error fetching proctored sets:", error);
          throw error;
        }
        
        const setMap: Record<string, { totalTime: number; title: string; sequence_number: number; description: string }> = {};
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               setMap[item.set_name] = { 
                 totalTime: 0, 
                 title: item.title || item.set_name,
                 description: item.description || '',
                 sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });

        const sets = Object.entries(setMap).map(([name, val]) => ({ 
          name, 
          totalTime: val.totalTime,
          title: val.title,
          description: val.description,
          sequence_number: val.sequence_number
        }));
        
        return sets.sort((a, b) => a.sequence_number - b.sequence_number);
      } else {
        const { data, error } = await supabase
          .from('iitm_assignments')
          .select('*')
          .eq('subject_id', subjectId)
          .ilike('exam_type', currentExamType)
          .order('title');
        
        if (error) throw error;
        return data || [];
      }
    }
  });

  // --- DERIVED DATA (ORIGINAL LOGIC) ---
  const topics = useMemo(() => {
    if (isProctored) return [];
    // @ts-ignore
    const uniqueTopics = new Set(fetchedData.map(a => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  const filteredData = useMemo(() => {
    if (isProctored) {
      return (fetchedData as { name: string, title: string, totalTime: number }[]).filter(set => 
        (set.title || set.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return (fetchedData as any[]).filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTopic = selectedTopic ? (a.category || 'General') === selectedTopic : true;
        return matchesSearch && matchesTopic;
      });
    }
  }, [fetchedData, searchTerm, selectedTopic, isProctored]);

  // --- HANDLERS ---
  const handleStart = async (targetId: string, isSetSelection = false) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) {
      setShowProfileSheet(true);
      return;
    }

    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      timer: noTimeLimit ? '0' : timeLimit[0].toString(),
      mode: mode || 'learning'
    });

    if (isSetSelection) { params.set('set_name', targetId); } else { params.set('q', targetId); }

    if (isProctored) { navigate(`/exam?${params.toString()}`); } else { navigate(`/practice?${params.toString()}`); }
  };

  const handleManualTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) { setTimeLimit([val]); }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <span className="font-extrabold text-[22px] tracking-tight mb-10 block uppercase cursor-pointer" onClick={() => navigate('/')}>CODÉVO</span>
      <nav className="flex flex-col gap-1 pr-2 overflow-y-auto">
        <button 
          onClick={() => setSelectedTopic(null)}
          className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left", selectedTopic === null ? "text-white" : "text-[#666] hover:text-white")}
        >
          <FolderSticker active={selectedTopic === null} /> All Problems
        </button>
        {!isProctored && topics.map((topic: string) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={cn("flex items-center gap-3 py-3 text-[13px] font-medium transition-colors text-left truncate", selectedTopic === topic ? "text-white" : "text-[#666] hover:text-white")}
          >
            <SubTopicHashtag active={selectedTopic === topic} /> {topic}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans select-none">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />

      {/* --- SIDEBAR --- */}
      {!isProctored && (
        <aside className="hidden lg:flex w-[260px] border-r border-[#1f1f23] bg-[#080808] p-[40px_25px] flex-col shrink-0">
          <SidebarContent />
        </aside>
      )}

      {/* --- RIGHT CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative overflow-y-auto">
        <header className="px-6 py-8 md:p-[40px_60px] border-b border-[#1f1f23] sticky top-0 bg-[#050505]/95 backdrop-blur-md z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {!isProctored && (
                <Sheet>
                  <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden -ml-2"><Menu className="w-6 h-6" /></Button></SheetTrigger>
                  <SheetContent side="left" className="bg-[#080808] border-[#1f1f23] p-[40px_25px] text-white w-[280px]"><SidebarContent /></SheetContent>
                </Sheet>
              )}
              <div>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666] hover:text-white mb-2"><ArrowLeft className="w-3 h-3" />Return</button>
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
          {isProctored && <Badge variant="outline" className="mt-4 border-red-500/20 bg-red-500/5 uppercase tracking-widest text-[10px] text-red-400">{decodeURIComponent(examType || '')}</Badge>}
        </header>

        <div className="px-6 py-8 md:p-[40px_60px] max-w-[1200px] w-full mx-auto space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="font-extrabold text-4xl md:text-[42px] tracking-[12px] text-white animate-pulse uppercase select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">CODÉVO</div>
              <div className="flex gap-2"><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" /></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1f1f23] rounded-sm font-mono text-xs uppercase tracking-widest">Zero results found in directory</div>
          ) : isProctored ? (
            /* --- PROCTORED VIEW (ORIGINAL CARDS WITH REDESIGN COLORS) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filteredData as any[]).map((set) => (
                <div key={set.name} className="bg-[#0d0d0d] rounded-sm border border-[#1f1f23] p-8 hover:border-[#444] transition-all duration-300 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">{set.name}</span>
                    <div className="flex items-center gap-1.5 text-red-400 bg-red-400/5 px-2 py-1 rounded-sm border border-red-400/10"><Lock size={12} strokeWidth={2.5} /><span className="text-[10px] font-extrabold tracking-widest">SECURE</span></div>
                  </div>
                  <div className="space-y-3 mb-auto"><h2 className="text-xl font-bold text-white tracking-tight">{set.title}</h2><p className="text-[11px] text-[#666] font-mono leading-relaxed uppercase tracking-widest">{set.description || "Set details classified."}</p></div>
                  <div className="mt-8 flex items-center gap-6 pb-8 border-b border-[#1f1f23]">
                    <div className="flex items-center gap-3"><Clock size={16} className="text-[#3f3f46]" /><div className="flex flex-col"><span className="text-[9px] uppercase tracking-[1.5px] text-[#3f3f46] font-bold">Duration</span><span className="text-xs font-mono text-white">{set.totalTime} MIN</span></div></div>
                    <div className="flex items-center gap-3"><Layers size={16} className="text-[#3f3f46]" /><div className="flex flex-col"><span className="text-[9px] uppercase tracking-[1.5px] text-[#3f3f46] font-bold">Sequence</span><span className="text-xs font-mono text-white">{String(set.sequence_number || 1).padStart(2, '0')}</span></div></div>
                  </div>
                  <button onClick={() => handleStart(set.name, true)} className="mt-8 w-full py-4 bg-white text-black font-extrabold text-[11px] uppercase tracking-[2px] rounded-sm hover:bg-[#e0e0e0]">Start Proctored Exam</button>
                </div>
              ))}
            </div>
          ) : (
            /* --- PRACTICE VIEW (ORIGINAL COLLAPSIBLE WITH REDESIGN) --- */
            filteredData.map((assignment: any) => {
              const isLocked = assignment.is_unlocked === false;
              return (
                <div key={assignment.id} className="relative mb-[15px]">
                  {isLocked && <PremiumLockOverlay />}
                  <Collapsible 
                    disabled={isLocked}
                    open={!isLocked && expandedQuestion === assignment.id} 
                    onOpenChange={(isOpen) => { if (!isLocked) { setExpandedQuestion(isOpen ? assignment.id : null); if (isOpen) { setTimeLimit([assignment.expected_time || 20]); setNoTimeLimit(false); } } }}
                    className={cn("bg-[#0d0d0d] border border-[#1f1f23] rounded-sm transition-all duration-300", !isLocked && expandedQuestion === assignment.id && "border-[#444] shadow-[0_0_30px_rgba(255,255,255,0.02)]")}
                  >
                    <CollapsibleTrigger className={cn("w-full flex items-center p-5 md:p-[24px_30px] gap-6", isLocked && "opacity-50 cursor-not-allowed")}>
                      <div className="w-[48px] h-[48px] bg-[#141414] border border-[#1f1f23] flex items-center justify-center text-[#555] rounded-sm shrink-0">{isLocked ? <Lock size={22} /> : <FileCode2 size={22} />}</div>
                      <div className="flex-1 text-left min-w-0"><h3 className="text-lg md:text-[22px] font-bold text-white mb-[10px] leading-tight pr-4 tracking-tight">{assignment.title}</h3><Badge variant="outline" className="text-[10px] text-[#666] border-[#1f1f23] bg-white/[0.03] uppercase">{assignment.category || 'General'}</Badge></div>
                      {!isLocked && <div className="flex items-center gap-[10px] bg-white/[0.03] border border-[#1f1f23] p-[7px_16px] rounded-[6px] mr-[20px] shrink-0"><span className={cn("w-[7px] h-[7px] rounded-full", assignment.difficulty === 'Hard' ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444]" : "bg-[#10b981] shadow-[0_0_10px_#10b981]")} /><span className="text-white text-[11px] font-extrabold uppercase tracking-widest">{assignment.difficulty || 'Easy'}</span></div>}
                      <div className="bg-white/[0.03] border border-[#1f1f23] rounded-[6px] p-[7px_15px] font-mono text-[17px] text-[#ccc] shrink-0">{String(assignment.expected_time || 20).padStart(2, '0')} MIN</div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-[#090909] border-t border-[#1f1f23] p-8 md:p-10 transition-all">
                        <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
                          <div className="flex-1 w-full space-y-6">
                            <div className="flex items-center gap-[12px]"><span className="text-[11px] text-[#666] font-bold uppercase tracking-widest">Set Duration</span><div className={cn("flex items-center gap-[10px]", noTimeLimit && "opacity-30 pointer-events-none")}><Input type="number" className="bg-black border border-[#1f1f23] text-white w-[85px] p-[10px] text-center font-mono rounded-[4px] text-[16px]" value={timeLimit[0]} onChange={handleManualTimeInput} /><span className="text-[12px] text-[#444] font-semibold uppercase uppercase tracking-widest">min</span></div></div>
                            <div className={cn("w-full transition-opacity", noTimeLimit && "opacity-30 pointer-events-none")}><Slider value={timeLimit} onValueChange={setTimeLimit} min={2} max={30} step={2} className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&>.relative>.absolute]:bg-white py-4" /><div className="flex justify-between text-[9px] text-[#3f3f46] font-mono uppercase mt-4 tracking-widest"><span>2 min</span><span>15 min</span><span>30 min</span></div></div>
                          </div>
                          <div className="flex flex-col items-end gap-8 shrink-0 w-full lg:w-auto">
                            <ArchiveToggle checked={noTimeLimit} onChange={setNoTimeLimit} label="Free Mode" />
                            <button onClick={() => handleStart(assignment.id)} className="w-full lg:w-auto bg-white text-black p-[16px_50px] text-[11px] font-extrabold uppercase tracking-[2px] rounded-sm hover:bg-[#e0e0e0] flex items-center justify-center gap-3">
                              {noTimeLimit ? <InfinityIcon size={14} strokeWidth={3} /> : <Play size={14} fill="black" />} Start Practice
                            </button>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
