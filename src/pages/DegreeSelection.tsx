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
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
// --- IMPORT THE NEW LOCK ---
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-8 h-8" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-8 h-8" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-8 h-8 text-blue-400" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-8 h-8 text-cyan-400" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-8 h-8 text-gray-400" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-8 h-8 text-purple-400" />;
  return <Code2 className="w-8 h-8 text-primary" />;
};

const DegreeSelection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState<{id: string, name: string, type: string} | null>(null);

  // 1. Fetch Degrees (Root Parent)
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

  // 2. Fetch Levels (Filtered by Selected Degree)
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

  // 3. Fetch Subjects (Filtered by Selected Degree via Levels)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              
              // --- LOCK LOGIC ---
              const isLocked = subject.is_unlocked === false; 

              return (
                <div 
                  key={subject.id} 
                  className={cn(
                    "group relative bg-[#0c0c0e] rounded-xl border border-white/10 transition-all duration-300 flex flex-col overflow-hidden",
                    // NOTE: Removed opacity reduction for locked state so the overlay shines through
                    isLocked 
                      ? "pointer-events-none" 
                      : "hover:border-white/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.6)]"
                  )}
                >
                  
                  {/* --- PREMIUM LOCK OVERLAY --- */}
                  {isLocked && <PremiumLockOverlay />}

                  {/* Premium Hover Glow (Only for Unlocked) */}
                  {!isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
                  )}
                  
                  {/* Tech Corners - Wireframe Style */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 rounded-tl-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 rounded-bl-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 rounded-br-sm opacity-50 group-hover:opacity-100 transition-opacity" />

                  <div className="p-6 flex flex-col h-full relative z-10">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="p-2.5 rounded-lg bg-[#151515] border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300 shadow-lg">
                            {getSubjectIcon(subject.name)}
                        </div>
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider font-mono text-muted-foreground group-hover:text-white transition-colors">
                            {levelName}
                        </Badge>
                    </div>

                    {/* Title & Desc */}
                    <div className="mb-8 flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors tracking-tight" title={subject.name}>
                            {subject.name}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                            Comprehensive resource center for {subject.name}. Access practice labs and evaluations.
                        </p>
                    </div>

                    {/* Actions / Footer */}
                    <div className="space-y-4 mt-auto">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                            <span>Select Module</span>
                            <span className="w-1/2 h-px bg-white/10" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            {availableExams.length > 0 ? (
                                availableExams.map((examType: any) => (
                                    <Button
                                        key={examType}
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-xs h-9 font-normal transition-all"
                                        onClick={() => !isLocked && handleExamClick(subject.id, subject.name, examType)}
                                        disabled={isLocked}
                                    >
                                        {examType}
                                    </Button>
                                ))
                            ) : (
                                <div className="col-span-2 py-2 text-center text-[10px] text-muted-foreground/50 italic border border-dashed border-white/10 rounded bg-white/[0.02]">
                                    No active exams
                                </div>
                            )}
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full h-8 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-transparent group/share"
                            onClick={() => !isLocked && handleShare(subject.name)}
                            disabled={isLocked}
                        >
                            <Share2 className="w-3 h-3 mr-2 group-hover/share:text-primary transition-colors" /> Share Resource
                        </Button>
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
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0c0e] flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                 <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice Coding" 
                  className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
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
              <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/5 rounded-full blur-[60px] pointer-events-none" />
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored Exam" 
                  className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
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
