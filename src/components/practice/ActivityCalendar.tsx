import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityCalendarProps {
  userId: string | undefined;
}

export function ActivityCalendar({ userId }: ActivityCalendarProps) {
  const { data: submissions = [] } = useQuery({
    queryKey: ['user_activity', userId],
    queryFn: async () => {
      if (!userId) return [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
      
      const { data, error } = await supabase
        .from('practice_submissions')
        .select('submitted_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('submitted_at', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId
  });

  // Create activity map
  const activityMap = new Map<string, number>();
  submissions.forEach(s => {
    if (s.submitted_at) {
      const date = s.submitted_at.split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    }
  });

  // Generate last 12 weeks (84 days) of dates
  const weeks: string[][] = [];
  const today = new Date();
  
  for (let week = 0; week < 12; week++) {
    const weekDates: string[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (11 - week) * 7 - (6 - day));
      weekDates.push(date.toISOString().split('T')[0]);
    }
    weeks.push(weekDates);
  }

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-white/5';
    if (count === 1) return 'bg-green-900/50';
    if (count === 2) return 'bg-green-700/60';
    if (count <= 4) return 'bg-green-600/70';
    return 'bg-green-500';
  };

  if (!userId) return null;

  return (
    <Card className="bg-[#0c0c0e] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-400" /> Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-[3px]">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[3px]">
              {week.map((date, dayIdx) => {
                const count = activityMap.get(date) || 0;
                return (
                  <div
                    key={date}
                    className={cn(
                      "w-2.5 h-2.5 rounded-[2px] transition-colors",
                      getIntensity(count)
                    )}
                    title={`${date}: ${count} submission${count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn("w-2 h-2 rounded-[2px]", getIntensity(i))}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
