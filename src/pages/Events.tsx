import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, Users, ChevronRight, ChevronLeft, Clock, Sparkles } from 'lucide-react';
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
  registration_deadline?: string;
  created_at: string;
  image_url: string;
  category: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  location: string;
  prize_pool: string;
  is_featured: boolean;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (!error && data) setEvents(data as Event[]);
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const featuredEvent = events.find(e => e.is_featured) || events[0];
  const regularEvents = events.filter(e => e.id !== featuredEvent?.id);

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
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-inter">
      <Header session={null} onLogout={() => {}} />

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-6 md:px-12">
        
        {/* --- SECTION HEADER --- */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mb-2">Featured Opportunity</h2>
            <h1 className="text-4xl font-medium tracking-tight">Events</h1>
          </div>
          <div className="hidden md:flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800 backdrop-blur-md">
            <Button variant="ghost" size="sm" className="text-xs h-8 bg-zinc-800 shadow-sm hover:bg-zinc-700">All Events</Button>
            <Button variant="ghost" size="sm" className="text-xs h-8 text-zinc-400 hover:text-white">Hackathons</Button>
            <Button variant="ghost" size="sm" className="text-xs h-8 text-zinc-400 hover:text-white">Workshops</Button>
          </div>
        </div>

        {/* --- MAIN FEATURED CARD --- */}
        {loading ? (
          <Skeleton className="w-full h-[500px] rounded-2xl bg-zinc-900" />
        ) : featuredEvent && (
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden flex flex-col lg:flex-row transition-all hover:border-zinc-700 mb-20 group">
            
            {/* Poster Slot */}
            <div className="lg:w-[380px] shrink-0 bg-[#161616] border-r border-[#1F1F1F] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-transparent opacity-60 z-10" />
              <img 
                src={featuredEvent.image_url} 
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" 
              />
              <div className="absolute bottom-8 left-8 right-8 z-20">
                <div className="text-[10px] font-black tracking-[0.3em] uppercase text-white/50 mb-1">Genesis Edition</div>
                <div className="text-xl font-bold tracking-tighter">BUILD THE FUTURE</div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8 lg:p-14 flex-grow flex flex-col justify-between">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase py-1.5 px-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                      Registration Open
                    </span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">{featuredEvent.category}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none">{featuredEvent.title}</h2>
                  <p className="text-zinc-400 text-base leading-relaxed max-w-xl">{featuredEvent.short_description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 shrink-0 md:text-right">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Prize Pool</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{featuredEvent.prize_pool || "Recognition"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Platform</p>
                    <p className="text-sm font-semibold">{featuredEvent.mode} / {featuredEvent.location}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="w-full md:w-72 space-y-4">
                  <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                    <span className="text-zinc-500">Registration Status</span>
                    <span className="text-purple-400">{featuredStats.text}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${featuredStats.percent}%` }} className="h-full bg-purple-500" />
                  </div>
                  <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-wider">450+ Innovators Registered</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="hidden sm:flex flex-col items-end mr-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Starting</p>
                    <p className="text-sm font-bold">{format(new Date(featuredEvent.start_date), 'MMM d, yyyy')}</p>
                  </div>
                  <Button onClick={() => navigate(`/events/${featuredEvent.slug}`)} className="flex-grow md:flex-grow-0 h-14 px-10 bg-white text-black font-black hover:bg-zinc-200 transition-transform active:scale-95">
                    Register Now
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/events/${featuredEvent.slug}`)} className="h-14 px-8 border-zinc-800 text-zinc-300 font-bold hover:bg-zinc-900 transition-colors">
                    Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- EXPLORE ROW (Carousel) --- */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Explore More
            </h3>
            <div className="flex items-center gap-3">
              <Button onClick={() => scroll('left')} variant="outline" size="icon" className="rounded-full w-10 h-10 border-zinc-800 hover:bg-zinc-900">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button onClick={() => scroll('right')} variant="outline" size="icon" className="rounded-full w-10 h-10 border-zinc-800 hover:bg-zinc-900">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-zinc-800 mx-2" />
              <Button variant="link" className="text-purple-400 font-bold uppercase tracking-widest text-[10px] hover:text-purple-300">
                View All Events
              </Button>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory"
          >
            {loading ? [1,2,3].map(i => <Skeleton key={i} className="min-w-[350px] h-[400px] rounded-xl bg-zinc-900" />) : 
              regularEvents.map((event) => (
                <div 
                  key={event.id}
                  onClick={() => navigate(`/events/${event.slug}`)}
                  className="min-w-[320px] md:min-w-[380px] snap-start bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="h-48 relative">
                    <img src={event.image_url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black/60 border-zinc-800 text-[9px] uppercase font-bold tracking-widest backdrop-blur-md">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </p>
                    <h4 className="text-xl font-bold tracking-tight line-clamp-1 group-hover:text-purple-400 transition-colors">{event.title}</h4>
                    <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">{event.short_description}</p>
                    <div className="pt-4 flex items-center justify-between border-t border-zinc-900">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.mode}</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {event.prize_pool || "Cert."}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </main>
    </div>
  );
}
