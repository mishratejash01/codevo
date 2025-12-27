import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/Header';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

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
      
      {/* 1. Image Section - Squared Corners (rounded-none) */}
      <div className="h-[260px] w-full rounded-none overflow-hidden border border-zinc-800 bg-zinc-950">
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

        {/* 4. Action Buttons - Squared Corners (rounded-none) */}
        <div className="flex flex-wrap gap-5">
          <a 
            href={`/events/${event.slug}`}
            className="flex items-center justify-center bg-white text-black border border-white h-14 px-12 font-mono text-sm font-bold uppercase tracking-widest rounded-none hover:bg-transparent hover:text-white transition-all duration-300"
          >
            View Details —
          </a>

          <button className="flex items-center justify-center border border-zinc-600 text-white h-14 px-12 font-mono text-sm font-bold uppercase tracking-widest rounded-none hover:border-white hover:bg-white/5 transition-all duration-200">
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<string>('All');

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

  // Derive unique options for filters from the fetched events
  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [events]);

  const modes = useMemo(() => {
    const ms = new Set(events.map(e => e.mode).filter(Boolean));
    return ['All', ...Array.from(ms)];
  }, [events]);

  // Filter Logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesMode = selectedMode === 'All' || event.mode === selectedMode;
    
    let matchesPrice = true;
    if (selectedPrice === 'Free') matchesPrice = !event.is_paid || event.registration_fee === 0;
    else if (selectedPrice === 'Paid') matchesPrice = event.is_paid === true && (event.registration_fee || 0) > 0;

    return matchesSearch && matchesCategory && matchesMode && matchesPrice;
  });

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
        
        {/* Page Title & Filters Container */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-10">
            Events
          </h1>

          {/* Filter Row - Squared Inputs (rounded-none) */}
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-none pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="relative min-w-[150px]">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
              {/* Premium Icon: SlidersHorizontal */}
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Mode Filter */}
            <div className="relative min-w-[150px]">
              <select 
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                {modes.map(mode => (
                  <option key={mode} value={mode} className="bg-zinc-900 text-white">{mode === 'All' ? 'All Modes' : mode}</option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Price Filter */}
            <div className="relative min-w-[150px]">
              <select 
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="All" className="bg-zinc-900 text-white">All Prices</option>
                <option value="Free" className="bg-zinc-900 text-white">Free</option>
                <option value="Paid" className="bg-zinc-900 text-white">Paid</option>
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Clear Filters Button (Visible if any filter is active) */}
            {(selectedCategory !== 'All' || selectedMode !== 'All' || selectedPrice !== 'All' || searchQuery) && (
               <Button 
                 variant="ghost" 
                 onClick={() => {
                   setSelectedCategory('All');
                   setSelectedMode('All');
                   setSelectedPrice('All');
                   setSearchQuery('');
                 }}
                 className="text-zinc-400 hover:text-white rounded-none"
               >
                 Reset
               </Button>
            )}

          </div>
        </div>

        {/* Events List Container */}
        <div className="flex flex-col w-full"> 
          {loading ? (
             <div className="min-h-[400px] flex items-center justify-start">
                <Loader2 className="animate-spin h-10 w-10 text-zinc-500" />
             </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
             <div className="py-20 text-zinc-500 font-mono text-sm uppercase tracking-widest">
                No events found matching your criteria.
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
