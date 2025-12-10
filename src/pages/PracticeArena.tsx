import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, ChevronRight, Filter, ArrowLeft, Layers, Hash, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PracticeArena() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !filterDifficulty || p.difficulty === filterDifficulty;
    const matchesTopic = !selectedTopic || (p.tags && p.tags.includes(selectedTopic));
    
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    }
  };

  const handleTopicSelect = (topic: string | null) => {
    setSelectedTopic(topic);
    setIsFilterOpen(false);
  };

  const TopicsSidebar = () => (
    <div className="space-y-4 p-4 md:p-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4" /> Topics
        </h3>
        {selectedTopic && (
          <Button variant="ghost" size="sm" onClick={() => handleTopicSelect(null)} className="h-6 text-[10px] text-red-400 hover:text-red-300 px-2">
            Clear
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] pr-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => handleTopicSelect(null)}
            className={cn(
              "w-full justify-start text-sm h-9",
              selectedTopic === null ? "bg-primary/20 text-primary font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Filter className="w-4 h-4 mr-2" /> All Topics
          </Button>
          
          {topics.map((topic: any) => (
            <Button
              key={topic.id}
              variant="ghost"
              onClick={() => handleTopicSelect(topic.name)}
              className={cn(
                "w-full justify-start text-sm h-9",
                selectedTopic === topic.name ? "bg-primary/20 text-primary font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Hash className="w-3 h-3 mr-2 opacity-50" />
              {topic.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/20 flex flex-col">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] sticky top-0 z-50 backdrop-blur-md bg-[#0c0c0e]/80 shrink-0">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white h-8 w-8 md:h-9 md:w-9">
              <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
            </Button>
            <h1 className="text-base md:text-xl font-bold font-neuropol tracking-wide">
              Practice<span className="text-primary">Arena</span>
            </h1>
          </div>
          
          {/* Top Filters (Search & Difficulty) */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            {/* Mobile Filter Button */}
            {isMobile && (
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/5 relative">
                    <Filter className="w-4 h-4" />
                    {selectedTopic && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 bg-[#0c0c0e] border-white/10">
                  <TopicsSidebar />
                </SheetContent>
              </Sheet>
            )}
            
            {/* Search - Hidden on very small screens, shown inline on md+ */}
            <div className="relative group hidden sm:block w-40 md:w-64">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative flex items-center bg-[#0c0c0e] rounded-lg border border-white/10 px-2 h-8 md:h-9">
                <Search className="w-3.5 md:w-4 h-3.5 md:h-4 text-muted-foreground ml-1" />
                <Input 
                  placeholder="Search..." 
                  className="border-none bg-transparent focus-visible:ring-0 h-full text-xs md:text-sm text-white placeholder:text-muted-foreground/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Difficulty Filters */}
            <div className="flex gap-0.5 md:gap-1 bg-white/5 p-0.5 md:p-1 rounded-lg border border-white/10">
              {['Easy', 'Medium', 'Hard'].map(diff => (
                <Button 
                  key={diff}
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                  className={cn(
                    "h-6 md:h-7 text-[10px] md:text-xs px-1.5 md:px-2 hover:bg-white/10 transition-all", 
                    filterDifficulty === diff && "bg-white/10 text-primary font-bold shadow-sm"
                  )}
                >
                  {isMobile ? diff[0] : diff}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="sm:hidden px-3 pb-3">
          <div className="relative flex items-center bg-[#0c0c0e] rounded-lg border border-white/10 px-2 h-9">
            <Search className="w-4 h-4 text-muted-foreground ml-1" />
            <Input 
              placeholder="Search problems..." 
              className="border-none bg-transparent focus-visible:ring-0 h-full text-sm text-white placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-4 md:py-6 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        
        {/* Left Sidebar: Topics (Desktop only) */}
        <div className="hidden md:block col-span-1">
          <TopicsSidebar />
        </div>

        {/* Right Content: Problem List */}
        <div className="col-span-1 md:col-span-3 space-y-3 md:space-y-4">
          {isLoading ? (
            <div className="space-y-3 md:space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-16 md:h-20 bg-white/5 rounded-xl animate-pulse border border-white/5" />)}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 border border-dashed border-white/10 rounded-xl bg-white/5 mt-6 md:mt-10">
              <Filter className="w-10 md:w-12 h-10 md:h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-sm md:text-base text-center">No problems found matching filters.</p>
              <Button variant="link" onClick={() => {setSearchTerm(''); setFilterDifficulty(null); setSelectedTopic(null);}} className="text-primary mt-2 text-sm">Reset All Filters</Button>
            </div>
          ) : (
            <>
              <div className="text-[10px] md:text-xs text-muted-foreground font-mono mb-1 md:mb-2">Showing {filteredProblems.length} problems</div>
              {filteredProblems.map((problem) => (
                <Card 
                  key={problem.id} 
                  className="bg-[#0c0c0e] border-white/10 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/practice-arena/${problem.slug}`)}
                >
                  <CardContent className="p-3 md:p-5 flex items-center justify-between relative z-10">
                    <div className="space-y-1.5 md:space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h3 className="text-sm md:text-base font-bold text-white group-hover:text-primary transition-colors truncate">{problem.title}</h3>
                        <Badge variant="outline" className={cn("text-[9px] md:text-[10px] uppercase tracking-wider font-bold h-4 md:h-5 px-1 md:px-1.5 shrink-0", getDifficultyColor(problem.difficulty))}>
                          {problem.difficulty}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 flex-wrap">
                        {problem.tags && problem.tags.slice(0, isMobile ? 2 : 4).map((tag: string) => (
                          <span key={tag} className="text-[9px] md:text-[10px] text-muted-foreground bg-white/5 px-1.5 md:px-2 py-0.5 rounded border border-white/5 transition-colors">
                            {tag}
                          </span>
                        ))}
                        {problem.tags && problem.tags.length > (isMobile ? 2 : 4) && (
                          <span className="text-[9px] md:text-[10px] text-muted-foreground">
                            +{problem.tags.length - (isMobile ? 2 : 4)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 md:gap-6 shrink-0 ml-2">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all duration-300">
                        <ChevronRight className="w-3.5 md:w-4 h-3.5 md:h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
