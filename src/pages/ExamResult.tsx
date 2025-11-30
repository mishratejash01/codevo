import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, AlertTriangle, ArrowRight, Home, Target, BarChart2, User, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamResultState {
  stats: {
    score: number;
    totalScore: number;
    accuracy: number;
    correct: number;
    totalQuestions: number;
    attempted: number;
  };
  questionDetails: any[];
  terminationReason?: string;
  isError?: boolean;
  totalTime: number;
  examMetadata?: {
    subjectId: string | null;
    examType: string | null;
    setName: string | null;
  };
}

const ExamResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamResultState;

  if (!state) return <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center"><h1 className="text-2xl font-bold mb-4">No Result Data</h1><Button onClick={() => navigate('/')}>Home</Button></div>;

  const { stats, questionDetails, terminationReason, isError, totalTime, examMetadata } = state;
  const formatTime = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}m ${sec}s`; };

  // Determine which table/view to query for leaderboard
  // If IITM Subject -> Use 'iitm_leaderboard' view. Else -> Use 'exam_sessions' table directly.
  const LEADERBOARD_SOURCE = examMetadata?.subjectId ? 'iitm_leaderboard' : 'exam_sessions';

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', examMetadata],
    queryFn: async () => {
      let query = supabase
        .from(LEADERBOARD_SOURCE)
        .select('user_id, total_score, duration_seconds')
        .eq('status', 'completed') // Ensure we only compare completed exams
        .order('total_score', { ascending: false })
        .limit(10);

      // Apply IITM specific filters if applicable
      if (examMetadata?.subjectId) {
        // @ts-ignore
        query = query.eq('subject_id', examMetadata.subjectId)
                     .eq('exam_type', decodeURIComponent(examMetadata.examType || ''))
                     .eq('set_name', examMetadata.setName);
      }
      
      const { data, error } = await query;
      if (error) console.error(error);
      return data || [];
    },
    enabled: !!examMetadata
  });

  const avgScore = leaderboard.length > 0 ? leaderboard.reduce((acc, curr) => acc + (curr.total_score || 0), 0) / leaderboard.length : 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
           <div className={cn("inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 border-4 shadow-2xl", isError ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-green-500/10 border-green-500/20 text-green-500")}>
             {isError ? <XCircle className="w-12 h-12" /> : <Trophy className="w-12 h-12" />}
           </div>
           <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide text-white">{isError ? "Exam Terminated" : "Assessment Complete"}</h1>
           {terminationReason && <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border", isError ? "bg-red-950/30 border-red-500/30 text-red-400" : "bg-blue-950/30 border-blue-500/30 text-blue-400")}><AlertCircle className="w-4 h-4" /><span className="text-sm font-medium">{terminationReason}</span></div>}
        </div>

        <Card className="bg-[#0c0c0e] border-white/10 text-white overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5"><CardTitle className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-400" /> Comparative Analytics</CardTitle></CardHeader>
          <CardContent className="p-8">
            <div className="flex items-end justify-center gap-16 h-48">
              <div className="flex flex-col items-center gap-3 w-24 group"><div className="text-2xl font-bold text-white group-hover:scale-110 transition-transform">{stats.score.toFixed(0)}</div><div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg relative transition-all duration-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]" style={{ height: `${Math.max(5, Math.min(100, (stats.score / stats.totalScore) * 100))}%` }}></div><div className="text-xs text-blue-400 font-bold uppercase tracking-wider bg-blue-400/10 px-2 py-1 rounded">You</div></div>
              <div className="flex flex-col items-center gap-3 w-24 group"><div className="text-2xl font-bold text-gray-400 group-hover:scale-110 transition-transform">{avgScore.toFixed(0)}</div><div className="w-full bg-white/10 rounded-t-lg relative transition-all duration-500 hover:bg-white/20" style={{ height: `${Math.max(5, Math.min(100, (avgScore / stats.totalScore) * 100))}%` }}></div><div className="text-xs text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded">Average</div></div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">Comparing against students in <strong>{examMetadata?.setName}</strong></p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0c0c0e] border-white/10 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase">Score</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.score.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalScore}</span></div></CardContent></Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase">Accuracy</CardTitle></CardHeader><CardContent><div className={cn("text-3xl font-bold", stats.accuracy >= 70 ? "text-green-500" : "text-orange-500")}>{stats.accuracy}%</div></CardContent></Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase">Time</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold font-mono">{formatTime(totalTime)}</div></CardContent></Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase">Attempted</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.attempted} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalQuestions}</span></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#0c0c0e] border-white/10 text-white overflow-hidden flex flex-col h-full"><CardHeader className="border-b border-white/5 bg-white/5"><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Question Analysis</CardTitle></CardHeader><CardContent className="p-0 flex-1"><Table><TableHeader className="bg-black/20"><TableRow className="hover:bg-transparent border-white/5"><TableHead className="text-muted-foreground">Question</TableHead><TableHead className="text-center text-muted-foreground">Status</TableHead><TableHead className="text-right text-muted-foreground">Score</TableHead></TableRow></TableHeader><TableBody>{questionDetails.map((q) => (<TableRow key={q.id} className="border-white/5 hover:bg-white/5"><TableCell className="font-medium text-gray-200">{q.title}</TableCell><TableCell className="text-center"><span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", q.status === 'Correct' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{q.status}</span></TableCell><TableCell className="text-right font-bold">{q.score}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
          <Card className="bg-[#0c0c0e] border-white/10 text-white overflow-hidden flex flex-col h-full"><CardHeader className="border-b border-white/5 bg-white/5"><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Leaderboard</CardTitle></CardHeader><CardContent className="p-0 flex-1"><Table><TableHeader className="bg-black/20"><TableRow className="hover:bg-transparent border-white/5"><TableHead className="w-12 text-center text-muted-foreground">Rank</TableHead><TableHead className="text-muted-foreground">User</TableHead><TableHead className="text-right text-muted-foreground">Score</TableHead></TableRow></TableHeader><TableBody>{leaderboard.length > 0 ? leaderboard.map((entry: any, i: number) => (<TableRow key={i} className={cn("border-white/5 hover:bg-white/5", entry.total_score === stats.score && entry.duration_seconds === totalTime ? "bg-blue-500/10" : "")}><TableCell className="text-center font-mono font-bold text-muted-foreground">#{i + 1}</TableCell><TableCell className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div><span className="truncate max-w-[120px] text-sm">Student {entry.user_id.slice(0, 4)}</span>{entry.total_score === stats.score && entry.duration_seconds === totalTime && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded">YOU</span>}</TableCell><TableCell className="text-right font-bold text-yellow-500">{entry.total_score}</TableCell></TableRow>)) : (<TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">Be the first to set a record!</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 pb-12"><Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 h-12 px-8" onClick={() => { sessionStorage.clear(); navigate('/degree'); }}><ArrowRight className="w-4 h-4 mr-2" /> Attempt Another</Button><Button size="lg" className="bg-primary hover:bg-primary/90 text-white h-12 px-8" onClick={() => { sessionStorage.clear(); navigate('/'); }}><Home className="w-4 h-4 mr-2" /> Return Home</Button></div>
      </div>
    </div>
  );
};

export default ExamResult;
