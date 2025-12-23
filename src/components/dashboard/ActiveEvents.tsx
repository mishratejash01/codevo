import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { format, isPast, isFuture, isWithinInterval, addDays } from 'date-fns';

interface Event {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  mode: string;
  image_url?: string | null;
  participation_type?: string | null;
  team_name?: string | null;
}

interface ActiveEventsProps {
  events: Event[];
  isLoading: boolean;
}

export function ActiveEvents({ events, isLoading }: ActiveEventsProps) {
  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isPast(end)) {
      return { label: 'Completed', color: 'bg-muted text-muted-foreground' };
    }
    if (isWithinInterval(now, { start, end })) {
      return { label: 'Live Now', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    if (isFuture(start) && isWithinInterval(now, { start: addDays(now, -1), end: start })) {
      return { label: 'Starting Soon', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
    return { label: 'Upcoming', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />
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
          <Calendar className="h-5 w-5 text-primary" />
          My Events
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link to="/events">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No registered events yet</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/events">Explore Events</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => {
              const status = getEventStatus(event.start_date, event.end_date);
              
              return (
                <Link
                  key={event.id}
                  to={`/events/${event.slug}`}
                  className="block p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                        <Badge className={`${status.color} border text-xs shrink-0`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.mode === 'Online' ? 'Online' : event.location}
                          </span>
                        )}
                        {event.team_name && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.team_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
