import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, Zap, Filter, ArrowLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PracticeArena() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

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

  const filteredProblems = problems.filter(p => 
    (p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())))) &&
    (!filterDifficulty || p.difficulty === filterDifficulty)
  );

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/20">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] sticky top-0 z-50 backdrop-blur-md bg-[#0c0c0e]/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-neuropol tracking-wide">
              Practice<span className="text-primary">Arena</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Zap className="w-3 h-3 text-yellow-500 mr-2" />
                <span>Daily Challenge: <span className="text-white font-medium">Coming Soon</span></span>
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Problems</h2>
            <p className="text-muted-foreground max-w-lg">
              Sharpen your skills with our curated collection of algorithm and data structure challenges.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {['Easy', 'Medium', 'Hard'].map(diff => (
              <Button 
                key={diff}
                variant="outline" 
                size="sm"
                onClick={() => setFilterDifficulty(filterDifficulty === diff ? null : diff)}
                className={cn(
                  "border-white/10 bg-white/5 hover:bg-white/10 transition-all", 
                  filterDifficulty === diff && "bg-primary/10 border-primary/50 text-primary"
                )}
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <div className="relative flex items-center bg-[#0c0c0e] rounded-xl border border-white/10 p-1 shadow-2xl">
            <Search className="w-5 h-5 text-muted-foreground ml-3" />
            <Input 
              placeholder="Search questions, tags or topics..." 
              className="border-none bg-transparent focus-visible:ring-0 h-12 text-base text-white placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse border border-white/5" />)}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Filter className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No problems found matching your criteria.</p>
              <Button variant="link" onClick={() => {setSearchTerm(''); setFilterDifficulty(null);}} className="text-primary">Clear Filters</Button>
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <Card 
                key={problem.id} 
                className="bg-[#0c0c0e] border-white/10 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(`/practice-arena/${problem.slug}`)}
              >
                <CardContent className="p-6 flex items-center justify-between relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{problem.title}</h3>
                      <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", getDifficultyColor(problem.difficulty))}>
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {problem.tags && problem.tags.map((tag: string) => (
                        <span key={tag} className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5 hover:border-white/20 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Solved By</span>
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black ring-2 ring-black" />)}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all duration-300">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
