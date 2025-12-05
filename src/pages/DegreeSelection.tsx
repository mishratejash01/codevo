import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { Share2, Search, Code2, Database, Terminal, Globe, Cpu, Laptop, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('python')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-10 h-10" alt="Python" />;
  if (n.includes('java')) return <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" className="w-10 h-10" alt="Java" />;
  if (n.includes('database') || n.includes('sql')) return <Database className="w-10 h-10 text-blue-400" />;
  if (n.includes('web') || n.includes('dev')) return <Globe className="w-10 h-10 text-cyan-400" />;
  if (n.includes('system') || n.includes('linux')) return <Terminal className="w-10 h-10 text-gray-400" />;
  if (n.includes('compute') || n.includes('machine')) return <Cpu className="w-10 h-10 text-purple-400" />;
  return <Code2 className="w-10 h-10 text-primary" />;
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
      // @ts-ignore - Table created in migration
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
        .eq('degree_id', selectedDegree) // Filter by parent
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
        .select('*, iitm_levels!inner(degree_id)') // Inner join to filter by degree
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
    <div className="min-h-screen bg-[#09090b] text-white">
      
      {/* Header Section */}
      <div className="relative md:sticky md:top-0 z-40 bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#09090b]/80 border-b border-white/5 pt-12 md:pt-24 pb-4 px-4 md:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-neuropol tracking-wide text-white">
              Explore Your Curriculum
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Select your degree, level, and subject to access practice environments.
            </p>
          </div>

          {/* Degree Selector (Tabs) */}
          <div className="flex justify-center">
            {degrees.length > 0 && (
              <Tabs value={selectedDegree} onValueChange={setSelectedDegree} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 h-10 p-1">
                  {degrees.map((degree: any) => (
                    <TabsTrigger 
                      key={degree.id} 
                      value={degree.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-white h-full text-xs"
                    >
                      <GraduationCap className="w-3 h-3 mr-2" />
                      {degree.name.replace('BS in ', '')}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-[#0c0c0e] border border-white/10 p-3 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-1/3">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 text-sm">
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
                className="pl-9 bg-white/5 border-white/10 text-white h-10 text-sm focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto text-xs text-muted-foreground whitespace-nowrap px-2">
              Showing <span className="text-primary font-bold">{filteredSubjects.length}</span> subjects
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No subjects found for the selected degree and level.
            </div>
          ) : (
            filteredSubjects.map((subject: any) => {
              const availableExams = Array.from(subjectExamMap[subject.id] || []).sort();
              const levelName = levels.find((l: any) => l.id === subject.level_id)?.name || 'Unknown Level';

              return (
                <Card key={subject.id} className="bg-[#0c0c0e] border-white/10 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="flex-row gap-4 items-start space-y-0 pb-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      {getSubjectIcon(subject.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 text-[10px] border-white/10 text-muted-foreground bg-white/5">
                        {levelName}
                      </Badge>
                      <CardTitle className="text-lg font-bold truncate text-white" title={subject.name}>
                        {subject.name}
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <CardDescription className="text-muted-foreground/80 line-clamp-3 text-xs">
                      Master {subject.name} through hands-on coding assignments and proctored exam simulations.
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-0">
                    <div className="w-full h-px bg-white/5 mb-2" />
                    <div className="w-full flex gap-2 flex-wrap">
                      {availableExams.length > 0 ? (
                        availableExams.map((examType: any) => (
                          <Button 
                            key={examType}
                            size="sm"
                            className="flex-1 bg-white/5 hover:bg-primary hover:text-white text-muted-foreground border border-white/10 transition-all text-xs h-8"
                            onClick={() => handleExamClick(subject.id, subject.name, examType)}
                          >
                            {examType}
                          </Button>
                        ))
                      ) : (
                        <div className="w-full text-center py-2 text-[10px] text-muted-foreground/50 italic border border-dashed border-white/10 rounded">
                          No active exams
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-white h-8" onClick={() => handleShare(subject.name)}>
                      <Share2 className="w-3 h-3 mr-2" /> Share Subject
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* --- RESPONSIVE MODE SELECTION DIALOG --- */}
      <Dialog open={isModeOpen} onOpenChange={setIsModeOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white max-w-[95vw] sm:max-w-4xl p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
          
          <div className="flex flex-col md:grid md:grid-cols-2 md:h-[550px] relative">
            
            {/* OPTION 1: PRACTICE */}
            <div 
              className="relative h-64 md:h-full group overflow-hidden cursor-pointer border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0c0e]"
              onClick={() => handleModeSelect('learning')}
            >
              {/* Background Image: Graphic */}
              <div className="absolute inset-0">
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer%20(1).png" 
                  alt="Practice Coding" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 space-y-3 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/60 to-transparent">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Practice Mode</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    A chill space to experiment. No pressure, no timers—just you improving your craft one line at a time.
                  </p>
                </div>
              </div>
            </div>

            {/* OPTION 2: PROCTORED */}
            <div 
              className="relative h-64 md:h-full group overflow-hidden cursor-pointer bg-[#0c0c0e]"
              onClick={() => handleModeSelect('proctored')}
            >
              {/* Background Image: Graphic */}
              <div className="absolute inset-0">
                <img 
                  src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/image-Picsart-AiImageEnhancer.png" 
                  alt="Proctored Exam" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 space-y-3 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/60 to-transparent">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-md flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <ShieldCheck className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Proctored Mode</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    The serious zone. Strict monitoring and time limits to officially prove your skills.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Bar */}
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
