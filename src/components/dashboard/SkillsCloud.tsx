import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface SkillsCloudProps {
  skills: { name: string; count: number }[];
}

export function SkillsCloud({ skills }: SkillsCloudProps) {
  if (skills.length === 0) {
    return null;
  }

  const maxCount = Math.max(...skills.map((s) => s.count));
  
  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-base px-3 py-1.5';
    if (ratio > 0.4) return 'text-sm px-2.5 py-1';
    return 'text-xs px-2 py-0.5';
  };

  const getColor = (index: number) => {
    const colors = [
      'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
      'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Skills & Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 15).map((skill, index) => (
            <Badge
              key={skill.name}
              className={`${getSize(skill.count)} ${getColor(index)} border transition-all cursor-default`}
            >
              {skill.name}
              <span className="ml-1.5 opacity-60">({skill.count})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
