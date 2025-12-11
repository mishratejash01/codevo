import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, Lock, ChevronRight, ArrowLeft, Grid3X3, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Card } from '@/components/ui/card';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-6 h-6" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-6 h-6" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-6 h-6 text-blue-400" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-6 h-6 text-cyan-400" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-6 h-6 text-gray-400" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-6 h-6 text-purple-400" />;
  return <Code2 className="w-6 h-6 text-primary" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState<{id: string, name: string, type: string} | null>(null);

  // 1. Fetch Degrees
  const { data: degrees = [] } = useQuery({
    queryKey: ['iitm_degrees'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from('iitm_degrees').select('*').order('name');
      if (error) {
        console.error('Error fetching degrees:', error);
        return [];
      }
      return data;
    }
  });

  // Set default degree on load
  useEffect(() => {
    if (degrees.length > 0 && !selectedDegree) {
      setSelectedDegree(degrees[0].id);
    }
  }, [degrees, selectedDegree]);

  // 2. Fetch Levels
  const { data: levels = [] } = useQuery({
    queryKey: ['iitm_levels', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];
      
      const { data, error } = await supabase
        .from('iitm_levels')
        .select('*')
        .eq('degree_id', selectedDegree)
        .order('sequence');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  // 3. Fetch Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['iitm_subjects', selectedDegree],
    queryFn: async () => {
      if (!selectedDegree) return [];

      const { data, error } = await supabase
        .from('iitm_subjects')
        .select('*, iitm_levels!inner(degree_id)')
        // @ts-ignore
        .eq('iitm_levels.degree_id', selectedDegree)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedDegree
  });

  // Fetch Assignment Types Map
  const { data: subjectExamMap = {} } = useQuery({
    queryKey: ['iitm_assignment_types'],
    queryFn: async () => {
      const { data } = await supabase.from('iitm_assignments').select('subject_id, exam_type');
      const mapping: Record<string, Set<string>> = {};
      data?.forEach(item => {
        if (item.subject_id && item.exam_type) {
          if (!mapping[item.subject_id]) mapping[item.subject_id] = new Set();
          mapping[item.subject_id].add(item.exam_type);
        }
      });
      return mapping;
    }
  });

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject: any) => {
      const matchesLevel = selectedLevel === 'all' || subject.level_id === selectedLevel;
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [subjects, selectedLevel, searchQuery]);

  const handleExamClick = (subjectId: string, subjectName: string, examType: string) => {
    setSelectedExamData({ id: subjectId, name: subjectName, type: examType });
    setIsModeOpen(true);
  };

  const handleModeSelect = (mode: 'learning' | 'proctored') => {
    if (!selectedExamData) return;

    if (mode === 'proctored') {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (window.innerWidth < 1024 || isMobileDevice) {
        toast({
          title: "Access Denied 🚫",
          description: "Proctored exams require a Laptop or Desktop PC. Please switch devices.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    }

    setIsModeOpen(false);
    navigate(`/degree/sets/${selectedExamData.id}/${encodeURIComponent(selectedExamData.name)}/${encodeURIComponent(selectedExamData.type)}/${mode}`);
  };

  const handleShare = (subjectName: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: `Share link for ${subjectName} copied.` });
  };

  return (
    <div className="min-h-screen bg-[#121212] font-sans selection:bg-orange-500/30 p-2 md:p-6 flex items-center justify-center">
      
      {/* --- UNIFIED MAIN CONTAINER --- */}
      {/* Restored Original Colors: bg-[#09090b] (Card Dark) with White/10 Border */}
      <div className="w-full max-w-[1800px] min-h-[95vh] bg-[#09090b] border border-white/10 rounded-3xl relative overflow-hidden flex flex-col shadow-2xl">
        
        {/* Subtle Background Pattern (Grid) - Kept neutral/white */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
        
        {/* LARGE WATERMARK (Original White/Neutral) */}
        <div className="absolute right-0 top-0 h-full w-1/3 overflow-hidden opacity-[0.02] pointer-events-none">
            <span className="font-serif text-[150px] leading-none text-white absolute -right-10 top-10 rotate-12">IITM</span>
        </div>

        {/* --- 1. INTEGRATED SWISS HEADER --- */}
        <div className="relative z-10 border-b border-white/10 bg-[#09090b]/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-10 min-h-[240px]">
                
                {/* LEFT COLUMN (30%) */}
                <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 p-8 flex flex-col justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/40 hover:text-white hover:translate-x-[-4px] transition-all w-fit"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Return
                    </button>

                    <div className="mt-6">
                        {/* RESTORED ORANGE ACCENT */}
                        <div className="w-12 h-1 bg-orange-600 mb-6" />
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-white tracking-tight">
                            Curriculum <br />
                            <span className="text-white/40 italic">Explorer</span>
                        </h1>
                    </div>
                </div>

                {/* RIGHT COLUMN (70%) - TABS */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                        {degrees.map((degree: any, index: number) => {
                            const isActive = selectedDegree === degree.id;
                            return (
                                <button
                                    key={degree.id}
                                    onClick={() => setSelectedDegree(degree.id)}
                                    className={cn(
                                        "relative group text-left p-8 lg:p-12 border-b md:border-b-0 border-white/10 transition-all duration-300 ease-out",
                                        "md:border-r last:border-r-0 hover:bg-white/[0.02]",
                                        isActive ? "bg-white/[0.03]" : "opacity-60 hover:opacity-100"
                                    )}
                                >
                                    {isActive && (
                                        // RESTORED ORANGE ACCENT
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />
                                    )}
                                    <div className="flex flex-col h-full justify-between gap-6 md:gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-orange-500/80 uppercase tracking-widest border border-orange-500/20 px-1.5 py-0.5 rounded-sm">
                                                    0{index + 1}
                                                </span>
                                            </div>
                                            <h3 className={cn(
                                                "font-serif text-2xl md:text-3xl transition-colors",
                                                isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                            )}>
                                                {degree.name.replace("BS in ", "")}
                                            </h3>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[10px] md:text-xs font-mono text-white/40 uppercase tracking-wider group-hover:text-white/60 transition-colors">
                                                View Modules
                                            </span>
                                            <div className={cn("w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300", isActive ? "bg-white text-black border-white" : "text-white/20 group-hover:border-white/40")}>
                                                 <ChevronRight className={cn("w-4 h-4 transition-transform", isActive && "translate-x-0.5")} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* INTEGRATED SEARCH & FILTER BAR */}
            <div className="border-t border-white/10 flex flex-col md:flex-row relative z-10 bg-[#09090b]/80 backdrop-blur-md">
                <div className="w-full md:w-[30%] border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 flex items-center gap-4 bg-white/[0.02]">
                    <Search className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase tracking-widest text-white/40">
                        Query_Database
                    </span>
                </div>
                
                <div className="flex-1 flex flex-col md:flex-row relative">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for subjects..."
                        className="flex-1 bg-transparent p-4 md:px-8 text-sm md:text-base font-mono text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.02] transition-colors h-14 md:h-auto"
                    />
                    
                    <div className="h-14 md:h-full border-t md:border-t-0 md:border-l border-white/10 flex items-center bg-white/[0.01]">
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="h-full border-none bg-transparent rounded-none px-6 gap-3 focus:ring-0 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/[0.02] w-full md:w-[220px] justify-between">
                                <SelectValue placeholder="FILTER: ALL" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#09090b] border-white/10 text-white rounded-none min-w-[200px]">
                                <SelectItem value="all" className="font-mono text-xs uppercase focus:bg-white/10 focus:text-white cursor-pointer">Filter: All Levels</SelectItem>
                                {levels.map((level: any) => (
                                    <SelectItem key={level.id} value={level.id} className="font-mono text-xs uppercase focus:bg-white/10 focus:text-white cursor-pointer">
                                        {level.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>

        {/* --- 2. MAIN CONTENT AREA (SCROLLABLE) --- */}
        <div className="flex-1 overflow-y-auto relative z-10 bg-transparent">
          <div className="p-4 md:p-12 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.length === 0 ? (
                <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No matching modules found</p>
                  <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedLevel('all'); }} className="text-primary mt-2">
                    Reset Query
                  </Button>
                </div>
              ) : (
                filteredSubjects.map((subject: any) => {
                  const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
                  const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown';
                  const isLocked = subject.is_unlocked === false; 

                  return (
                    <div key={subject.id} className="relative group">
                      <div className={cn(
                        "absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500",
                        isLocked ? "from-red-900 to-red-950" : "from-zinc-700 to-zinc-800"
                      )} />
                      
                      {/* CARD STYLE RESTORED TO ORIGINAL DARK THEME */}
                      <div className="relative w-full h-full bg-[#0c0c0e] rounded-xl border border-white/10 p-6 shadow-lg flex flex-col gap-6 transition-all duration-300 hover:border-white/20 hover:bg-[#121212]">
                        
                        {/* Header Section */}
                        <div className={cn("flex flex-row items-start gap-4", isLocked && "opacity-50 grayscale")}>
                          <div className="shrink-0 w-12 h-12 rounded-lg bg-[#18181b] border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                             {getSubjectIcon(subject.name)}
                          </div>

                          <div className="flex flex-col gap-1 w-full pt-0.5">
                            <h3 className="text-base font-bold text-white leading-tight line-clamp-1">{subject.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="h-5 rounded px-1.5 border-white/10 bg-white/5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                                    {levelName}
                                </Badge>
                                <span className="text-[10px] text-zinc-600 font-mono">|</span>
                                <span className="text-[10px] text-zinc-500 font-mono">4 Credits</span>
                            </div>
                          </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex flex-col gap-3 pt-1 mt-auto">
                          {isLocked ? (
                            <div className="w-full h-12 rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center gap-2">
                               <Lock className="w-3 h-3 text-zinc-500" />
                               <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Locked</span>
                            </div>
                          ) : availableExams.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {availableExams.map((examType: any) => (
                                <button
                                  key={examType}
                                  onClick={() => handleExamClick(subject.id, subject.name, examType)}
                                  className="relative w-full h-12 rounded-lg border border-white/10 bg-[#18181b]/50 flex items-center px-4 justify-between hover:bg-white/10 hover:border-white/20 transition-all group/btn"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-zinc-300 group-hover/btn:text-white">{examType}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover/btn:text-white transition-colors" />
                                </button>
                              ))}
                            </div>
                          ) : (
                             <div className="w-full h-12 rounded-lg border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                               NO MODULES ACTIVE
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODE SELECTION DIALOG (Restored Original) --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
          <div className="flex flex-col md:grid md:grid-cols-2 h-[80vh] md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0c0e] flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                 <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice Coding" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                />
              </div>
              <div className="relative z-20 p-6 md:p-8 space-y-2 bg-[#0c0c0e] border-t border-white/10">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Practice Mode</h3>
                 </div>
                 <p className="text-zinc-500 text-xs">Unrestricted environment.</p>
              </div>
            </div>

            {/* OPTION 2: PROCTORED */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer bg-[#0c0c0e] flex flex-col"
              onClick={() => handleModeSelect('proctored')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored Exam" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                />
              </div>
              <div className="relative z-20 p-6 md:p-8 space-y-2 bg-[#0c0c0e] border-t border-white/10">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">Proctored Mode</h3>
                 </div>
                 <p className="text-zinc-500 text-xs">Strict monitoring enabled.</p>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
