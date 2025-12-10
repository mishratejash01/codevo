import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, Search, Layers, Filter, Clock, Play, 
  Infinity as InfinityIcon, ChevronRight, FileCode2, Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkUserProfile, ProfileSheet } from '@/components/ProfileCompletion';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

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

  // --- DATA FETCHING ---
  const { data: fetchedData = [], isLoading } = useQuery({
    queryKey: ['selection_data', subjectId, examType, mode],
    queryFn: async () => {
      const currentExamType = decodeURIComponent(examType || '');

      if (isProctored) {
        // --- PROCTORED MODE ---
        // Fetch sets from 'iitm_exam_question_bank'
        // UPDATED: Added 'description' to the query
        const { data, error } = await supabase
          .from('iitm_exam_question_bank')
          .select('set_name, expected_time, title, sequence_number, description')
          .eq('subject_id', subjectId) 
          .ilike('exam_type', currentExamType); 
        
        if (error) {
          console.error("Error fetching proctored sets:", error);
          throw error;
        }
        
        // Aggregate: Sum expected_time for each set and capture Title, Description & Sequence
        const setMap: Record<string, { totalTime: number; title: string; sequence_number: number; description: string }> = {};
        
        data?.forEach(item => {
           if (item.set_name) {
             if (!setMap[item.set_name]) {
               // Initialize with the first title/sequence/description found for this set
               setMap[item.set_name] = { 
                 totalTime: 0, 
                 title: item.title || item.set_name,
                 description: item.description || '',
                 // Use sequence_number from DB, default to 9999 if null
                 sequence_number: item.sequence_number ?? 9999 
               };
             }
             setMap[item.set_name].totalTime += (item.expected_time || 0);
           }
        });

        // Convert to array of objects
        const sets = Object.entries(setMap).map(([name, val]) => ({ 
          name, 
          totalTime: val.totalTime,
          title: val.title,
          description: val.description,
          sequence_number: val.sequence_number
        }));
        
        // Sort by sequence_number ascending
        return sets.sort((a, b) => a.sequence_number - b.sequence_number);
      } else {
        // --- PRACTICE MODE ---
        // Fetch assignments from 'iitm_assignments'
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

  // --- DERIVED DATA ---
  const topics = useMemo(() => {
    if (isProctored) return [];
    // @ts-ignore
    const uniqueTopics = new Set(fetchedData.map(a => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [fetchedData, isProctored]);

  const filteredData = useMemo(() => {
    if (isProctored) {
      // Filter Sets based on search (checking both Title and Set Name)
      return (fetchedData as { name: string, title: string, totalTime: number }[]).filter(set => 
        (set.title || set.name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      // Filter Assignments based on search & topic
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

    if (isSetSelection) {
      params.set('set_name', targetId);
    } else {
      params.set('q', targetId);
    }

    if (isProctored) {
      navigate(`/exam?${params.toString()}`);
    } else {
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
    <div className="h-screen bg-[#09090b] text-white flex overflow-hidden font-sans">
      <ProfileSheet open={showProfileSheet} onOpenChange={setShowProfileSheet} />

      {/* --- LEFT SIDEBAR (Hidden in Proctored) --- */}
      {!isProctored && (
        <div className="w-64 flex-shrink-0 border-r border-white/10 bg-[#0c0c0e] flex flex-col">
          <div className="p-6 pb-4 border-b border-white/5">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white pl-0 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-white/60 uppercase mb-4">
              <Layers className="w-4 h-4 text-primary" />
              Modules
            </h2>
            
            <Button
              variant="ghost"
              onClick={() => setSelectedTopic(null)}
              className={cn(
                "w-full justify-start text-sm h-10 rounded-lg font-medium transition-all mb-2",
                selectedTopic === null 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Filter className="w-4 h-4 mr-3" />
              All Modules
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-1">
              {topics.map((topic) => (
                <Button
                  key={topic}
                  variant="ghost"
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    "w-full justify-start text-sm h-9 px-3 rounded-md transition-all truncate",
                    selectedTopic === topic
                      ? "text-white bg-white/10 font-medium" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  # {topic}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* --- RIGHT CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0c0c0e]/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {isProctored && (
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                 <ArrowLeft className="w-5 h-5" />
               </Button>
            )}
             <h1 className="text-lg font-bold font-neuropol text-white tracking-wide">
               {decodeURIComponent(subjectName || '')}
             </h1>
             <Badge variant="outline" className={cn("border-white/10 bg-white/5", isProctored ? "text-red-400" : "text-blue-400")}>
               {isProctored ? decodeURIComponent(examType || 'Proctored') : 'Practice'}
             </Badge>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={isProctored ? "Search sets..." : "Search problems..."} 
              className="pl-9 bg-[#1a1a1c] border-white/10 text-white h-9 focus:ring-primary/50 rounded-full text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List Content */}
        <ScrollArea className="flex-1 p-8 z-10">
          <div className="max-w-[95%] mx-auto space-y-4">
            <div className="text-xs text-muted-foreground mb-4 font-mono uppercase tracking-wider">
              {isProctored ? `Available Sets for ${decodeURIComponent(examType || '')}` : "Available Problems"} ({filteredData.length})
            </div>

            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
            ) : filteredData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                {isProctored 
                  ? `No sets found for ${decodeURIComponent(examType || '')}. (Check that your database has rows for this Subject + Exam Type)` 
                  : "No problems found."}
              </div>
            ) : isProctored ? (
              /* --- PROCTORED VIEW (SETS) - NEW CUSTOM CARD DESIGN --- */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(filteredData as { name: string, title: string, totalTime: number, sequence_number: number, description: string }[]).map((set) => (
                  <div 
                    key={set.name} 
                    className="relative w-full bg-[#111111] rounded-2xl border border-white/10 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.08)] hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out group flex flex-col"
                  >
                    <div className="p-4 md:p-8 flex flex-col h-full">
                       
                       {/* HEADER: Eyebrow + Lock */}
                       <div className="flex justify-between items-start mb-6">
                         <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                           {decodeURIComponent(examType || '')} — {set.name}
                         </span>
                         
                         <div className="flex items-center gap-1.5 text-zinc-600 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                           <Lock size={12} strokeWidth={2.5} />
                           <span className="text-[10px] font-medium tracking-wide">SECURE</span>
                         </div>
                       </div>

                       {/* TITLE SECTION */}
                       <div className="space-y-2 mb-auto">
                         <h2 className="text-xl font-medium text-zinc-100 tracking-tight line-clamp-1" title={set.title}>
                           {set.title}
                         </h2>
                         {/* Description from DB */}
                         <p className="text-sm text-zinc-500 font-normal line-clamp-2 leading-relaxed">
                           {set.description || "No description available for this set."}
                         </p>
                       </div>

                       {/* METADATA GRID */}
                       <div className="mt-8 flex items-center gap-6 pb-8 border-b border-white/5">
                         
                         {/* Duration */}
                         <div className="flex items-center gap-2.5">
                           <Clock size={16} className="text-zinc-600" />
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Duration</span>
                             <span className="text-xs font-mono text-zinc-300">{set.totalTime} MIN</span>
                           </div>
                         </div>

                         {/* Set Info */}
                         <div className="flex items-center gap-2.5">
                           <Layers size={16} className="text-zinc-600" />
                           <div className="flex flex-col">
                             <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Sequence</span>
                             <span className="text-xs font-mono text-zinc-300">{String(set.sequence_number || 1).padStart(2, '0')}</span>
                           </div>
                         </div>
                       </div>

                       {/* FOOTER ACTION */}
                       <div className="mt-8">
                         <button 
                           onClick={() => handleStart(set.name, true)}
                           className="w-full py-3.5 bg-white text-black font-medium text-sm tracking-wide rounded-lg shadow-[0px_0px_15px_rgba(255,255,255,0.1)] hover:bg-zinc-200 hover:shadow-[0px_0px_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all duration-200"
                         >
                           Start Proctored Exam
                         </button>
                         
                         <p className="mt-4 text-center text-[10px] text-zinc-600">
                           ID Verification required before starting.
                         </p>
                       </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* --- PRACTICE VIEW (QUESTIONS) --- */
              (filteredData as any[]).map((assignment) => {
                const isLocked = assignment.is_unlocked === false;

                return (
                  <div 
                    key={assignment.id} 
                    className={cn(
                      "group relative rounded-xl", 
                      isLocked ? "" : "hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                    )}
                  >
                    {/* --- PREMIUM LOCK OVERLAY --- */}
                    {isLocked && <PremiumLockOverlay />}

                    <Collapsible 
                      disabled={isLocked}
                      open={!isLocked && expandedQuestion === assignment.id} 
                      onOpenChange={(isOpen) => {
                        if (isLocked) return;
                        setExpandedQuestion(isOpen ? assignment.id : null);
                        if (isOpen) {
                           setTimeLimit([assignment.expected_time || 20]); 
                           setNoTimeLimit(false);
                        }
                      }}
                      className={cn(
                        "bg-[#121212] border border-white/10 rounded-xl transition-all duration-300 overflow-hidden",
                        !isLocked && expandedQuestion === assignment.id ? "border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.1)] ring-1 ring-primary/20" : "hover:border-white/20"
                      )}
                    >
                      <CollapsibleTrigger className={cn("w-full text-left", isLocked && "cursor-not-allowed")}>
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                              isLocked ? "bg-white/5 border-white/10 text-muted-foreground" : 
                              (expandedQuestion === assignment.id ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-muted-foreground")
                            )}>
                              {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : <FileCode2 className="w-5 h-5"/>}
                            </div>
                            <div>
                              <h3 className={cn("text-base font-bold transition-colors", isLocked ? "text-gray-500" : "text-gray-200 group-hover:text-white")}>
                                {assignment.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <Badge variant="outline" className="text-[10px] py-0 h-4 border-white/10 text-muted-foreground bg-black/40">
                                   {assignment.category || 'General'}
                                 </Badge>
                                 {!isLocked && (
                                   <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                     <Clock className="w-3 h-3" /> ~{assignment.expected_time || 20} min
                                   </span>
                                 )}
                              </div>
                            </div>
                          </div>
                          
                          {!isLocked && (
                            <div className={cn("transition-transform duration-300", expandedQuestion === assignment.id ? "rotate-90 text-primary" : "text-muted-foreground")}>
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-white/10 bg-[#08080a] p-6 animate-in slide-in-from-top-2">
                            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                              <div className="flex-1 w-full space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-primary" /> 
                                      Set Duration
                                    </label>
                                    <div className={cn("flex items-center gap-3 transition-opacity", noTimeLimit && "opacity-30 pointer-events-none")}>
                                      <Input 
                                        type="number" 
                                        value={timeLimit[0]} 
                                        onChange={handleManualTimeInput}
                                        className="w-24 h-10 bg-black/40 border-white/10 text-center font-mono font-bold text-lg text-white focus:border-primary/50 pr-2"
                                        placeholder="Min"
                                      />
                                      <span className="text-sm font-medium text-muted-foreground">min</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors">
                                    <span className={cn("text-xs font-medium cursor-pointer", noTimeLimit ? "text-white" : "text-muted-foreground")}>Free Mode</span>
                                    <Switch checked={noTimeLimit} onCheckedChange={setNoTimeLimit} className="data-[state=checked]:bg-primary scale-75" />
                                  </div>
                                </div>
                                <div className={cn("space-y-3 transition-opacity duration-200 px-1", noTimeLimit && "opacity-30 pointer-events-none")}>
                                  <Slider 
                                    value={[Math.min(timeLimit[0], 30)]} 
                                    onValueChange={(vals) => setTimeLimit(vals)} 
                                    min={2} 
                                    max={30} 
                                    step={2} 
                                    className="[&>.relative>.absolute]:bg-primary cursor-pointer py-2"
                                  />
                                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                    <span>2 min</span>
                                    <span>15 min</span>
                                    <span>30 min (Max Slider)</span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full lg:w-auto min-w-[200px]">
                                 <Button 
                                   onClick={() => handleStart(assignment.id, false)}
                                   className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] rounded-xl"
                                 >
                                   {noTimeLimit ? <InfinityIcon className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                                   Start Practice
                                 </Button>
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
        </ScrollArea>
      </div>
    </div>
  );
}
