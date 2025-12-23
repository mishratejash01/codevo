import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHeaderProps {
  profile: {
    full_name?: string | null;
    avatar_url?: string | null;
    username?: string | null;
    created_at?: string | null;
  } | null;
  totalPoints: number;
}

export function DashboardHeader({ profile, totalPoints }: DashboardHeaderProps) {
  const name = profile?.full_name || profile?.username || 'Coder';
  const initials = name.slice(0, 2).toUpperCase();
  const memberSince = profile?.created_at 
    ? format(new Date(profile.created_at), 'MMMM yyyy')
    : 'Recently';

  const getTier = (points: number) => {
    if (points >= 5000) return { name: 'Diamond', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    if (points >= 2500) return { name: 'Platinum', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' };
    if (points >= 1000) return { name: 'Gold', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    if (points >= 500) return { name: 'Silver', color: 'bg-gray-400/20 text-gray-300 border-gray-400/30' };
    return { name: 'Bronze', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
  };

  const tier = getTier(totalPoints);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-purple-500/10 opacity-50" />
      
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary/30 shadow-lg shadow-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={name} />
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {name.split(' ')[0]}!
              </h1>
              <Badge className={`${tier.color} border`}>
                {tier.name}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Member since {memberSince} • {totalPoints.toLocaleString()} points earned
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="border-border/50">
            <Link to="/profile">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
