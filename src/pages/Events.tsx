import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, Search, SlidersHorizontal, ChevronRight, 
  Timer, MapPin 
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  status?: string; 
}

// --- Status Icon Components (Based on your HTML) ---
const StatusIcon = ({ type }: { type: 'success' | 'fail' }) => {
  if (type === 'success') {
    // Pure CSS Checkmark converted to Tailwind
    return (
      <div className="w-[25px] h-[12px] border-l-[6px] border-b-[6px] border-black -rotate-45 -mt-1" />
    );
  }
  // Pure CSS Cross converted to Tailwind
  return (
    <div className="relative w-[30px] h-[30px]">
      <div className="absolute top-[12px] left-[-2px] w-[34px] h-[6px] bg-black rotate-45 rounded-[3px]" />
      <div className="absolute top-[12px] left-[-2px] w-[34px] h-[6px] bg-black -rotate-45 rounded-[3px]" />
    </div>
  );
};

// --- Event Card Component ---
const EventCard = ({ event }: { event: Event }) => {
  const isOpen = new Date(event.end_date) >= new Date();

  return (
    <article className="flex flex-col gap-8 py-12 border-b border-zinc-800 last:border-0 w-full">
      
      {/* 1. Image Section */}
      <div className="h-[260px] w-full rounded-none overflow-hidden border border-zinc-800 bg-zinc-950 group relative">
        <img 
          src={event.image_url} 
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 flex gap-2">
           <Badge className="bg-black/50 backdrop-blur-md text-white border-zinc-700 rounded-none uppercase tracking-widest text-[10px]">
             {event.mode}
           </Badge>
           {/* MapPin Icon added here for Location */}
           {event.location && event.mode !== 'Online' && (
             <Badge className="bg-black/50 backdrop-blur-md text-white border-zinc-700 rounded-none uppercase tracking-widest text-[10px] flex items-center gap-1">
               <MapPin className="w-3 h-3" />
               {event.location}
             </Badge>
           )}
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Category Tag */}
          <span className="font-mono text-[11px] tracking-[0.2em] text-zinc-400 uppercase mb-3 block">
            {event.category} • {event.event_type}
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

        {/* 3. Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-5 border-y border-dashed border-zinc-800 mb-8">
          
          {/* Custom Status Box (Replacing generic text if desired, or acting as status indicator) */}
          <div className="flex items-center gap-3">
             <div className={`w-[60px] h-[60px] border-[4px] border-black flex items-center justify-center shrink-0 ${isOpen ? 'bg-[#88d66c]' : 'bg-[#ff8a8a]'}`}>
                <StatusIcon type={isOpen ? 'success' : 'fail'} />
             </div>
             <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Status</span>
                <span className="font-mono text-sm text-white font-medium">{isOpen ? 'Open' : 'Closed'}</span>
             </div>
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Prizes</span>
            <span className="font-mono text-sm text-white font-medium">{event.prize_pool || "N/A"}</span>
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Team Size</span>
            <span className="font-mono text-sm text-white font-medium">
              {(event.max_team_size && event.max_team_size > 1) ? `Up to ${event.max_team_size}` : "Solo"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Ends On</span>
            <span className="font-mono text-sm text-white font-medium">
              {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 4. Action Buttons */}
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
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedTeamSize, setSelectedTeamSize] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Placeholder Animation State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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

  // --- Derived Filter Options ---
  
  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [events]);

  const modes = useMemo(() => {
    const ms = new Set(events.map(e => e.mode).filter(Boolean));
    return ['All', ...Array.from(ms)];
  }, [events]);

  const locations = useMemo(() => {
    const locs = new Set(events.map(e => e.location).filter(l => l && l !== 'Online'));
    return ['All', ...Array.from(locs)];
  }, [events]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.event_type).filter(Boolean));
    return ['All', ...Array.from(types)];
  }, [events]);

  // Randomized Placeholders
  const placeholders = useMemo(() => {
    const uniqueLocations = Array.from(new Set(events.map(e => e.location).filter(Boolean)));
    const uniqueCategories = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
    
    let pool = [
      ...uniqueLocations.map(l => `Search events in ${l}...`),
      ...uniqueCategories.map(c => `Browse ${c}...`),
      "Search by title...",
      "Search for hackathons...",
      "Find free workshops..."
    ];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.length > 0 ? pool : ["Search events..."];
  }, [events]);

  useEffect(() => {
    if (placeholders.length <= 1) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [placeholders]);


  // --- Filter Logic ---
  const filteredEvents = events.filter(event => {
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
        event.title.toLowerCase().includes(query) || 
        event.short_description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const matchesMode = selectedMode === 'All' || event.mode === selectedMode;
    const matchesLocation = selectedLocation === 'All' || event.location === selectedLocation;
    const matchesType = selectedType === 'All' || event.event_type === selectedType;
    
    let matchesPrice = true;
    if (selectedPrice === 'Free') matchesPrice = !event.is_paid || event.registration_fee === 0;
    else if (selectedPrice === 'Paid') matchesPrice = event.is_paid === true && (event.registration_fee || 0) > 0;

    let matchesStatus = true;
    const now = new Date();
    const end = new Date(event.end_date);
    if (selectedStatus === 'Open') matchesStatus = end >= now;
    if (selectedStatus === 'Closed') matchesStatus = end < now;

    let matchesTeam = true;
    if (selectedTeamSize === 'Solo') matchesTeam = !event.max_team_size || event.max_team_size === 1;
    if (selectedTeamSize === 'Team') matchesTeam = (event.max_team_size || 0) > 1;

    return matchesSearch && matchesCategory && matchesMode && matchesLocation && matchesType && matchesPrice && matchesStatus && matchesTeam;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'deadline') return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
    return 0;
  });

  const clearAllFilters = () => {
     setSelectedCategory('All');
     setSelectedMode('All');
     setSelectedPrice('All');
     setSelectedStatus('All');
     setSelectedLocation('All');
     setSelectedType('All');
     setSelectedTeamSize('All');
     setSortBy('newest');
     setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedCategory !== 'All', selectedMode !== 'All', 
    selectedPrice !== 'All', selectedStatus !== 'All', 
    selectedLocation !== 'All', selectedType !== 'All',
    selectedTeamSize !== 'All', searchQuery !== ''
  ].filter(Boolean).length;

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

      <main className="pt-32 pb-24 px-8 md:px-16 w-full">
        
        <div className="mb-12">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-10">
            Events
          </h1>

          {/* --- TOP FILTER BAR --- */}
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            
            {/* Search */}
            <div className="relative flex-[2] min-w-[200px] bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-600 transition-colors h-12 flex items-center rounded-none group">
              <Search className="absolute left-3 w-4 h-4 text-zinc-500 z-10" />
              <div className="absolute left-10 right-4 h-full flex items-center pointer-events-none overflow-hidden">
                <AnimatePresence mode="wait">
                  {!searchQuery && (
                    <motion.span
                      key={placeholders[placeholderIndex]}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-sm text-zinc-500 truncate w-full"
                    >
                      {placeholders[placeholderIndex]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none pl-10 pr-4 text-sm text-white z-20 placeholder-transparent"
                placeholder="" 
              />
            </div>

            {/* Category */}
            <div className="hidden md:block relative min-w-[150px]">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer h-12"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat === 'All' ? 'Category' : cat}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Location (New) */}
            <div className="hidden md:block relative min-w-[150px]">
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer h-12"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} className="bg-zinc-900 text-white">
                    {loc === 'All' ? 'Location' : loc}
                  </option>
                ))}
              </select>
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

             {/* Status */}
             <div className="hidden md:block relative min-w-[150px]">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none bg-zinc-900/50 border border-zinc-800 rounded-none pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 cursor-pointer h-12"
              >
                <option value="All" className="bg-zinc-900 text-white">Status</option>
                <option value="Open" className="bg-zinc-900 text-white">Open</option>
                <option value="Closed" className="bg-zinc-900 text-white">Closed</option>
              </select>
              <Timer className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* --- SIDEBAR TRIGGER --- */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                   variant="outline" 
                   className="h-12 px-6 bg-zinc-900/50 border-zinc-800 rounded-none hover:bg-zinc-800 hover:text-white gap-2"
                >
                   <SlidersHorizontal className="w-4 h-4" />
                   All Filters 
                   {activeFiltersCount > 0 && (
                     <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-white text-black rounded-full text-[10px]">
                       {activeFiltersCount}
                     </Badge>
                   )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] bg-[#0a0a0a] border-l border-zinc-800 p-0">
                 <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-zinc-800">
                      <SheetTitle className="text-xl font-bold text-white mb-2">Filter Events</SheetTitle>
                      <SheetDescription className="text-zinc-500">
                        Refine your search with specific criteria.
                      </SheetDescription>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                       
                       {/* Sort */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Sort By</Label>
                          <RadioGroup value={sortBy} onValueChange={setSortBy} className="gap-3">
                             {['newest', 'oldest', 'deadline'].map(opt => (
                               <div key={opt} className="flex items-center space-x-2">
                                  <RadioGroupItem value={opt} id={opt} className="border-zinc-600 text-white" />
                                  <Label htmlFor={opt} className="text-white capitalize cursor-pointer">{opt}</Label>
                               </div>
                             ))}
                          </RadioGroup>
                       </div>
                       
                       <Separator className="bg-zinc-800" />

                       {/* Event Type (Format) */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Event Format</Label>
                          <div className="grid grid-cols-2 gap-2">
                             {eventTypes.map(type => (
                                <Button 
                                  key={type} 
                                  variant="outline" 
                                  onClick={() => setSelectedType(type)}
                                  className={`rounded-none justify-start border-zinc-800 capitalize ${selectedType === type ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
                                >
                                  {type === 'All' ? 'All Formats' : type}
                                </Button>
                             ))}
                          </div>
                       </div>

                       <Separator className="bg-zinc-800" />

                       {/* Categories */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Category</Label>
                          <div className="grid grid-cols-2 gap-2">
                             {categories.map(cat => (
                                <Button 
                                  key={cat} 
                                  variant="outline" 
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`rounded-none justify-start border-zinc-800 ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
                                >
                                  {cat === 'All' ? 'All' : cat}
                                </Button>
                             ))}
                          </div>
                       </div>

                       <Separator className="bg-zinc-800" />

                        {/* Location (Sidebar) */}
                        <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Location</Label>
                          <div className="flex flex-col gap-2">
                             {locations.map(loc => (
                                <Button 
                                  key={loc} 
                                  variant="ghost" 
                                  onClick={() => setSelectedLocation(loc)}
                                  className={`rounded-none justify-between h-10 px-4 ${selectedLocation === loc ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-white'}`}
                                >
                                  {loc === 'All' ? 'All Locations' : loc}
                                  {selectedLocation === loc && <ChevronRight className="w-4 h-4" />}
                                </Button>
                             ))}
                          </div>
                       </div>
                       
                       <Separator className="bg-zinc-800" />

                       {/* Mode */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Mode</Label>
                          <div className="flex gap-2">
                             {modes.map(mode => (
                                <Button 
                                  key={mode} 
                                  variant="outline" 
                                  onClick={() => setSelectedMode(mode)}
                                  className={`flex-1 rounded-none border-zinc-800 ${selectedMode === mode ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
                                >
                                  {mode === 'All' ? 'All' : mode}
                                </Button>
                             ))}
                          </div>
                       </div>

                       <Separator className="bg-zinc-800" />

                       {/* Team Size */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Team Size</Label>
                          <div className="flex gap-2">
                             {['All', 'Solo', 'Team'].map(size => (
                                <Button 
                                  key={size} 
                                  variant="outline" 
                                  onClick={() => setSelectedTeamSize(size)}
                                  className={`flex-1 rounded-none border-zinc-800 ${selectedTeamSize === size ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
                                >
                                  {size}
                                </Button>
                             ))}
                          </div>
                       </div>

                       <Separator className="bg-zinc-800" />

                       {/* Price */}
                       <div className="space-y-4">
                          <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Price</Label>
                          <div className="flex gap-2">
                             {['All', 'Free', 'Paid'].map(price => (
                                <Button 
                                  key={price} 
                                  variant="outline" 
                                  onClick={() => setSelectedPrice(price)}
                                  className={`flex-1 rounded-none border-zinc-800 ${selectedPrice === price ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 hover:text-white'}`}
                                >
                                  {price}
                                </Button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                       <div className="flex gap-4">
                          <Button 
                             variant="outline" 
                             onClick={clearAllFilters}
                             className="flex-1 rounded-none border-zinc-700 hover:bg-zinc-800 text-white"
                          >
                            Reset
                          </Button>
                          <SheetClose asChild>
                             <Button className="flex-[2] rounded-none bg-white text-black hover:bg-zinc-200">
                               View {filteredEvents.length} Events
                             </Button>
                          </SheetClose>
                       </div>
                    </div>
                 </div>
              </SheetContent>
            </Sheet>

          </div>
        </div>

        {/* Events List */}
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
