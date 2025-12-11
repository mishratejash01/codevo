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
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, Lock, ChevronRight, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-6 h-6" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-6 h-6" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-6 h-6 text-blue-600" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-6 h-6 text-cyan-600" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-6 h-6 text-gray-600" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-6 h-6 text-purple-600" />;
  return <Code2 className="w-6 h-6 text-emerald-600" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState<{id: string, name: string, type: string} | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
    <div className="min-h-screen bg-[#F9F7F2] text-[#1a1a1a] font-sans selection:bg-black/10">
      
      {/* Background Texture (Noise) */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* --- IVY LEAGUE HEADER --- */}
      <header className="relative pt-24 pb-12 px-6 md:px-16 lg:px-24 z-10 border-b border-black/5">
        <div className="max-w-[1800px] mx-auto">
            
            {/* Top Row: Tag & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    <span className="font-mono text-xs uppercase tracking-widest text-black/60">
                        Academic Portal 2024
                    </span>
                </div>

                <div className="flex items-center gap-8 self-end md:self-auto">
                    {/* Level Filter (Moved to Top Right) */}
                    <div className="relative z-20">
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="w-[180px] border-none bg-transparent text-black/60 hover:text-black font-serif text-lg p-0 h-auto focus:ring-0 gap-2 justify-end">
                                <SelectValue placeholder="All Levels" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#F9F7F2] border-black/5 text-black shadow-xl">
                                <SelectItem value="all" className="font-serif">All Levels</SelectItem>
                                {levels.map((level: any) => (
                                    <SelectItem key={level.id} value={level.id} className="font-serif">
                                        {level.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Minimalist Search */}
                    <div className={cn("flex items-center border-b border-black/20 transition-all duration-300", isSearchExpanded ? "w-64 border-black" : "w-8 border-transparent")}>
                        <input 
                            type="text" 
                            className={cn("bg-transparent outline-none text-black placeholder:text-black/30 font-serif text-base w-full", isSearchExpanded ? "opacity-100 px-2" : "opacity-0 w-0 px-0")}
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                        />
                        <button onClick={() => setIsSearchExpanded(true)} className="p-1">
                            <Search className="w-5 h-5 text-black/60 hover:text-black transition-colors" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
                {/* Massive Typography */}
                <div className="relative">
                    <h1 className="font-serif text-6xl md:text-8xl lg:text-[7rem] leading-[0.9] tracking-tighter text-[#1a1a1a]">
                        Explore <br />
                        <span className="italic text-black/80 ml-12 md:ml-24">Curriculum</span>
                    </h1>
                </div>

                {/* Formal Professional Description */}
                <div className="lg:max-w-md text-right lg:text-left lg:mb-4">
                    <p className="font-serif text-lg md:text-xl text-[#1a1a1a] leading-relaxed">
                        Designed for academic rigor and professional <span className="italic font-bold">excellence</span>.
                    </p>
                    <p className="font-mono text-xs md:text-sm text-black/50 mt-2 uppercase tracking-widest">
                        Select a discipline to explore the structured curriculum.
                    </p>
                </div>
            </div>

            {/* Underline Tab System */}
            <div className="flex border-b border-black/10 relative overflow-x-auto no-scrollbar">
                {degrees.map((degree: any) => {
                    const isActive = selectedDegree === degree.id;
                    return (
                        <button
                            key={degree.id}
                            onClick={() => setSelectedDegree(degree.id)}
                            className={cn(
                                "pb-6 pr-12 md:pr-24 text-sm md:text-base tracking-widest uppercase transition-all duration-500 relative shrink-0",
                                isActive ? "font-bold text-black" : "font-medium text-black/30 hover:text-black/60"
                            )}
                        >
                            {degree.name.replace("BS in ", "")}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black animate-in slide-in-from-left-4 duration-500" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
      </header>

      {/* Subjects Grid */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-16 lg:px-24 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full py-32 text-center border-y border-black/5">
              <p className="font-serif text-2xl text-black/40 italic">No curriculum found matching your criteria.</p>
              <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedLevel('all'); }} className="text-black mt-4 underline decoration-black/20 hover:decoration-black">
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredSubjects.map((subject: any) => {
              const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
              const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Level';
              const isLocked = subject.is_unlocked === false; 

              return (
                <div key={subject.id} className="group flex flex-col gap-6">
                  {/* Minimalist Card Header */}
                  <div className="flex justify-between items-start border-b border-black/10 pb-6 group-hover:border-black/30 transition-colors">
                      <div className="flex gap-4 items-center">
                          <div className={cn("p-3 rounded-xl bg-white border border-black/5 shadow-sm transition-transform duration-500 group-hover:scale-110", isLocked && "grayscale opacity-50")}>
                              {getSubjectIcon(subject.name)}
                          </div>
                          <div>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-black/40 block mb-1">
                                  {levelName}
                              </span>
                              <h3 className={cn("font-serif text-2xl text-[#1a1a1a] leading-tight group-hover:text-black transition-colors", isLocked && "text-black/40")}>
                                  {subject.name}
                              </h3>
                          </div>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="pt-1">
                          <div className="w-6 h-6 rounded-full bg-[#18181b]/5 border border-[#27272a]/10 flex items-center justify-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                              isLocked 
                                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" 
                                : "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.4)]"
                            )} />
                          </div>
                      </div>
                  </div>

                  {/* Action Area */}
                  <div className="space-y-3">
                      {isLocked ? (
                          <div className="w-full h-16 rounded-xl border border-dashed border-[#27272a]/20 bg-black/[0.02] flex items-center justify-center gap-3">
                             <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center border border-black/10">
                               <Lock className="w-3 h-3 text-black/40" />
                             </div>
                             <div className="flex flex-col justify-center">
                               <span className="text-xs font-medium text-black/50">Subject Locked</span>
                             </div>
                          </div>
                      ) : availableExams.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                              {availableExams.map((examType: any) => (
                                  <button
                                      key={examType}
                                      onClick={() => handleExamClick(subject.id, subject.name, examType)}
                                      className="flex items-center justify-between w-full p-4 bg-white border border-black/5 hover:border-black/20 hover:shadow-lg transition-all duration-300 group/btn rounded-lg"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className="w-1.5 h-1.5 bg-black/20 rounded-full group-hover/btn:bg-black transition-colors" />
                                          <span className="font-sans text-sm font-medium text-black/70 group-hover/btn:text-black tracking-wide">
                                              {examType}
                                          </span>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-black/20 group-hover/btn:text-black transition-colors transform group-hover/btn:translate-x-1" />
                                  </button>
                              ))}
                          </div>
                      ) : (
                          <div className="py-6 text-center text-xs font-mono text-black/30 uppercase tracking-widest">
                              No Modules Active
                          </div>
                      )}
                  </div>

                  {/* Footer Link */}
                  {!isLocked && (
                      <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <button 
                              onClick={() => handleShare(subject.name)}
                              className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black flex items-center gap-2"
                          >
                              Share <Share2 className="w-3 h-3" />
                          </button>
                      </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODE SELECTION DIALOG (Dark Mode Preserved for Contrast) --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0c0e] flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                 {/* --- RESTORED ORIGINAL PRACTICE IMAGE --- */}
                 <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice Coding" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent" />
              </div>
              <div className="relative z-20 p-6 md:p-8 space-y-2 bg-[#0c0c0e] border-t border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">Practice Mode</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  Experiment freely. No pressure, no timers—just you improving your craft.
                </p>
              </div>
            </div>

            {/* OPTION 2: PROCTORED */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer bg-[#0c0c0e] flex flex-col"
              onClick={() => handleModeSelect('proctored')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
                {/* --- RESTORED ORIGINAL PROCTORED IMAGE --- */}
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored Exam" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent" />
              </div>
              <div className="relative z-20 p-6 md:p-8 space-y-2 bg-[#0c0c0e] border-t border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                    <ShieldCheck className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-red-400 transition-colors">Proctored Mode</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  Strict monitoring and time limits to officially validate your skills.
                </p>
              </div>
            </div>

          </div>

          <div className="bg-[#050505] p-3 text-center text-xs text-muted-foreground border-t border-white/5 flex justify-between items-center px-6">
            <span>Selected: <span className="text-white font-medium">{selectedExamData?.name}</span></span>
            <span className="bg-white/5 px-2 py-1 rounded text-[10px] uppercase tracking-wider">{selectedExamData?.type}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
