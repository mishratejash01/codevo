import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

// Database interface based on your Supabase types
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
  mode: string; // 'Online' | 'Offline' | 'Hybrid'
  location: string;
  prize_pool: string;
  is_featured: boolean;
  event_type: string; // 'hackathon' | 'normal'
  min_team_size: number | null;
  max_team_size: number | null;
  registration_fee: number | null;
  is_paid: boolean | null;
  max_participants: number | null;
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Hackathon']));
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<string>('All');

  // Auth & Data Fetching
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/auth');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (!session) navigate('/auth');
    });

    fetchEvents();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data as unknown as Event[]);
    }
    setLoading(false);
  };

  // Filter Logic
  const filteredEvents = events.filter(event => {
    // 1. Search
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Categories (Mapping DB types to UI filters)
    // We treat 'hackathon' as Hackathon, everything else loosely mapped or strictly checked
    const isHackathon = event.event_type === 'hackathon' || event.category?.toLowerCase().includes('hackathon');
    const isWorkshop = event.event_type === 'normal' || event.category?.toLowerCase().includes('workshop');
    
    let matchesCategory = false;
    if (selectedCategories.size === 0) matchesCategory = true;
    else {
      if (selectedCategories.has('Hackathons') && isHackathon) matchesCategory = true;
      if (selectedCategories.has('Workshops') && isWorkshop) matchesCategory = true;
      if (selectedCategories.has('Meetups') && event.category?.toLowerCase().includes('meetup')) matchesCategory = true;
      if (selectedCategories.has('Contests') && event.category?.toLowerCase().includes('contest')) matchesCategory = true;
    }

    // 3. Location
    let matchesLocation = true;
    if (selectedLocation !== 'All') {
      if (selectedLocation === 'Online' && event.mode === 'Online') matchesLocation = true;
      else if (selectedLocation === 'In-Person' && (event.mode === 'Offline' || event.mode === 'In-Person')) matchesLocation = true;
      else if (selectedLocation === 'Hybrid' && event.mode === 'Hybrid') matchesLocation = true;
      else matchesLocation = false;
    }

    // 4. Price
    let matchesPrice = true;
    if (selectedPrice === 'Free') matchesPrice = !event.is_paid || event.registration_fee === 0;
    if (selectedPrice === 'Paid') matchesPrice = event.is_paid === true && (event.registration_fee || 0) > 0;

    return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
  });

  const toggleCategory = (category: string) => {
    const next = new Set(selectedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setSelectedCategories(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  return (
    <div className="events-page-wrapper">
      <style>{`
        :root {
            --bg: #000000;
            --surface: #0a0a0a;
            --border: #1a1a1a;
            --border-heavy: #333333;
            --text-main: #ffffff;
            --text-muted: #888888;
            --accent: #ffffff;
            --font-main: 'Inter', sans-serif;
            --font-mono: 'Space Grotesk', sans-serif;
        }

        .events-page-wrapper {
            background-color: var(--bg);
            color: var(--text-main);
            font-family: var(--font-main);
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            position: fixed; /* Ensures it takes over the view */
            top: 0;
            left: 0;
            z-index: 50;
        }

        .app-shell {
            display: grid;
            grid-template-columns: 1fr 340px;
            height: 100%;
            width: 100%;
        }

        /* --- LEFT COLUMN: EVENTS (SCROLLABLE) --- */
        .feed-container {
            overflow-y: scroll;
            padding: 40px 60px;
            border-right: 1px solid var(--border);
            scrollbar-width: thin;
            scrollbar-color: var(--border-heavy) var(--bg);
        }

        .feed-container::-webkit-scrollbar { width: 4px; }
        .feed-container::-webkit-scrollbar-track { background: var(--bg); }
        .feed-container::-webkit-scrollbar-thumb { background: var(--border-heavy); border-radius: 2px; }

        .feed-header { margin-bottom: 50px; }

        .section-label {
            font-family: var(--font-mono);
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 20px;
        }

        /* Active Filter Selection Row */
        .selection-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            padding-bottom: 25px;
            border-bottom: 1px solid var(--border);
        }

        .choice-chip {
            font-family: var(--font-mono);
            font-size: 10px;
            padding: 8px 16px;
            border: 1px solid var(--border-heavy);
            color: var(--text-main);
            text-transform: uppercase;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .choice-chip:hover { border-color: var(--text-muted); }
        .choice-chip.active { background: var(--text-main); color: #000; border-color: var(--text-main); }
        .choice-chip span { opacity: 0.5; font-size: 14px; }

        /* --- EVENT CARDS --- */
        .event-entry {
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 50px;
            padding: 60px 0;
            border-bottom: 1px solid var(--border);
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .entry-visual {
            height: 220px;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            background: #050505;
        }

        .entry-visual img {
            width: 100%; 
            height: 100%; 
            object-fit: cover;
        }

        .entry-body { display: flex; flex-direction: column; }

        .category-tag {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--text-muted);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .entry-title {
            font-size: 30px;
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 18px;
            letter-spacing: -0.02em;
        }

        .entry-desc {
            color: var(--text-muted);
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            max-width: 600px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        /* Information Strip (Human labels) */
        .info-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
            padding: 18px 0;
            border-top: 1px dashed var(--border-heavy);
            border-bottom: 1px dashed var(--border-heavy);
        }

        .info-point { display: flex; flex-direction: column; }
        .info-label { font-family: var(--font-mono); font-size: 9px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; }
        .info-val { font-family: var(--font-mono); font-size: 12px; color: var(--text-main); }

        /* BUTTONS */
        .cta-row { display: flex; gap: 15px; margin-top: auto; }

        .btn {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            text-decoration: none;
            padding: 14px 32px;
            letter-spacing: 0.1em;
            transition: 0.2s;
            text-align: center;
            border-radius: 4px;
            cursor: pointer;
        }

        /* Highlighted Primary */
        .btn-details { background: var(--accent); color: #000; border: 1px solid var(--accent); }
        .btn-details:hover { opacity: 0.8; }

        /* Secondary Outlined */
        .btn-reg { background: transparent; color: var(--accent); border: 1px solid var(--border-heavy); }
        .btn-reg:hover { border-color: var(--accent); }

        /* --- RIGHT COLUMN: SIDEBAR FILTERS (FIXED) --- */
        .sidebar {
            background: var(--surface);
            padding: 40px 30px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            border-left: 1px solid var(--border);
        }

        .filter-group { margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .filter-heading { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 20px; display: block; }

        .search-box { width: 100%; background: #000; border: 1px solid var(--border-heavy); padding: 12px; color: white; font-family: var(--font-main); font-size: 13px; outline: none; border-radius: 4px; transition: border-color 0.2s; }
        .search-box:focus { border-color: var(--text-muted); }

        .list-unstyled { list-style: none; padding: 0; }
        .list-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; color: var(--text-muted); cursor: pointer; transition: color 0.2s; }
        .list-item input { appearance: none; width: 14px; height: 14px; border: 1px solid var(--border-heavy); cursor: pointer; border-radius: 2px; position: relative; }
        .list-item input:checked { background: var(--accent); border-color: var(--accent); }
        .list-item:hover { color: white; }

        .footer-text { margin-top: auto; font-family: var(--font-mono); font-size: 10px; color: #444; line-height: 1.6; }

        @media (max-width: 1200px) {
            .app-shell { grid-template-columns: 1fr; }
            .sidebar { display: none; }
            .event-entry { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="app-shell">
        
        {/* LEFT FEED */}
        <main className="feed-container">
          <header className="feed-header">
            <div className="section-label">Currently Showing</div>
            
            <div className="selection-row">
              {Array.from(selectedCategories).map(cat => (
                <div key={cat} className="choice-chip active" onClick={() => toggleCategory(cat)}>
                  {cat} <span>×</span>
                </div>
              ))}
              {selectedLocation !== 'All' && (
                <div className="choice-chip active" onClick={() => setSelectedLocation('All')}>
                  {selectedLocation} <span>×</span>
                </div>
              )}
               {selectedPrice !== 'All' && (
                <div className="choice-chip active" onClick={() => setSelectedPrice('All')}>
                  {selectedPrice} <span>×</span>
                </div>
              )}
              {selectedCategories.size === 0 && selectedLocation === 'All' && selectedPrice === 'All' && (
                 <div className="text-xs text-zinc-600 py-2 uppercase tracking-widest">All Events</div>
              )}
            </div>
          </header>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 font-mono text-sm uppercase">
                No events found matching criteria.
            </div>
          ) : (
            filteredEvents.map(event => (
                <article key={event.id} className="event-entry">
                    <div className="entry-visual">
                        <img 
                            src={event.image_url || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"} 
                            alt={event.title} 
                        />
                    </div>
                    <div className="entry-body">
                        <div className="category-tag">{event.category || event.event_type}</div>
                        <h2 className="entry-title">{event.title}</h2>
                        <p className="entry-desc">{event.short_description}</p>
                        
                        <div className="info-strip">
                            <div className="info-point">
                                <span className="info-label">Prizes</span>
                                <span className="info-val">{event.prize_pool || "None"}</span>
                            </div>
                            <div className="info-point">
                                <span className="info-label">Where</span>
                                <span className="info-val">{event.mode}</span>
                            </div>
                            <div className="info-point">
                                <span className="info-label">Team Size</span>
                                <span className="info-val">
                                    {event.min_team_size && event.max_team_size 
                                        ? `${event.min_team_size} - ${event.max_team_size}`
                                        : "Solo"}
                                </span>
                            </div>
                            <div className="info-point">
                                <span className="info-label">Ends On</span>
                                <span className="info-val">{format(new Date(event.end_date), 'MMM dd, yyyy')}</span>
                            </div>
                        </div>

                        <div className="cta-row">
                            <button onClick={() => navigate(`/events/${event.slug}`)} className="btn btn-details">
                                View Details —
                            </button>
                            <button onClick={() => navigate(`/events/${event.slug}`)} className="btn btn-reg">
                                Register Now
                            </button>
                        </div>
                    </div>
                </article>
            ))
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="sidebar">
          <div className="filter-group">
            <span className="filter-heading">Find an Event</span>
            <input 
                type="text" 
                className="search-box" 
                placeholder="Search by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <span className="filter-heading">Categories</span>
            <ul className="list-unstyled">
                {['Hackathons', 'Workshops', 'Meetups', 'Contests'].map(cat => (
                    <li key={cat} className="list-item" onClick={() => toggleCategory(cat)}>
                        <input 
                            type="checkbox" 
                            checked={selectedCategories.has(cat)} 
                            readOnly 
                        /> 
                        {cat}
                    </li>
                ))}
            </ul>
          </div>

          <div className="filter-group">
            <span className="filter-heading">Location</span>
            <ul className="list-unstyled">
               {['All', 'Online', 'In-Person', 'Hybrid'].map(loc => (
                    <li key={loc} className="list-item" onClick={() => setSelectedLocation(loc)}>
                        <input 
                            type="radio" 
                            name="loc" 
                            checked={selectedLocation === loc} 
                            readOnly 
                        /> 
                        {loc}
                    </li>
               ))}
            </ul>
          </div>

          <div className="filter-group">
            <span className="filter-heading">Price</span>
            <ul className="list-unstyled">
                {['All', 'Free', 'Paid'].map(price => (
                    <li key={price} className="list-item" onClick={() => setSelectedPrice(price)}>
                        <input 
                            type="radio" 
                            name="price" 
                            checked={selectedPrice === price} 
                            readOnly 
                        /> 
                        {price}
                    </li>
                ))}
            </ul>
          </div>

          <div className="footer-text">
            © 2025 Event Portal<br />
            Updated daily at 09:00 AM
          </div>
        </aside>
      </div>
    </div>
  );
}
