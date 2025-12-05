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

export default function QuestionSetSelection() {
  const { subjectId, subjectName, examType, mode } = useParams();
  const navigate = useNavigate();
  const isProctored = mode === 'proctored';

  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  
  // Timer Configuration State
  const [timeLimit, setTimeLimit] = useState([20]); // Default 20 mins
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  // --- DATA FETCHING ---
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['iitm_assignments_list', subjectId, examType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('iitm_assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('exam_type', decodeURIComponent(examType || ''))
        .order('title');
      
      if (error) throw error;
      return data || [];
    }
  });

  // --- DERIVED DATA ---
  const topics = useMemo(() => {
    const uniqueTopics = new Set(assignments.map(a => a.category || 'General'));
    return Array.from(uniqueTopics).sort();
  }, [assignments]);

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic ? (a.category || 'General') === selectedTopic : true;
    return matchesSearch && matchesTopic;
  });

  // --- HANDLERS ---
  const handleStart = async (assignmentId: string) => {
    const isProfileComplete = await checkUserProfile();
    if (!isProfileComplete) {
      setShowProfileSheet(true);
      return;
    }

    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      q: assignmentId, // Load specific question
      timer: noTimeLimit ? '0' : timeLimit[0].toString(), // Pass timer config
      mode: mode || 'learning'
    });

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

      {/* --- LEFT SIDEBAR (TOPICS) --- */}
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

      {/* --- RIGHT CONTENT (QUESTIONS) --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0c0c0e]/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <h1 className="text-lg font-bold font-neuropol text-white tracking-wide">
               {decodeURIComponent(subjectName || '')}
             </h1>
             <Badge variant="outline" className={cn("border-white/10 bg-white/5", isProctored ? "text-red-400" : "text-blue-400")}>
               {isProctored ? 'Proctored' : 'Practice'}
             </Badge>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search problems..." 
              className="pl-9 bg-[#1a1a1c] border-white/10 text-white h-9 focus:ring-primary/50 rounded-full text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1 p-8 z-10">
          {/* UPDATED: Increased max-width to allow better space usage */}
          <div className="max-w-[95%] mx-auto space-y-4">
            <div className="text-xs text-muted-foreground mb-4 font-mono uppercase tracking-wider">
              Available Problems ({filteredAssignments.length})
            </div>

            {isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                No problems found in this category.
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="group">
                  <Collapsible 
                    open={expandedQuestion === assignment.id} 
                    onOpenChange={(isOpen) => {
                      setExpandedQuestion(isOpen ? assignment.id : null);
                      if (isOpen) {
                         // Reset timer defaults when opening a new card
                         setTimeLimit([assignment.expected_time || 20]); 
                         setNoTimeLimit(false);
                      }
                    }}
                    className={cn(
                      "bg-[#121212] border border-white/10 rounded-xl transition-all duration-300 overflow-hidden",
                      expandedQuestion === assignment.id ? "border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.1)] ring-1 ring-primary/20" : "hover:border-white/20"
                    )}
                  >
                    {/* Trigger Header */}
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                            expandedQuestion === assignment.id ? "bg-primary/20 border-primary/50 text-primary" : "bg-white/5 border-white/10 text-muted-foreground"
                          )}>
                            {isProctored ? <Lock className="w-5 h-5"/> : <FileCode2 className="w-5 h-5"/>}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                               <Badge variant="outline" className="text-[10px] py-0 h-4 border-white/10 text-muted-foreground bg-black/40">
                                 {assignment.category || 'General'}
                               </Badge>
                               {!isProctored && (
                                 <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                   <Clock className="w-3 h-3" /> ~{assignment.expected_time || 20} min
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>
                        
                        <div className={cn("transition-transform duration-300", expandedQuestion === assignment.id ? "rotate-90 text-primary" : "text-muted-foreground")}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Expanded Content (Timer Config) */}
                    <CollapsibleContent>
                      {/* UPDATED: Better visual container for the expanded content */}
                      <div className="border-t border-white/10 bg-[#08080a] p-6 animate-in slide-in-from-top-2">
                        {isProctored ? (
                           <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-400 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-red-400" />
                                This is a proctored exam set. Timer is fixed by administration.
                              </div>
                              <Button onClick={() => handleStart(assignment.id)} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
                                Start Exam
                              </Button>
                           </div>
                        ) : (
                          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                            
                            {/* Controls Area */}
                            <div className="flex-1 w-full space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> 
                                    Set Duration
                                  </label>
                                  
                                  {/* UPDATED: Input with separate "min" label to avoid overlap */}
                                  <div className={cn("flex items-center gap-3 transition-opacity", noTimeLimit && "opacity-30 pointer-events-none")}>
                                    <Input 
                                      type="number" 
                                      value={timeLimit[0]} 
                                      onChange={handleManualTimeInput}
                                      // Removed no-spinner class to bring back arrows
                                      className="w-24 h-10 bg-black/40 border-white/10 text-center font-mono font-bold text-lg text-white focus:border-primary/50"
                                      placeholder="Min"
                                    />
                                    {/* Moved label outside */}
                                    <span className="text-sm font-medium text-muted-foreground">min</span>
                                  </div>
                                </div>

                                {/* Free Mode Toggle */}
                                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-colors">
                                  <span className={cn("text-xs font-medium cursor-pointer", noTimeLimit ? "text-white" : "text-muted-foreground")}>Free Mode</span>
                                  <Switch checked={noTimeLimit} onCheckedChange={setNoTimeLimit} className="data-[state=checked]:bg-primary scale-75" />
                                </div>
                              </div>

                              {/* Slider */}
                              <div className={cn("space-y-3 transition-opacity duration-200 px-1", noTimeLimit && "opacity-30 pointer-events-none")}>
                                <Slider 
                                  // Visual cap at 30, but logic supports higher via input
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

                            {/* Action Button */}
                            <div className="w-full lg:w-auto min-w-[200px]">
                               <Button 
                                 onClick={() => handleStart(assignment.id)}
                                 className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] rounded-xl"
                               >
                                 {noTimeLimit ? <InfinityIcon className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                                 Start Practice
                               </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
