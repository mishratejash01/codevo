import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Session } from '@supabase/supabase-js';

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
  mode: string;
  location: string;
  prize_pool: string;
  is_featured: boolean;
  event_type: 'hackathon' | 'normal';
  max_team_size: number | null;
  registration_fee: number | null;
  is_paid: boolean | null;
}

// --- Event Card Component ---
const EventCard = ({ event }: { event: Event }) => {
  return (
    <article className="flex flex-col gap-8 py-12 border-b border-zinc-800 last:border-0 w-full">
      
      {/* 1. Image Section */}
      <div className="h-[260px] w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
        <img 
          src={event.image_url} 
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* 2. Content Section */}
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Category Tag */}
          <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-400 uppercase mb-3 block">
            {event.category}
          </span>

          {/* Title */}
          <h2 className="text-4xl font-bold tracking-tight text-white mb-4">
            {event.title}
          </h2>

          {/* Description */}
          <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-3xl line-clamp-3">
            {event.short_description}
          </p>
        </div>

        {/* 3. Human-Friendly Information Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-5 border-y border-dashed border-zinc-800 mb-8">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Prizes</span>
            <span className="font-mono text-sm text-white font-medium">{event.prize_pool || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Where</span>
            <span className="font-mono text-sm text-white font-medium">{event.mode}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Team Size</span>
            <span className="font-mono text-sm text-white font-medium">
              {(event.max_team_size && event.max_team_size > 1) ? `Up to ${event.max_team_size}` : "Solo"}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Ends On</span>
            <span className="font-mono text-sm text-white font-medium">
              {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex flex-wrap gap-5">
          {/* View Details: Increased size, hover becomes transparent with white border */}
          <a 
            href={`/events/${event.slug}`}
            className="flex items-center justify-center bg-white text-black border border-white h-14 px-12 font-mono text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-transparent hover:text-white transition-all duration-300"
          >
            View Details —
          </a>

          {/* Register Now: Increased size to match */}
          <button className="flex items-center justify-center border border-zinc-600 text-white h-14 px-12 font-mono text-sm font-bold uppercase tracking-widest rounded-sm hover:border-white hover:bg-white/5 transition-all duration-200">
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
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-inter selection:bg-white/20">
      
      <Header session={session} onLogout={handleLogout} />

      {/* Main Container */}
      <main className="pt-32 pb-24 px-8 md:px-16 w-full">
        
        {/* Page Title */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4">
            Events
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
            Explore active hackathons, workshops, and coding challenges designed to push your skills.
          </p>
        </div>

        {/* Events List Container */}
        <div className="flex flex-col w-full"> 
          {loading ? (
             <div className="min-h-[400px] flex items-center justify-start">
                <Loader2 className="animate-spin h-10 w-10 text-zinc-500" />
             </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
             <div className="py-20 text-zinc-500 font-mono text-sm uppercase tracking-widest">
                No active events found.
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
