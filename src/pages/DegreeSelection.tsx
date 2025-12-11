import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, Lock, ChevronRight, GraduationCap, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

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
    <div className="min-h-screen bg-[#121212] text-[#f0f0f0] font-sans selection:bg-orange-500/30">
      
      {/* --- SWISS ARCHITECTURAL HEADER --- */}
      <header className="border-b border-white/10 pt-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-10 min-h-[320px]">
                
                {/* LEFT COLUMN (30%) */}
                <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/10 py-8 lg:pr-12 flex flex-col justify-between">
                    <div>
                        <div className="inline-block border border-white/20 px-3 py-1 mb-6">
                            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/60">
                                Academic_Portal
                            </span>
                        </div>
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-white tracking-tight">
                            Curriculum <br />
                            <span className="text-white/40 italic">Explorer</span>
                        </h1>
                    </div>
                    {/* Kept minimal as per previous 'formal' request */}
                    <div className="hidden lg:block mt-12">
                        <div className="w-12 h-1 bg-orange-600 mb-4"></div>
                        <p className="font-mono text-[10px] text-white/40 max-w-[200px] leading-relaxed">
                             STRUCTURED ACADEMIC <br/> PATHWAYS
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN (70%) */}
                <div className="lg:col-span-7 flex flex-col">
                    
                    {/* Top Description Area */}
                    <div className="py-8 lg:pl-12 lg:pb-8 border-b border-white/10">
                        <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-3xl leading-relaxed font-light">
                            Select a discipline to view the structured academic path. 
                            Our curriculum is designed for precision, rigor, and industry alignment.
                        </p>
                    </div>

                    {/* Degree Selection "Cards" - THE GRID TABS */}
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
                                        <div className="absolute top-0 left-0 w-1 md:w-full h-full md:h-1 bg-orange-600" />
                                    )}
                                    <div className="flex flex-col h-full justify-between gap-6 md:gap-8">
                                        <div className="space-y-2">
                                            <span className="font-mono text-xs text-orange-500/80 uppercase tracking-widest">
                                                0{index + 1}
                                            </span>
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
                                            <ChevronRight className={cn(
                                                "w-5 h-5 transition-transform duration-300",
                                                isActive ? "text-orange-500 translate-x-2" : "text-white/20 group-hover:text-white"
                                            )} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar (Grid Line Integrated) */}
            <div className="border-t border-white/10 flex flex-col md:flex-row">
                {/* Search Label Block */}
                <div className="w-full md:w-[30%] border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 flex items-center gap-4 bg-white/[0.02]">
                    <Search className="w-4 h-4 text-white/40" />
                    <span className="font-mono text-xs uppercase tracking-widest text-white/40">
                        Query_Database
                    </span>
                </div>
                
                {/* Search Input & Filter */}
                <div className="flex-1 flex flex-col md:flex-row relative">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for subjects, codes, or keywords..."
                        className="flex-1 bg-transparent p-4 md:px-8 text-sm md:text-base font-mono text-white placeholder:text-white/20 focus:outline-none focus:bg-white/[0.02] transition-colors h-14 md:h-auto"
                    />
                    
                    {/* Level Filter Integrated */}
                    <div className="h-14 md:h-full border-t md:border-t-0 md:border-l border-white/10 flex items-center bg-white/[0.01]">
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="h-full border-none bg-transparent rounded-none px-6 gap-3 focus:ring-0 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/[0.02] w-full md:w-[220px] justify-between">
                                <SelectValue placeholder="FILTER: ALL" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-white/10 text-white/80 rounded-none min-w-[200px]">
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
      </header>

      {/* Subjects Grid */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No subjects found matching your criteria.</p>
              <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedLevel('all'); }} className="text-primary mt-2">
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredSubjects.map((subject: any) => {
              const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
              const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown Level';
              
              const isLocked = subject.is_unlocked === false; 

              return (
                <div key={subject.id} className="relative group">
                  {/* Card Container */}
                  <div className="relative w-full bg-[#121212] rounded-none border border-white/10 p-8 flex flex-col gap-6 transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.02]">
                    
                    {/* Header Section */}
                    <div className={cn("flex flex-row items-start gap-5", isLocked && "opacity-50")}>
                      <div className="shrink-0 w-12 h-12 flex items-center justify-center border border-white/10 bg-white/5">
                         {getSubjectIcon(subject.name)}
                      </div>

                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 mb-1">
                            {levelName}
                        </span>
                        <h3 className="text-lg font-serif font-medium text-white/90 leading-tight">
                            {subject.name}
                        </h3>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col gap-4 mt-auto">
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                         <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Modules</span>
                      </div>

                      {/* --- LOCKED STATE UI --- */}
                      {isLocked ? (
                        <div className="w-full h-12 border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center gap-2">
                           <Lock className="w-3 h-3 text-white/30" />
                           <span className="text-xs font-mono text-white/30 uppercase tracking-widest">Locked</span>
                        </div>
                      ) : availableExams.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {availableExams.map((examType: any) => (
                            <button
                              key={examType}
                              onClick={() => handleExamClick(subject.id, subject.name, examType)}
                              className="w-full h-12 border border-white/10 bg-white/[0.02] flex items-center px-4 justify-between hover:bg-white/10 hover:border-white/20 transition-all group/btn"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1 h-1 bg-orange-500" />
                                <span className="text-xs font-mono text-white/70 group-hover/btn:text-white uppercase tracking-wider">{examType}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20 group-hover/btn:text-orange-500 transition-colors" />
                            </button>
                          ))}
                        </div>
                      ) : (
                         <div className="w-full h-12 border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-xs font-mono text-white/30 uppercase tracking-widest">
                           No Modules
                         </div>
                      )}
                    </div>

                    {/* Footer/Share Section */}
                    <div className={cn("flex items-center justify-end pt-2 border-t border-white/5", isLocked && "opacity-40")}>
                      <button 
                        onClick={() => !isLocked && handleShare(subject.name)}
                        disabled={isLocked}
                        className="group/share flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <span className="text-[10px] font-mono text-white/40 group-hover/share:text-white uppercase tracking-widest">Share</span>
                        <Share2 className="w-3 h-3 text-white/40 group-hover/share:text-white" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODE SELECTION DIALOG (Dark Mode Preserved for Contrast) --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#121212] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden gap-0 rounded-none shadow-2xl border">
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#121212] flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                 <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice Coding" 
                  className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="relative z-20 p-8 border-t border-white/10 bg-[#121212]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center border border-white/20 bg-white/5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-serif text-white">Practice Mode</h3>
                </div>
                <p className="text-xs text-white/50 font-mono leading-relaxed uppercase tracking-wide">
                  Skill Acquisition // Unlimited Attempts
                </p>
              </div>
            </div>

            {/* OPTION 2: PROCTORED */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer bg-[#121212] flex flex-col"
              onClick={() => handleModeSelect('proctored')}
            >
              <div className="flex-1 flex items-center justify-center p-4 md:p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored Exam" 
                  className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-all duration-500 grayscale group-hover:grayscale-0"
                />
              </div>
              <div className="relative z-20 p-8 border-t border-white/10 bg-[#121212]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center border border-white/20 bg-white/5">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-serif text-white">Proctored Mode</h3>
                </div>
                <p className="text-xs text-white/50 font-mono leading-relaxed uppercase tracking-wide">
                  High Stakes // Monitored Environment
                </p>
              </div>
            </div>

          </div>

          <div className="bg-[#121212] p-3 text-center text-xs text-white/30 border-t border-white/10 flex justify-between items-center px-6 font-mono uppercase tracking-widest">
            <span>Selected: <span className="text-white/60">{selectedExamData?.name}</span></span>
            <span className="bg-white/5 px-2 py-1 border border-white/10">{selectedExamData?.type}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
