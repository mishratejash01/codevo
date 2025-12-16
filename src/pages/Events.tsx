import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, Users, ArrowRight, Clock, ExternalLink, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';

interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string; // Made optional as it might be null
  created_at: string; // Needed for progress bar calculation
  image_url: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  prize_pool: string;
  is_featured: boolean;
  registration_link?: string;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data as Event[]);
    }
    setLoading(false);
  };

  const featuredEvent = events.find(e => e.is_featured) || events[0];
  const regularEvents = events.filter(e => e.id !== featuredEvent?.id);

  // --- DYNAMIC COUNTDOWN LOGIC ---
  const getCountdownData = (event: Event) => {
    if (!event) return { text: "Closed", percent: 100 };

    const now = new Date();
    // Use registration_deadline if available, otherwise fallback to start_date
    const deadline = new Date(event.registration_deadline || event.start_date);
    const created = new Date(event.created_at);

    // Calculate time remaining
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now) % 24;

    let text = "";
    if (now > deadline) {
      text = "Registration Closed";
    } else if (daysLeft > 0) {
      text = `${daysLeft} Days left`;
    } else {
      text = `${hoursLeft} Hours left`;
    }

    // Calculate progress bar percentage
    const totalDuration = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    let percent = (elapsed / totalDuration) * 100;
    
    // Clamp percentage between 5% (so it's visible) and 100%
    percent = Math.max(5, Math.min(100, percent));

    return { text, percent };
  };

  const featuredStats = featuredEvent ? getCountdownData(featuredEvent) : { text: "", percent: 0 };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <Header session={null} onLogout={() => {}} />

      <main className="pt-24 pb-20">
        
        {/* --- HERO SECTION --- */}
        {loading ? (
          <div className="container mx-auto px-6 h-[400px] flex items-center justify-center">
             <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
          </div>
        ) : featuredEvent && (
          <div className="container mx-auto px-4 md:px-6 mb-20 relative">
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(124,58,237,0.1)] group">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0">
                <img 
                  src={featuredEvent.image_url} 
                  alt={featuredEvent.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
              </div>

              <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row gap-8 items-start md:items-end justify-between h-full min-h-[500px]">
                <div className="max-w-2xl space-y-6">
                  <div className="flex gap-3">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 backdrop-blur-md px-3 py-1">
                      Featured Event
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white/80 backdrop-blur-md">
                      {featuredEvent.category}
                    </Badge>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                    {featuredEvent.title}
                  </h1>
                  
                  <p className="text-lg text-gray-300 line-clamp-2 max-w-xl">
                    {featuredEvent.short_description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-300 pt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      {format(new Date(featuredEvent.start_date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      {featuredEvent.mode} • {featuredEvent.location}
                    </div>
                    {featuredEvent.prize_pool && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        {featuredEvent.prize_pool} Prize Pool
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-4">
                    <Button 
                      size="lg" 
                      onClick={() => navigate(`/events/${featuredEvent.slug}`)}
                      className="bg-white text-black hover:bg-gray-200 font-bold px-8 h-12 rounded-xl"
                    >
                      Explore Details
                    </Button>
                  </div>
                </div>

                {/* DYNAMIC Countdown / Stats Box */}
                <div className="hidden md:block bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl w-72">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Users className="w-5 h-5" /></div>
                     <div>
                        {/* You could optionally fetch real count here with separate query */}
                        <div className="text-2xl font-bold text-white">450+</div>
                        <div className="text-xs text-gray-400">Registered Hackers</div>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-xs text-gray-400">
                        <span>Registration Status</span>
                        <span className={cn("font-bold", featuredStats.text === "Registration Closed" ? "text-red-400" : "text-white")}>
                          {featuredStats.text}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${featuredStats.percent}%` }}
                        />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- LISTING SECTION --- */}
        <div className="container mx-auto px-4 md:px-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <h2 className="text-3xl font-bold font-neuropol tracking-wide">Explore Events</h2>
              
              <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl h-auto">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4 py-2">All Events</TabsTrigger>
                <TabsTrigger value="hackathon" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4 py-2">Hackathons</TabsTrigger>
                <TabsTrigger value="workshop" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4 py-2">Workshops</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
               <EventGrid events={regularEvents} loading={loading} />
            </TabsContent>
            <TabsContent value="hackathon" className="mt-0">
               <EventGrid events={regularEvents.filter(e => e.category === 'Hackathon')} loading={loading} />
            </TabsContent>
            <TabsContent value="workshop" className="mt-0">
               <EventGrid events={regularEvents.filter(e => e.category === 'Workshop')} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function EventGrid({ events, loading }: { events: Event[], loading: boolean }) {
  const navigate = useNavigate();
  
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <Skeleton key={i} className="h-[400px] rounded-2xl bg-white/5" />)}</div>;

  if (events.length === 0) return <div className="text-center py-20 text-gray-500">No upcoming events found. Stay tuned!</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {events.map((event) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={event.id}
          className="group relative bg-[#0c0c0e] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] flex flex-col h-full"
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80">{event.category}</Badge>
            </div>
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
                  {format(new Date(event.start_date), 'MMM d, yyyy')}
                </p>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1" title={event.title}>
                  {event.title}
                </h3>
              </div>
            </div>

            <p className="text-gray-400 text-sm line-clamp-2 mb-6 flex-1">
              {event.short_description}
            </p>

            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {event.mode}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Open to all
              </div>
            </div>

            <Button 
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 group-hover:border-purple-500/50 group-hover:bg-purple-500/10 group-hover:text-purple-300 transition-all"
              onClick={() => navigate(`/events/${event.slug}`)}
            >
              View Details <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
