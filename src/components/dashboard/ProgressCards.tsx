import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Code2, GraduationCap, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PracticeStats {
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
  acceptanceRate: number;
}

interface ExamStats {
  totalExams: number;
  averageScore: number;
  bestScore: number;
  subjectsAttempted: number;
}

interface ProgressCardsProps {
  practiceStats: PracticeStats;
  examStats: ExamStats;
}

export function ProgressCards({ practiceStats, examStats }: ProgressCardsProps) {
  const difficultyColors = {
    easy: { bar: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    medium: { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    hard: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Practice Arena Progress */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="h-5 w-5 text-primary" />
            Practice Arena
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['easy', 'medium', 'hard'] as const).map((difficulty) => {
            const stats = practiceStats[difficulty];
            const percentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
            const colors = difficultyColors[difficulty];
            
            return (
              <div key={difficulty} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className={`capitalize font-medium ${colors.text}`}>{difficulty}</span>
                  <span className="text-muted-foreground">
                    {stats.solved}/{stats.total}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors.bar} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          <div className="pt-2 flex items-center justify-between border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Acceptance Rate</span>
            </div>
            <span className="font-semibold text-foreground">
              {practiceStats.acceptanceRate.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* IITM Exam Performance */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
            IITM Exam Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{examStats.totalExams}</p>
              <p className="text-xs text-muted-foreground">Exams Taken</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{examStats.averageScore.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-emerald-400">{examStats.bestScore}%</p>
              <p className="text-xs text-muted-foreground">Best Score</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 text-center">
              <p className="text-2xl font-bold text-foreground">{examStats.subjectsAttempted}</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </div>
          </div>
          
          {examStats.totalExams > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">
                Keep practicing to improve your scores!
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
