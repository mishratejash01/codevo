import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Trophy, ChevronRight, ChevronLeft, 
  Clock, Sparkles, Loader2, Code, Zap, ArrowUpRight, Flame, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';
import { InvitationBanner } from '@/components/events/InvitationBanner';
import { Session } from '@supabase/supabase-js';

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
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hackathon' | 'normal'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.event_type === filter);
  const featuredEvent = filteredEvents.find(e => e.is_featured) || filteredEvents[0];
  const regularEvents = filteredEvents.filter(e => e.id !== featuredEvent?.id);

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
      
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] opacity-30 animate-pulse delay-700" />
        <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] opacity-20" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <Header session={session} onLogout={handleLogout} />

      <main className="relative z-10 pt-24 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto space-y-12">
        
        <InvitationBanner />
        
        {/* Header & Filter Bar */}
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

        {/* --- HERO: Featured Event --- */}
        <AnimatePresence mode='wait'>
          {loading ? (
             <div className="w-full h-[500px] rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
          ) : featuredEvent && (
            <motion.div 
              key={featuredEvent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer"
              onClick={() => navigate(`/events/${featuredEvent.slug}`)}
            >
              {/* Background Image & Overlay */}
              <div className="absolute inset-0">
                <img 
                  src={featuredEvent.image_url} 
                  className="w-full h-full object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                  alt={featuredEvent.title}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 md:p-16 flex flex-col justify-between min-h-[500px] md:min-h-[600px]">
                
                {/* Top Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_-3px_rgba(var(--primary),0.5)]">
                      <Flame className="w-3 h-3 fill-current animate-pulse" /> Featured
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-white/80 border border-white/10 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                      {featuredEvent.category}
                    </span>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-end">
                     <span className="text-4xl font-mono font-bold text-white/20 tracking-tighter">01</span>
                     <span className="text-[10px] uppercase tracking-widest text-white/40">Featured Selection</span>
                  </div>
                </div>

                {/* Main Text */}
                <div className="max-w-3xl space-y-6 mt-10 md:mt-0">
                  <h2 className="text-4xl md:text-7xl font-bold leading-[0.9] tracking-tighter text-white drop-shadow-2xl">
                    {featuredEvent.title}
                  </h2>
                  <p className="text-lg text-white/60 leading-relaxed max-w-xl line-clamp-3">
                    {featuredEvent.short_description}
                  </p>
                  
                  <div className="flex flex-wrap gap-8 pt-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Prize Pool</div>
                      <div className="text-2xl font-mono text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        {featuredEvent.prize_pool || "N/A"}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Deadline</div>
                      <div className="text-2xl font-mono text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        {featuredStats.text}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-white/10 mt-10">
                  <div className="w-full sm:w-auto">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Registration</span>
                       <span className="text-[10px] font-mono text-primary">{featuredStats.percent.toFixed(0)}%</span>
                     </div>
                     <div className="h-1.5 w-full sm:w-64 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${featuredStats.percent}%` }} 
                         transition={{ duration: 1.5, ease: "easeOut" }}
                         className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                       />
                     </div>
                  </div>

                  <Button className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-zinc-200 transition-all group/btn">
                    Register Now <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </Button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- CAROUSEL HEADER --- */}
        <div className="flex items-center justify-between pt-8">
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full mr-2" />
            Upcoming Opportunities
          </h3>
          <div className="flex gap-2">
            <Button onClick={() => scroll('left')} variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button onClick={() => scroll('right')} variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* --- CAROUSEL SCROLL --- */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-12 pt-4 px-1 no-scrollbar snap-x snap-mandatory"
        >
          {loading ? [1,2,3,4].map(i => (
             <div key={i} className="min-w-[350px] h-[420px] rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
          )) : regularEvents.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/events/${event.slug}`)}
              className="min-w-[320px] md:min-w-[400px] snap-start group relative rounded-[2rem] bg-[#0c0c0e] border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
            >
              {/* Image Area */}
              <div className="h-56 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] to-transparent z-10" />
                <img 
                  src={event.image_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                  alt={event.title}
                />
                
                {/* Floating Date Badge */}
                <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex flex-col items-center text-center min-w-[60px]">
                  <span className="text-[10px] uppercase text-white/60 font-bold">{format(new Date(event.start_date), 'MMM')}</span>
                  <span className="text-xl font-bold text-white leading-none">{format(new Date(event.start_date), 'dd')}</span>
                </div>

                {/* Category Tag */}
                <div className="absolute top-4 right-4 z-20">
                   <Badge className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 text-[10px] uppercase tracking-wider font-bold">
                      {event.category}
                   </Badge>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 relative z-20 -mt-6">
                 <h4 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                   {event.title}
                 </h4>
                 
                 <div className="flex items-center gap-4 text-xs text-white/40 font-mono mb-4">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {event.mode}</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3" /> {event.prize_pool || "Certificate"}</span>
                 </div>

                 <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-6 h-10">
                   {event.short_description}
                 </p>

                 <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex -space-x-2">
                       {[1,2,3].map((_, i) => (
                         <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-[#0c0c0e] flex items-center justify-center text-[8px] text-white/40">
                           <Users className="w-3 h-3" />
                         </div>
                       ))}
                       <div className="w-6 h-6 rounded-full bg-zinc-800 border border-[#0c0c0e] flex items-center justify-center text-[8px] text-white/60 font-bold pl-1">
                         +
                       </div>
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-300">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
