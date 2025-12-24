import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Search, ChevronRight, Filter, ArrowLeft, Layers, Hash, 
  CheckCircle2, Star, Flame, Building2, BarChart3, Users,
  Code2, Zap, Trophy, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';

export default function PracticeArena() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const { data: topics = [] } = useQuery({
    queryKey: ['practice_topics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('practice_topics').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['practice_problems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: userSubmissions = [] } = useQuery({
    queryKey: ['user_submissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('problem_id, status')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['user_bookmarks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('practice_bookmarks')
        .select('problem_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  const solvedProblemIds = new Set(
    userSubmissions.filter(s => s.status === 'completed').map(s => s.problem_id)
  );
  const attemptedProblemIds = new Set(
    userSubmissions.map(s => s.problem_id)
  );
  const bookmarkedProblemIds = new Set(bookmarks.map(b => b.problem_id));

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty;
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    
    let matchesStatus = true;
    if (statusFilter === 'solved') {
      matchesStatus = solvedProblemIds.has(p.id);
    } else if (statusFilter === 'unsolved') {
      matchesStatus = !solvedProblemIds.has(p.id);
    } else if (statusFilter === 'attempted') {
      matchesStatus = attemptedProblemIds.has(p.id) && !solvedProblemIds.has(p.id);
    }
    
    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_-4px_rgba(52,211,153,0.5)]';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_-4px_rgba(251,191,36,0.5)]';
      case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20 shadow-[0_0_10px_-4px_rgba(244,63,94,0.5)]';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getDifficultyBars = (diff: string) => {
    return (
      <div className="flex gap-0.5 items-end h-3">
        <div className={cn("w-1 rounded-sm", diff === 'Easy' || diff === 'Medium' || diff === 'Hard' ? "h-2 bg-current" : "h-2 bg-white/20")} />
        <div className={cn("w-1 rounded-sm", diff === 'Medium' || diff === 'Hard' ? "h-2.5 bg-current" : "h-2.5 bg-white/20")} />
        <div className={cn("w-1 rounded-sm", diff === 'Hard' ? "h-3 bg-current" : "h-3 bg-white/20")} />
      </div>
    );
  };

  const handleTopicSelect = (topic: string | null) => {
    setSelectedTopic(topic);
    setIsFilterOpen(false);
  };

  const TopicsSidebar = () => (
    <div className="space-y-6">
      <div className="bg-[#0c0c0e]/50 backdrop-blur-md rounded-2xl border border-white/5 p-1 overflow-hidden">
        <UserStatsCard userId={userId} />
      </div>
      
      <div className="bg-[#0c0c0e]/50 backdrop-blur-md rounded-2xl border border-white/5 p-4 overflow-hidden">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-500" /> Streak & Activity
        </h3>
        <ActivityCalendar userId={userId} />
      </div>

      <div className="bg-[#0c0c0e]/50 backdrop-blur-md rounded-2xl border border-white/5 p-2 flex flex-col h-[300px]">
        <div className="flex items-center justify-between p-3 pb-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Topics
          </h3>
          {selectedTopic && (
            <Button variant="ghost" size="sm" onClick={() => handleTopicSelect(null)} className="h-6 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 rounded-full">
              Clear
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => handleTopicSelect(null)}
              className={cn(
                "w-full justify-start text-sm h-10 rounded-lg relative overflow-hidden transition-all duration-300",
                selectedTopic === null ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
               {selectedTopic === null && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
              <Sparkles className="w-4 h-4 mr-3 opacity-70" /> All Topics
            </Button>
            
            {topics.map((topic: any) => (
              <Button
                key={topic.id}
                variant="ghost"
                onClick={() => handleTopicSelect(topic.name)}
                className={cn(
                  "w-full justify-start text-sm h-10 rounded-lg transition-all duration-300",
                  selectedTopic === topic.name ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <Hash className="w-3 h-3 mr-3 opacity-50" />
                {topic.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 flex flex-col relative overflow-hidden">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] opacity-40 animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/')} 
              className="h-10 w-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-muted-foreground hover:text-white group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-neuropol tracking-wide text-white flex items-center gap-2">
                Practice<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Arena</span>
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground font-mono hidden md:block">MASTER YOUR CRAFT // CODEVO INC.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6 flex-1 justify-end">
            {/* Search Bar - Desktop */}
            <div className="relative group hidden sm:block w-full max-w-md">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative flex items-center bg-[#0a0a0c] rounded-xl border border-white/10 px-4 h-11 transition-all group-focus-within:border-primary/50">
                <Search className="w-4 h-4 text-muted-foreground mr-3" />
                <Input 
                  placeholder="Search for problems, tags, or companies..." 
                  className="border-none bg-transparent focus-visible:ring-0 h-full text-sm text-white placeholder:text-muted-foreground/40 p-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="hidden md:flex gap-1">
                  <span className="text-[10px] text-muted-foreground/40 border border-white/5 px-1.5 py-0.5 rounded">CTRL</span>
                  <span className="text-[10px] text-muted-foreground/40 border border-white/5 px-1.5 py-0.5 rounded">K</span>
                </div>
              </div>
            </div>

            {/* Mobile Filter Toggle */}
            {isMobile && (
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 border-white/10 bg-white/5 rounded-full relative">
                    <Filter className="w-4 h-4" />
                    {(selectedTopic || filterDifficulty) && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#050505]" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] p-6 bg-[#0c0c0e] border-r-white/10">
                  <TopicsSidebar />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar / Filters */}
      <div className="sticky top-16 md:top-20 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 py-4">
         <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5 overflow-x-auto max-w-full scrollbar-hide">
              {[
                { key: 'all' as StatusFilter, label: 'All Challenges', icon: Layers },
                { key: 'solved' as StatusFilter, label: 'Solved', icon: CheckCircle2 },
                { key: 'attempted' as StatusFilter, label: 'In Progress', icon: Flame },
                { key: 'unsolved' as StatusFilter, label: 'Unsolved', icon: Code2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap",
                    statusFilter === key 
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)]" 
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mr-2 hidden md:block">Difficulty</span>
              <div className="flex gap-1">
                {['Easy', 'Medium', 'Hard'].map(diff => (
                  <button 
                    key={diff}
                    onClick={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-medium border transition-all duration-300 flex items-center gap-2",
                      filterDifficulty === diff 
                        ? getDifficultyColor(diff)
                        : "border-transparent bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", 
                      diff === 'Easy' ? "bg-emerald-500" : diff === 'Medium' ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    {diff}
                  </button>
                ))}
              </div>
            </div>
         </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-6">
          <div className="sticky top-40">
            <TopicsSidebar />
          </div>
        </div>

        {/* Right Content: Problem List */}
        <div className="col-span-1 lg:col-span-9 xl:col-span-9">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10 rounded-3xl bg-white/5/50 p-12">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Search className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                We couldn't find any problems matching your current filters. Try adjusting your search or clearing filters.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {setSearchTerm(''); setFilterDifficulty(null); setSelectedTopic(null); setStatusFilter('all');}}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-2">
                 <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                   Displaying {filteredProblems.length} Challenges
                 </div>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   Sort by: <span className="text-white font-medium">Recommended</span>
                 </div>
              </div>
              
              <div className="grid gap-3">
                {filteredProblems.map((problem, idx) => {
                  const isSolved = solvedProblemIds.has(problem.id);
                  const isAttempted = attemptedProblemIds.has(problem.id);
                  const isBookmarked = bookmarkedProblemIds.has(problem.id);
                  const difficultyColorClass = getDifficultyColor(problem.difficulty);
                  
                  return (
                    <div 
                      key={problem.id}
                      onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                      className="group relative bg-[#0c0c0e]/60 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl p-1 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                    >
                      {/* Hover Gradient Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-0" />
                      
                      <div className="relative z-10 bg-[#0c0c0e]/40 rounded-xl p-4 md:p-5 flex items-center gap-4 md:gap-6">
                        {/* Left Status Indicator */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-300",
                             isSolved 
                               ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                               : isAttempted
                               ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                               : "bg-white/5 border-white/5 text-muted-foreground group-hover:bg-white/10"
                           )}>
                             {isSolved ? <CheckCircle2 className="w-5 h-5" /> : 
                              isAttempted ? <Flame className="w-5 h-5" /> :
                              <Code2 className="w-5 h-5" />}
                           </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                                <h3 className="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors truncate pr-4">
                                  {problem.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <div className={cn("flex items-center gap-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border", difficultyColorClass)}>
                                     {getDifficultyBars(problem.difficulty)}
                                     <span>{problem.difficulty}</span>
                                  </div>
                                  
                                  {problem.is_daily && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-orange-400 bg-orange-400/10 border border-orange-400/20">
                                      <Flame className="w-3 h-3 fill-orange-400" /> Daily Challenge
                                    </div>
                                  )}
                                </div>
                            </div>

                            {/* Stats (Hidden on Mobile) */}
                            <div className="hidden sm:flex items-center gap-6 pr-4">
                               {problem.acceptance_rate > 0 && (
                                  <div className="text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Acceptance</div>
                                    <div className="text-sm font-mono text-white flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3 text-primary" /> {problem.acceptance_rate}%
                                    </div>
                                  </div>
                               )}
                               {problem.total_submissions > 0 && (
                                  <div className="text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">Solved By</div>
                                    <div className="text-sm font-mono text-white flex items-center gap-1">
                                      <Users className="w-3 h-3 text-blue-400" /> {problem.total_submissions}
                                    </div>
                                  </div>
                               )}
                            </div>
                          </div>

                          {/* Footer Tags */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-2 overflow-hidden mask-linear-fade">
                               {problem.tags && problem.tags.slice(0, 4).map((tag: string) => (
                                 <span key={tag} className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">
                                   #{tag}
                                 </span>
                               ))}
                            </div>
                            
                            <div className="flex items-center gap-3">
                               {problem.companies && problem.companies.length > 0 && (
                                 <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hidden md:flex">
                                   <Building2 className="w-3 h-3" />
                                   {problem.companies[0]}
                                 </div>
                               )}
                               {isBookmarked && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                            </div>
                          </div>
                        </div>

                        {/* Action Arrow */}
                        <div className="shrink-0 flex items-center justify-center pl-4 border-l border-white/5">
                          <div className="w-8 h-8 rounded-full bg-primary/0 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:scale-110">
                             <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
