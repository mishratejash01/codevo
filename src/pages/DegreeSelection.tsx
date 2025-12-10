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
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, GraduationCap, Lock, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-primary/20">
      
      {/* Header Section */}
      <div className="relative z-40 bg-[#09090b] border-b border-white/5 pt-16 md:pt-24 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground uppercase tracking-widest px-3 py-1 text-[10px]">
              Academic Portal
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide text-white">
              Explore Curriculum
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Discover a premium learning platform that delivers curated content, real-time exam simulations, and a robust library of practice sets to support excellence.
            </p>
          </div>

          {/* Degree Selector (Tabs) */}
          <div className="flex justify-center">
            {degrees.length > 0 && (
              <Tabs value={selectedDegree} onValueChange={setSelectedDegree} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10 h-11 p-1 rounded-lg">
                  {degrees.map((degree: any) => (
                    <TabsTrigger 
                      key={degree.id} 
                      value={degree.id}
                      className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-full text-xs font-medium uppercase tracking-wide rounded-md transition-all"
                    >
                      <GraduationCap className="w-3.5 h-3.5 mr-2 opacity-70" />
                      {degree.name.replace('BS in ', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-[#0c0c0e] border border-white/10 p-2 md:p-3 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
            <div className="w-full md:w-1/3">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-white/5 border-white/5 text-white h-10 text-sm focus:ring-0 focus:border-white/20">
                  <SelectValue placeholder="Filter by Level" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map((level: any) => (
                    <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search subjects..." 
                className="pl-9 bg-white/5 border-white/5 text-white h-10 text-sm focus-visible:ring-0 focus-visible:border-white/20 placeholder:text-muted-foreground/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap px-4 font-mono">
              <span className="text-white font-bold mr-1">{filteredSubjects.length}</span> Subjects Found
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
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
                  {/* Glow effect backing */}
                  <div className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur transition duration-1000 group-hover:duration-200",
                    isLocked 
                      ? "from-zinc-800 to-zinc-900 opacity-10 group-hover:opacity-20" 
                      : "from-zinc-700 to-zinc-800 opacity-20 group-hover:opacity-40"
                  )} />
                  
                  {/* Card Container */}
                  <div className="relative w-full bg-[#09090b] rounded-2xl border border-[#27272a]/60 p-7 shadow-2xl flex flex-col gap-7 transition-transform duration-300 hover:-translate-y-1">
                    
                    {/* Top Right Status Badge */}
                    <div className="absolute top-7 right-7">
                      {isLocked ? (
                         <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center">
                           <Lock className="w-3.5 h-3.5 text-[#52525b]" />
                         </div>
                      ) : (
                         <div className="w-8 h-8 rounded-full bg-[#18181b]/50 border border-[#27272a]/50 flex items-center justify-center">
                           <div className="w-2 h-2 rounded-full bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                         </div>
                      )}
                    </div>

                    {/* Header Section */}
                    <div className={cn("flex flex-row items-start gap-5", isLocked && "opacity-50")}>
                      <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center group-hover:border-[#3f3f46]/50 transition-colors">
                         {getSubjectIcon(subject.name)}
                      </div>

                      <div className="flex flex-col gap-1 w-full pt-1">
                        <h3 className="text-lg font-bold text-[#f4f4f5] leading-tight line-clamp-1">{subject.name}</h3>
                        <p className="text-xs text-[#71717a] font-medium line-clamp-2 leading-relaxed">
                          Comprehensive resource center for {subject.name}. Access practice labs and evaluations.
                        </p>
                      </div>
                    </div>

                    {/* Tags Section */}
                    <div className={cn("flex flex-wrap gap-2", isLocked && "opacity-40 grayscale")}>
                      <Badge variant="outline" className="h-6 rounded-md border-[#27272a] bg-[#18181b]/50 text-[#a1a1aa] font-normal hover:bg-[#18181b]">
                        {levelName}
                      </Badge>
                      <Badge variant="outline" className="h-6 rounded-md border-[#27272a] bg-[#18181b]/50 text-[#71717a] font-normal hover:bg-[#18181b]">
                        4 Credits
                      </Badge>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex justify-between items-center pb-1">
                         <span className="text-[10px] font-bold uppercase tracking-wider text-[#52525b]">Select Module</span>
                         <div className="h-px w-1/2 bg-[#18181b]" />
                      </div>

                      {availableExams.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {availableExams.map((examType: any) => (
                            <button
                              key={examType}
                              onClick={() => !isLocked && handleExamClick(subject.id, subject.name, examType)}
                              disabled={isLocked}
                              className="relative w-full h-14 rounded-xl border border-[#27272a] bg-[#18181b]/40 flex items-center px-4 justify-between hover:bg-[#18181b]/60 hover:border-[#3f3f46] transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", isLocked ? "bg-[#3f3f46]" : "bg-emerald-500/50")} />
                                  <span className="text-sm font-medium text-[#d4d4d8] group-hover/btn:text-white transition-colors">{examType}</span>
                                </div>
                                <span className="text-[10px] text-[#52525b] ml-3.5">Standard Assessment</span>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-[#27272a]/50 flex items-center justify-center group-hover/btn:bg-[#27272a] transition-colors">
                                <ChevronRight className="w-4 h-4 text-[#71717a] group-hover/btn:text-[#d4d4d8]" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                         <div className="w-full h-14 rounded-xl border border-dashed border-[#27272a] bg-[#18181b]/20 flex items-center justify-center text-xs text-[#52525b]">
                           No active exams
                         </div>
                      )}
                    </div>

                    {/* Footer/Share Section */}
                    <div className={cn("flex items-center justify-center gap-3 pt-2", isLocked && "opacity-40")}>
                      <button 
                        onClick={() => !isLocked && handleShare(subject.name)}
                        disabled={isLocked}
                        className="group/share flex items-center gap-3 hover:opacity-80 transition-opacity w-full justify-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center group-hover/share:border-[#3f3f46] transition-colors">
                           <Share2 className="w-4 h-4 text-[#71717a] group-hover/share:text-[#a1a1aa]" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-medium text-[#71717a] group-hover/share:text-[#a1a1aa]">Share Resource</span>
                          <div className="h-0.5 w-0 bg-[#3f3f46] group-hover/share:w-full transition-all duration-300 rounded-full" />
                        </div>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MODE SELECTION DIALOG --- */}
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
