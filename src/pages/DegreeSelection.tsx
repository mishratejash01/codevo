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
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, ShieldCheck, Sparkles, GraduationCap, Lock, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-8 h-8 drop-shadow-lg" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-8 h-8 drop-shadow-lg" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-8 h-8 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />;
  return <Code2 className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />;
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
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. BACKGROUND: Deep Midnight/Green Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#022c22] opacity-80 z-0 pointer-events-none" />
      
      {/* Subtle Glow Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Main Content Scrollable Area */}
      <div className="relative z-10 min-h-screen flex flex-col items-center pb-40"> 
        
        {/* --- HEADER SECTION --- */}
        <div className="w-full max-w-7xl px-6 pt-20 pb-12 text-center space-y-6">
            
            {/* Removed the "Academic Portal" badge here */}
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 drop-shadow-2xl">
                EXPLORE CURRICULUM
            </h1>
            
            {/* Minimal Formal Subheading */}
            <div className="flex items-center justify-center gap-4 text-white/30 text-xs md:text-sm font-mono tracking-[0.2em] uppercase">
               <span className="h-px w-8 bg-white/10"></span>
               <span>Structure & Specializations</span>
               <span className="h-px w-8 bg-white/10"></span>
            </div>

            {/* --- GLASS SEGMENTED CONTROL TABS --- */}
            {degrees.length > 0 && (
              <div className="flex justify-center mt-10">
                <div className="inline-flex p-1.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                    {degrees.map((degree: any) => {
                        const isActive = selectedDegree === degree.id;
                        return (
                            <button
                                key={degree.id}
                                onClick={() => setSelectedDegree(degree.id)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden",
                                    isActive 
                                        ? "text-white shadow-lg bg-white/10 border border-white/10" 
                                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                )}
                            >
                                {isActive && <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />}
                                {degree.name.replace('BS in ', '')}
                            </button>
                        );
                    })}
                </div>
              </div>
            )}
        </div>

        {/* --- MAIN GLASS CONTAINER --- */}
        <div className="w-full max-w-6xl px-6">
            <div className="relative bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden p-8 md:p-12 min-h-[600px]">
                
                {/* Subjects Grid */}
                {filteredSubjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <Search className="w-12 h-12 mb-4 text-white/20" />
                    <p className="text-lg font-light tracking-wide">No curriculum found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.map((subject: any) => {
                        const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
                        const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown Level';
                        const isLocked = subject.is_unlocked === false; 

                        return (
                            <div 
                                key={subject.id} 
                                className={cn(
                                    "group relative bg-[#0a0a0a]/40 hover:bg-[#0a0a0a]/60 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-500 flex flex-col gap-6 backdrop-blur-sm",
                                    isLocked && "opacity-60 hover:opacity-70 grayscale-[0.5]"
                                )}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 shadow-inner">
                                        {getSubjectIcon(subject.name)}
                                    </div>
                                    {/* Status Dot */}
                                    <div className="relative">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]",
                                            isLocked ? "bg-red-500 text-red-500" : "bg-cyan-500 text-cyan-500"
                                        )} />
                                    </div>
                                </div>

                                {/* Title & Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest border border-white/10 px-1.5 rounded">
                                            {levelName}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white/90 leading-tight group-hover:text-cyan-100 transition-colors">
                                        {subject.name}
                                    </h3>
                                </div>

                                {/* Actions (Glass Buttons) */}
                                <div className="mt-auto space-y-2">
                                    {isLocked ? (
                                        <div className="h-12 w-full rounded-lg border border-dashed border-white/10 flex items-center justify-center gap-2 text-white/30 text-xs uppercase tracking-widest">
                                            <Lock className="w-3 h-3" /> Locked
                                        </div>
                                    ) : availableExams.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {availableExams.map((examType: any) => (
                                                <button
                                                    key={examType}
                                                    onClick={() => handleExamClick(subject.id, subject.name, examType)}
                                                    className="h-12 w-full rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 flex items-center justify-between px-4 transition-all group/btn"
                                                >
                                                    <span className="text-xs font-bold text-white/70 group-hover/btn:text-cyan-100 uppercase tracking-wide">{examType}</span>
                                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover/btn:text-cyan-400 group-hover/btn:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-12 flex items-center justify-center text-xs text-white/20 uppercase tracking-widest">
                                            No Exams
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                  </div>
                )}
            </div>
        </div>

      </div>

      {/* --- FLOATING SEARCH DOCK --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50">
         <div className="bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 pl-4 flex items-center gap-4 transition-all hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] group/dock">
            <Search className="w-5 h-5 text-white/40 group-hover/dock:text-cyan-400 transition-colors" />
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curriculum database..." 
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-sans text-sm h-12"
            />
            
            <div className="h-8 w-px bg-white/10 mx-2" />

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[180px] h-10 border-none bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white/80 uppercase tracking-wide focus:ring-0 transition-colors">
                    <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f172a] border-white/10 text-white rounded-xl shadow-2xl mb-2">
                    <SelectItem value="all">All Levels</SelectItem>
                    {levels.map((level: any) => (
                        <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
         </div>
      </div>


      {/* --- MODE SELECTION DIALOG (Updated to match theme) --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#0f172a]/95 backdrop-blur-3xl border-white/10 text-white max-w-4xl p-0 overflow-hidden gap-0 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-black/20 hover:bg-blue-900/10 transition-colors flex flex-col"
              onClick={() => handleModeSelect('learning')}
            >
              <div className="flex-1 flex items-center justify-center p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
                 <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="relative z-20 p-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide">Practice</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">
                  Low stakes. Unlimited attempts. Focus on skill acquisition.
                </p>
              </div>
            </div>

            {/* OPTION 2: PROCTORED */}
            <div 
              className="relative h-1/2 md:h-full group overflow-hidden cursor-pointer bg-black/20 hover:bg-red-900/10 transition-colors flex flex-col"
              onClick={() => handleModeSelect('proctored')}
            >
              <div className="flex-1 flex items-center justify-center p-14 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/20 rounded-full blur-[80px] pointer-events-none" />
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <div className="relative z-20 p-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide">Proctored</h3>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">
                  High stakes. Monitored environment. Strict time limits.
                </p>
              </div>
            </div>

          </div>

          <div className="bg-black/80 p-3 text-center text-[10px] text-white/30 border-t border-white/5 flex justify-between items-center px-6 font-mono uppercase tracking-widest backdrop-blur-xl">
            <span>Selection: <span className="text-white/60">{selectedExamData?.name}</span></span>
            <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{selectedExamData?.type}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DegreeSelection;
