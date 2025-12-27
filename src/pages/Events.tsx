import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, Zap, Sparkles, Loader2, Flame, Trophy, Clock, ArrowUpRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { InvitationBanner } from '@/components/events/InvitationBanner';
import { Session } from '@supabase/supabase-js';
import { differenceInDays, differenceInHours } from 'date-fns';

// --- Types ---
interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  created_at: string;
  image_url: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  prize_pool: string;
  is_featured: boolean;
  event_type: 'hackathon' | 'normal';
  max_team_size: number | null; // Added field
}

// --- Your New EventCard Component ---
const EventCard = ({ event }: { event: Event }) => {
  return (
    <article className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 py-12 border-b border-white/10 last:border-0">
      
      {/* 1. Image Section */}
      <div className="h-[220px] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/50">
        <img 
          src={event.image_url} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 2. Content Section */}
      <div className="flex flex-col">
        {/* Category Tag */}
        <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase mb-2">
          {event.category}
        </span>

        {/* Title */}
        <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
          {event.title}
        </h2>

        {/* Description */}
        <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-2xl line-clamp-2">
          {event.short_description}
        </p>

        {/* 3. Human-Friendly Information Strip */}
        <div className="grid grid-cols-4 gap-4 py-5 border-y border-dashed border-zinc-800 mb-8">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Prizes</span>
            <span className="font-mono text-xs text-zinc-200">{event.prize_pool || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Where</span>
            <span className="font-mono text-xs text-zinc-200">{event.mode}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Team Size</span>
            <span className="font-mono text-xs text-zinc-200">
              {(event.max_team_size && event.max_team_size > 1) ? `Up to ${event.max_team_size}` : "Solo"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">Ends On</span>
            <span className="font-mono text-xs text-zinc-200">
              {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-auto">
          <a 
            href={`/events/${event.slug}`}
            className="bg-white text-black px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm hover:bg-zinc-200 transition-all duration-200 text-center flex items-center gap-2"
          >
            View Details —
          </a>

          <button className="border border-zinc-700 text-white px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm hover:border-white transition-all duration-200">
            Register Now
          </button>
        </div>
      </div>
    </article>
  );
};

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hackathon' | 'normal'>('all');

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (session) {
      fetchEvents();
    }
  }, [session]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (!error && data) setEvents(data as unknown as Event[]);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.event_type === filter);
  
  // Logic to separate Featured event if you want to keep the Hero section, 
  // or simply list all events below. 
  // For this design, I will keep the Hero for the Main Featured Event, and list the rest using your new card.
  const featuredEvent = filteredEvents.find(e => e.is_featured) || filteredEvents[0];
  const regularEvents = filteredEvents.filter(e => e.id !== featuredEvent?.id);

  // Helper for Hero Section Countdown
  const getCountdownData = (event: Event) => {
    if (!event) return { text: "Closed", percent: 100 };
    const now = new Date();
    const deadline = new Date(event.registration_deadline || event.start_date);
    const created = new Date(event.created_at);
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now) % 24;

    let text = now > deadline ? "Closed" : daysLeft > 0 ? `${daysLeft} Days left` : `${hoursLeft} Hours left`;
    const totalDuration = deadline.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    let percent = Math.max(5, Math.min(100, (elapsed / totalDuration) * 100));

    return { text, percent };
  };

  const featuredStats = featuredEvent ? getCountdownData(featuredEvent) : { text: "", percent: 0 };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-inter relative overflow-x-hidden">
      
      {/* Ambient Background (Preserved from Original) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] opacity-30 animate-pulse delay-700" />
        <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] opacity-20" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <Header session={session} onLogout={handleLogout} />

      <main className="relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto space-y-12">
        
        <InvitationBanner />
        
        {/* Header & Filter Bar (Preserved) */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-8 bg-primary/50"></span>
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary/80 font-bold glow-text">Global Events</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
              Discover <span className="text-white">Events</span>
            </h1>
          </div>
          
          <div className="flex p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
            {[
              { id: 'all', label: 'All Events', icon: Sparkles },
              { id: 'hackathon', label: 'Hackathons', icon: Code },
              { id: 'normal', label: 'Workshops', icon: Zap }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={cn(
                  "relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300",
                  filter === item.id 
                    ? "text-black" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {filter === item.id && (
                  <motion.div 
                    layoutId="filter-pill"
                    className="absolute inset-0 bg-white rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className={cn("w-3.5 h-3.5", filter === item.id ? "text-black" : "text-current")} />
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* --- HERO: Featured Event (Preserved Original Design for "Featured" only) --- */}
        {featuredEvent && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer mb-20"
            onClick={() => navigate(`/events/${featuredEvent.slug}`)}
          >
            <div className="absolute inset-0">
              <img 
                src={featuredEvent.image_url} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                alt={featuredEvent.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 p-8 md:p-16 min-h-[500px] flex flex-col justify-end">
               <div className="mb-auto flex justify-between items-start">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                    <Flame className="w-3 h-3 fill-current animate-pulse" /> Featured Selection
                  </span>
               </div>

               <div className="max-w-4xl space-y-6">
                 <h2 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tighter text-white">
                   {featuredEvent.title}
                 </h2>
                 <div className="flex flex-wrap gap-8 items-center text-white/60">
                    <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> {featuredEvent.prize_pool || "N/A"} Prize Pool</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> {featuredStats.text}</span>
                 </div>
                 
                 <Button className="h-12 px-8 rounded-full bg-white text-black font-bold hover:bg-zinc-200 mt-4">
                    Register Now <ArrowUpRight className="w-4 h-4 ml-2" />
                 </Button>
               </div>
            </div>
          </motion.div>
        )}

        {/* --- MAIN LIST: Replaced Carousel with Your New EventCard List --- */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2 mb-8">
            <span className="w-2 h-8 bg-primary rounded-full mr-2" />
            All Opportunities
          </h3>
          
          <div className="flex flex-col">
            {loading ? (
               <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-white" /></div>
            ) : regularEvents.length > 0 ? (
              regularEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
               <div className="text-center py-20 text-white/40">No other events found matching your criteria.</div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
