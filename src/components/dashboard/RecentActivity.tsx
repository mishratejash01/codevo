import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Submission {
  id: string;
  problem_id: string;
  problem_title?: string;
  problem_slug?: string;
  status: string;
  language: string;
  submitted_at: string;
  runtime_ms?: number | null;
}

interface RecentActivityProps {
  submissions: Submission[];
  isLoading: boolean;
}

export function RecentActivity({ submissions, isLoading }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }
    if (status === 'failed' || status === 'error') {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
    return <Clock className="h-4 w-4 text-yellow-400" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Accepted</Badge>;
    }
    if (status === 'failed') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <Link 
          to="/practice-arena" 
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No submissions yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">Start solving problems to see your activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-2">
              {submissions.map((submission) => (
                <Link
                  key={submission.id}
                  to={submission.problem_slug ? `/practice-arena/${submission.problem_slug}` : '#'}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(submission.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {submission.problem_title || 'Problem'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.language} • {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {submission.runtime_ms && (
                      <span className="text-xs text-muted-foreground">{submission.runtime_ms}ms</span>
                    )}
                    {getStatusBadge(submission.status)}
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
