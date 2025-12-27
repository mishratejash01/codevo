import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Session } from '@supabase/supabase-js';

// Extended Event interface to support the new card's fields
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

const EventCard = ({ event }: { event: Event }) => {
  return (
    <article className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 py-12 border-b border-zinc-900 last:border-0">
      
      {/* 1. Image Section */}
      <div className="h-[220px] w-full rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950">
        <img 
          src={event.image_url} 
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-5 border-y border-dashed border-zinc-800 mb-8">
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
              {event.max_team_size && event.max_team_size > 1 ? `Up to ${event.max_team_size}` : "Solo"}
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
            className="bg-white text-black px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-wider rounded-sm hover:bg-zinc-200 transition-all duration-200 text-center"
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-inter selection:bg-zinc-800">
      
      <Header session={session} onLogout={handleLogout} />

      <main className="pt-32 pb-20 px-4 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col">
          {loading ? (
             <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-zinc-500" />
             </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
             <div className="text-center py-20 text-zinc-500 font-mono text-sm uppercase">
                No events found.
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
