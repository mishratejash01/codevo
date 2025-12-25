import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentSidebar } from '@/components/AssignmentSidebar';
import { AssignmentView } from '@/components/AssignmentView';
import { Button } from '@/components/ui/button';
import { 
  Timer, LogOut, LayoutGrid, Home, 
  Infinity as InfinityIcon, Menu, Target, 
  Sparkles, Hash, Zap 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserStatsCard } from '@/components/practice/UserStatsCard';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const IITM_TABLES = { assignments: 'iitm_assignments', testCases: 'iitm_test_cases', submissions: 'iitm_submissions' };
const STANDARD_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

const Practice = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const iitmSubjectId = searchParams.get('iitm_subject');
  const categoryParam = searchParams.get('category');
  const selectedAssignmentId = searchParams.get('q');
  
  const timerParam = parseInt(searchParams.get('timer') || '0');
  const hasTimeLimit = timerParam > 0;
  const timeLimitSeconds = timerParam * 60;

  const activeTables = iitmSubjectId ? IITM_TABLES : STANDARD_TABLES;
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, QuestionStatus>>({});
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth state for stats components
  const [userId, setUserId] = useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: [activeTables.assignments, iitmSubjectId, categoryParam, selectedAssignmentId], 
    queryFn: async () => {
      let query = supabase.from(activeTables.assignments as any).select('*');
      if (selectedAssignmentId) query = query.eq('id', selectedAssignmentId);
      else if (iitmSubjectId) {
        query = query.eq('subject_id', iitmSubjectId);
        if (categoryParam) query = query.eq('category', categoryParam);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).sort((a: any, b: any) => a.title.localeCompare(b.title));
    },
  });

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = () => {
    const time = hasTimeLimit ? timeLimitSeconds - elapsedTime : elapsedTime;
    const absTime = Math.abs(time);
    const m = Math.floor(absTime / 60).toString().padStart(2, '0');
    const s = (absTime % 60).toString().padStart(2, '0');
    return `${time < 0 ? '+' : ''}${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f1f5f9] flex flex-col font-sans">
      {/* Navigation - Refined Breadcrumb Style */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-[#1f1f1f] bg-[#080808] sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="font-extrabold text-xl tracking-tighter">
            PRACTICE<span className="text-[#8b5cf6]">ARENA</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
            <span>DASHBOARD</span>
            <span className="text-[#1f1f1f]">/</span>
            <span className="text-white">OVERVIEW</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-all",
            hasTimeLimit && elapsedTime > timeLimitSeconds ? "bg-red-500/10 border-red-500/50 text-red-500 animate-pulse" : "bg-[#111] border-[#1f1f1f] text-[#64748b]"
          )}>
            {hasTimeLimit ? <Timer className="w-4 h-4" /> : <InfinityIcon className="w-4 h-4" />}
            <span>{formatTimer()}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsExitDialogOpen(true)} className="text-red-400 hover:bg-red-500/10 rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-10 p-6 md:p-12 max-w-[1800px] mx-auto w-full overflow-hidden">
        
        {/* Left Sidebar - Topics & Difficulty */}
        <aside className="hidden lg:flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-xl">
            {['Easy', 'Med', 'Hard'].map((d) => (
              <button key={d} className={cn(
                "py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all",
                d === 'Easy' ? "bg-[#161616] text-[#10b981] shadow-lg" : "text-[#64748b] hover:text-white"
              )}>
                {d}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 text-[10px] font-black text-[#64748b] tracking-widest">
              <Sparkles className="w-3 h-3" /> TOPICS
            </div>
            <nav className="flex flex-col gap-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#8b5cf6]/10 text-[#8b5cf6] font-semibold text-sm cursor-pointer">
                <span className="text-lg">✦</span> All Topics
              </div>
              {['ARRAY', 'STRING', 'HASH TABLE', 'DYNAMIC PROG.'].map(topic => (
                <div key={topic} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#94a3b8] hover:bg-white/5 font-medium text-sm transition-colors cursor-pointer">
                  <Hash className="w-4 h-4 opacity-50" /> {topic}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="bg-[#121212] border border-[#1f1f1f] rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
          <ErrorBoundary>
            {selectedAssignmentId ? (
              <AssignmentView 
                key={selectedAssignmentId}
                assignmentId={selectedAssignmentId} 
                onStatusUpdate={(status) => setQuestionStatuses(prev => ({ ...prev, [selectedAssignmentId]: status }))}
                currentStatus={questionStatuses[selectedAssignmentId]}
                tables={activeTables} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-[#1a1a1a] flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-[#8b5cf6]" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Recommended Challenges</h2>
                <p className="text-[#64748b] mb-8">Select a problem from the list to begin your session.</p>
                <div className="w-full max-w-md space-y-4">
                   {assignments.slice(0, 3).map((a: any) => (
                     <div key={a.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#333] rounded-2xl">
                       <div className="text-left">
                         <div className="font-bold">{a.title}</div>
                         <div className="text-xs text-[#64748b]">{a.category} • <span className="text-[#10b981]">Easy</span></div>
                       </div>
                       <Button variant="outline" size="sm" onClick={() => setSearchParams({ q: a.id })} className="rounded-xl border-[#333] hover:bg-[#8b5cf6] hover:border-[#8b5cf6]">Solve</Button>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </ErrorBoundary>
        </main>

        {/* Right Sidebar - Professional Progress */}
        <aside className="hidden lg:flex flex-col gap-12 overflow-y-auto pr-2">
          <div className="space-y-6">
            <div className="text-[10px] font-black text-[#64748b] tracking-widest px-1">YOUR PROGRESS</div>
            <UserStatsCard userId={userId} />
          </div>

          <div className="space-y-6">
            <div className="text-[10px] font-black text-[#64748b] tracking-widest px-1">ACTIVITY STREAK</div>
            <ActivityCalendar userId={userId} />
          </div>
        </aside>
      </div>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-[#1f1f1f] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">End Practice Session?</DialogTitle>
            <DialogDescription className="text-[#64748b]">Your progress for this session will be cleared.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsExitDialogOpen(false)} className="hover:bg-white/5">Cancel</Button>
            <Button onClick={() => navigate('/')} className="bg-red-500 hover:bg-red-600 text-white font-bold px-8">End Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Practice;
