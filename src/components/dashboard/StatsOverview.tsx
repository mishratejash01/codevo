import { Card, CardContent } from '@/components/ui/card';
import { Target, Flame, Trophy, BarChart3 } from 'lucide-react';

interface StatsOverviewProps {
  problemsSolved: number;
  totalProblems: number;
  currentStreak: number;
  totalPoints: number;
  submissionsThisMonth: number;
}

export function StatsOverview({
  problemsSolved,
  totalProblems,
  currentStreak,
  totalPoints,
  submissionsThisMonth,
}: StatsOverviewProps) {
  const stats = [
    {
      label: 'Problems Solved',
      value: `${problemsSolved}/${totalProblems}`,
      icon: Target,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Current Streak',
      value: `${currentStreak} days`,
      icon: Flame,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    {
      label: 'Total Points',
      value: totalPoints.toLocaleString(),
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    {
      label: 'This Month',
      value: `${submissionsThisMonth} submissions`,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label} 
          className={`bg-card/50 backdrop-blur-sm border ${stat.borderColor} hover:border-opacity-50 transition-all duration-300`}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
