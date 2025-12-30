import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, Search, Layers, Clock, Play, 
  Infinity as InfinityIcon, Code2, Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

// --- PREMIUM FOLDER STICKER ---
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

// --- CUSTOM SCROLLING PLACEHOLDER COMPONENT ---
const ScrollingPlaceholder = ({ statements, visible }: { statements: string[], visible: boolean }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % statements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [statements.length]);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldScroll(textRef.current.offsetWidth > containerRef.current.offsetWidth - 40);
    }
  }, [index]);

  if (!visible) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none flex items-center pl-10 pr-4 overflow-hidden whitespace-nowrap">
      <span 
        ref={textRef}
        className={cn(
          "text-xs text-[#3f3f46] font-mono",
          shouldScroll ? "animate-placeholder-scroll" : ""
        )}
      >
        {statements[index]}
      </span>
      <style>{`
        @keyframes placeholder-scroll {
          0% { transform: translateX(0); }
          30% { transform: translateX(0); }
          70% { transform: translateX(calc(-100% + 180px)); }
          100% { transform: translateX(calc(-100% + 180px)); }
        }
        .animate-placeholder-scroll {
          animation: placeholder-scroll 4s ease-in-out infinite alternate;
        }
      `}</style>
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

  const searchPlaceholders = [
    'Search for questions related to specific levels like "Easy" or "Hard"...',
    'Enter a topic name to filter modules in this subject archive...',
    'Type the name of a specific question to find it instantly...',
    'Filter results by searching for a specific module category...'
  ];

  // --- DATA FETCHING ---
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
                 totalTime: 0, 
                 title: item.title || item.set_name,
                 description: item.description || '',
                 sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });

        return Object.entries(setMap).map(([name, val]) => ({ 
          name, 
          totalTime: val.totalTime,
          title: val.title,
          description: val.description,
          sequence_number: val.sequence_number
        })).sort((a, b) => a.sequence_number - b.sequence_number);
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

  // --- FILTERING LOGIC ---
  const topics = useMemo(() => {
    if (isProctored) return [];
    const uniqueTopics = new Set(fetchedData.map((a: any) => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  const filteredData = useMemo(() => {
    return (fetchedData as any[]).filter(item => {
      const title = item.title || item.name || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopic = isProctored ? true : (selectedTopic ? (item.category || 'General') === selectedTopic : true);
      return matchesSearch && matchesTopic;
    });
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

    if (isSetSelection) {
      params.set('set_name', targetId);
      navigate(`/exam?${params.toString()}`);
    } else {
      params.set('q', targetId);
      navigate(`/practice?${params.toString()}`);
    }
  };

  const handleManualTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setTimeLimit([val]);
    }
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex overflow-hidden font-sans select-none">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />

      {/* --- SIDEBAR --- */}
      <aside className="w-[260px] border-r border-[#1f1f23] bg-[#080808] p-[40px_25px] flex flex-col shrink-0">
        <span className="font-extrabold text-[22px] tracking-tight mb-[50px] block cursor-pointer uppercase" onClick={() => navigate('/')}>
          CODÉVO
        </span>
        <nav className="flex flex-col gap-1 overflow-y-auto pr-2">
          <button 
            onClick={() => setSelectedTopic(null)}
            className={cn(
              "flex items-center gap-[12px] p-[12px_0] text-[13px] font-medium transition-colors text-left",
              selectedTopic === null ? "text-white" : "text-[#666666] hover:text-white"
            )}
          >
            <FolderSticker active={selectedTopic === null} />
            All Problems
          </button>
          {!isProctored && topics.map((topic: string) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={cn(
                "flex items-center gap-[12px] p-[12px_0] text-[13px] font-medium transition-colors text-left truncate",
                selectedTopic === topic ? "text-white" : "text-[#666666] hover:text-white"
              )}
            >
              <SubTopicHashtag active={selectedTopic === topic} />
              {topic}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-[#050505]">
        <header className="p-[40px_60px] border-b border-[#1f1f23] sticky top-0 bg-[#050505]/90 backdrop-blur-md z-20">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#666666] hover:text-white transition-all mb-4"
              >
                <ArrowLeft className="w-3 h-3" />
                Return
              </button>
              <h1 className="text-[28px] font-bold tracking-tight leading-none uppercase">{decodeURIComponent(subjectName || '')}</h1>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3f3f46] z-10" />
              <div className="relative flex items-center h-11 bg-[#0d0d0d] border border-[#1f1f23] rounded-md">
                <ScrollingPlaceholder statements={searchPlaceholders} visible={searchTerm === ''} />
                <Input 
                  className="bg-transparent border-none text-white h-full w-full pl-10 pr-4 text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
             {isProctored && (
               <Badge variant="outline" className="border-white/10 bg-white/5 uppercase tracking-widest text-[10px] text-red-400">
                 {decodeURIComponent(examType || 'Proctored')}
               </Badge>
             )}
          </div>
        </header>

        <div className="p-[40px_60px] max-w-[1200px] w-full mx-auto">
          {isLoading ? (
            <div className="text-center py-20 text-[#666666] font-mono text-xs uppercase tracking-[3px] animate-pulse">Initializing archive...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-[#3f3f46] border border-dashed border-[#1f1f23] rounded-sm font-mono text-xs uppercase tracking-widest">
              Zero results found in this directory
            </div>
          ) : filteredData.map((item: any) => {
            const id = isProctored ? item.name : item.id;
            const isExpanded = expandedQuestion === id;
            const isLocked = !isProctored && item.is_unlocked === false;

            return (
              <div key={id} className="relative mb-[15px]">
                {isLocked && <PremiumLockOverlay />}
                <div className={cn(
                  "bg-[#0d0d0d] border border-[#1f1f23] rounded-sm transition-all duration-300",
                  isExpanded && "border-[#444] shadow-[0_0_30px_rgba(255,255,255,0.02)]"
                )}>
                  <div 
                    className={cn("flex items-center p-[24px_30px] cursor-pointer", isLocked && "opacity-50 cursor-not-allowed")}
                    onClick={() => !isLocked && setExpandedQuestion(isExpanded ? null : id)}
                  >
                    <div className="w-[48px] h-[48px] bg-[#141414] border border-[#1f1f23] flex items-center justify-center mr-[25px] text-[#555] rounded-sm shrink-0">
                       {isProctored ? <Layers size={22} /> : <Code2 size={22} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[22px] font-bold text-white mb-[10px] leading-tight truncate pr-4 tracking-tight">
                        {item.title || item.name}
                      </h3>
                      <div className="inline-flex bg-white/[0.03] border border-[#1f1f23] p-[5px_12px] rounded-[6px] text-[10px] text-[#666666] uppercase font-bold tracking-[0.5px]">
                        {isProctored ? decodeURIComponent(examType || '') : (item.category || 'Standard Lab')}
                      </div>
                    </div>

                    <div className="flex items-center gap-[10px] bg-white/[0.03] border border-[#1f1f23] p-[7px_16px] rounded-[6px] mr-[20px] shrink-0">
                      <span className={cn(
                        "w-[7px] h-[7px] rounded-full",
                        isProctored || item.difficulty === 'Hard' 
                          ? "bg-[#ef4444] shadow-[0_0_10px_#ef4444]" 
                          : "bg-[#10b981] shadow-[0_0_10px_#10b981]"
                      )} />
                      <span className="text-white text-[11px] font-extrabold uppercase tracking-widest">
                        {isProctored ? 'Secure' : (item.difficulty || 'Easy')}
                      </span>
                    </div>

                    <div className="bg-white/[0.03] border border-[#1f1f23] rounded-[6px] p-[7px_15px] font-mono text-[17px] text-[#ccc] shrink-0">
                      {String(item.totalTime || item.expected_time || 20).padStart(2, '0')} MIN
                    </div>
                  </div>

                  <div className={cn(
                    "bg-[#090909] transition-all duration-400 ease-in-out px-[30px] overflow-hidden",
                    isExpanded ? "max-h-[500px] border-t border-[#1f1f23] p-[40px_30px] opacity-100" : "max-h-0 py-0 opacity-0"
                  )}>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-[60px]">
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-[12px] mb-[25px]">
                          <span className="text-[11px] text-[#666666] font-bold uppercase tracking-widest">Set Duration</span>
                          <div className={cn("flex items-center gap-[10px]", noTimeLimit && "opacity-30 pointer-events-none")}>
                            <input 
                              type="text" 
                              className="bg-black border border-[#1f1f23] text-white w-[65px] p-[10px] text-center font-mono rounded-[4px] text-[16px] focus:outline-none focus:border-[#444]"
                              value={timeLimit[0]}
                              onChange={handleManualTimeInput}
                            />
                            <span className="text-[12px] text-[#444] font-semibold uppercase tracking-widest">min</span>
                          </div>
                        </div>
                        
                        <div className={cn("w-full mt-2.5 transition-opacity duration-300", noTimeLimit && "opacity-30 pointer-events-none")}>
                          <Slider 
                            value={timeLimit} 
                            onValueChange={setTimeLimit} 
                            min={2} 
                            max={30} 
                            step={2} 
                            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&_[role=slider]]:shadow-none [&>.relative>.absolute]:bg-white py-4"
                          />
                          <div className="flex justify-between text-[9px] text-[#3f3f46] font-mono uppercase tracking-[1.5px] mt-4">
                            <span>02 MIN</span>
                            <span>15 MIN</span>
                            <span>30 MIN (OVERRIDE)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-[20px] shrink-0 w-full md:w-auto mt-8 md:mt-0">
                        <div className="flex items-center gap-[12px] text-[11px] text-[#666666] font-bold uppercase tracking-widest">
                          <span>Free Mode</span>
                          <div className="scale-90">
                            <Switch 
                              checked={noTimeLimit} 
                              onCheckedChange={setNoTimeLimit} 
                              className="data-[state=checked]:bg-white"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleStart(id, isProctored)}
                          className="w-full md:w-auto bg-white text-black p-[16px_50px] text-[11px] font-extrabold uppercase tracking-[2px] rounded-[2px] hover:bg-[#e0e0e0] transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95 flex items-center justify-center gap-3"
                        >
                          {noTimeLimit ? <InfinityIcon size={14} strokeWidth={3} /> : (isProctored ? <Lock size={14} /> : <Play size={14} fill="black" />)}
                          {isProctored ? 'Initiate Session' : 'Start Practice'}
                        </button>
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
