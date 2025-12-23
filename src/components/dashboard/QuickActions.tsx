import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Code2, 
  Calendar, 
  GraduationCap, 
  Trophy, 
  Terminal,
  ArrowRight,
  Zap
} from 'lucide-react';

interface QuickActionsProps {
  lastProblemSlug?: string | null;
}

export function QuickActions({ lastProblemSlug }: QuickActionsProps) {
  const actions = [
    {
      label: 'Continue Practicing',
      description: lastProblemSlug ? 'Resume where you left off' : 'Start solving problems',
      icon: Code2,
      href: lastProblemSlug ? `/practice-arena/${lastProblemSlug}` : '/practice-arena',
      color: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400',
      primary: true,
    },
    {
      label: 'Join an Event',
      description: 'Participate in hackathons',
      icon: Calendar,
      href: '/events',
      color: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-400',
    },
    {
      label: 'Take an Exam',
      description: 'IITM practice exams',
      icon: GraduationCap,
      href: '/degree',
      color: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-400',
    },
    {
      label: 'View Leaderboard',
      description: 'Check your ranking',
      icon: Trophy,
      href: '/leaderboard',
      color: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400',
    },
    {
      label: 'Online Compiler',
      description: 'Write and run code',
      icon: Terminal,
      href: '/compiler',
      color: 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20 text-pink-400',
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group ${action.color}`}
          >
            <div className="flex items-center gap-3">
              <action.icon className="h-5 w-5" />
              <div>
                <p className="font-medium text-foreground text-sm">{action.label}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
