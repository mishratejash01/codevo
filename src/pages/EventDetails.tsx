import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { EventRegistrationModal } from '@/components/EventRegistrationModal';

// --- Types ---
interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
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

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Could not find the requested event.",
          variant: "destructive"
        });
        navigate('/events');
        return;
      }

      setEvent(data as unknown as Event);
      setLoading(false);
    };

    fetchEvent();
  }, [slug, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20">
      
      {/* --- INJECTED CSS FROM TEMPLATE --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@200;300;400;600&display=swap');

        :root {
            --bg: #000000;
            --surface: #0a0a0a;
            --text-main: #ffffff;
            --text-muted: #777777;
            --accent: #ffffff; 
            --border: #1a1a1a;
            --titanium: #e0e0e0;
        }

        /* Base Styles */
        body { font-family: 'Inter', sans-serif; background-color: var(--bg); color: var(--text-main); }
        h1, h2, h3, .serif { font-family: 'Playfair Display', serif; letter-spacing: -1px; }
        
        .container-custom { max-width: 1200px; margin: 0 auto; padding: 0 40px; }

        /* Hero */
        .hero {
            padding: 100px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            align-items: center;
        }
        .category-tag { text-transform: uppercase; font-size: 0.7rem; letter-spacing: 3px; color: var(--text-muted); margin-bottom: 20px; display: block; }
        .hero h1 { font-size: 4.5rem; line-height: 1; margin-bottom: 25px; font-weight: 700; }
        .hero-image {
            width: 100%;
            height: 500px;
            background-color: #0a0a0a;
            background-size: cover;
            background-position: center;
            filter: grayscale(1);
            opacity: 0.8;
        }

        /* Stats Bar */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            padding: 50px 0;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            margin-bottom: 100px;
        }
        .stat-item span { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 2px; }
        .stat-item strong { font-size: 1.4rem; font-weight: 200; color: var(--titanium); }

        /* Layout Grid */
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 100px;
            margin-bottom: 100px;
        }
        .section-title { font-size: 2.2rem; margin-bottom: 40px; position: relative; font-weight: 400; }
        .section-title::after { content: ""; display: block; width: 60px; height: 1px; background: var(--text-muted); margin-top: 20px; }

        /* Animations & Timeline */
        @keyframes lineGrow { from { height: 0; } to { height: 100%; } }
        .roadmap { position: relative; padding-left: 40px; margin-bottom: 80px; }
        .roadmap-line { position: absolute; left: 0; top: 0; width: 1px; height: 100%; background: var(--border); }
        .roadmap-progress { position: absolute; left: 0; top: 0; width: 1px; background: var(--titanium); animation: lineGrow 3s ease-in-out forwards; }
        .stage-item { position: relative; margin-bottom: 50px; }
        .stage-item::before {
            content: ""; position: absolute; left: -43.5px; top: 10px;
            width: 8px; height: 8px; background: var(--titanium); border-radius: 50%;
        }

        /* Prizes */
        .prize-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 80px; }
        .prize-card { border: 1px solid var(--border); padding: 40px; text-align: left; transition: 0.3s; }
        .prize-card:hover { border-color: var(--titanium); }
        .prize-pos { font-size: 3rem; font-weight: 200; margin-bottom: 10px; color: var(--titanium); }

        /* Patrons */
        .patrons-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background: var(--border);
            border: 1px solid var(--border);
            margin-bottom: 100px;
        }
        .patron-logo {
            background: var(--bg);
            padding: 30px;
            text-align: center;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: var(--text-muted);
        }

        /* QA & Insights */
        .qa-item { margin-bottom: 40px; }
        .qa-q { font-weight: 400; font-size: 1.1rem; margin-bottom: 12px; color: var(--titanium); border-left: 1px solid var(--titanium); padding-left: 20px; }
        .qa-a { color: var(--text-muted); font-size: 0.95rem; padding-left: 21px; }

        .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 50px; }
        .insight-card { padding: 40px; background: var(--surface); border: 1px solid var(--border); }
        .insight-quote { font-style: italic; color: var(--text-muted); margin-bottom: 20px; font-weight: 300; }
        .insight-author { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: var(--titanium); }

        /* Sidebar Styling */
        .sidebar-card {
            background: var(--surface);
            padding: 40px;
            border: 1px solid var(--border);
            position: sticky;
            top: 120px; /* Offset for existing header */
        }
        .btn-participate {
            display: block; width: 100%; padding: 22px;
            background: var(--text-main); color: #000;
            text-align: center; text-decoration: none; text-transform: uppercase;
            letter-spacing: 3px; font-size: 0.8rem; font-weight: 700;
            margin-bottom: 30px; transition: 0.4s;
            cursor: pointer; border: none;
        }
        .btn-participate:hover { background: transparent; color: #fff; box-shadow: inset 0 0 0 1px #fff; }
        
        .meta-list { list-style: none; padding: 0; margin: 0; }
        .meta-list li { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
        .meta-list li span { color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

        @media (max-width: 900px) {
            .hero, .main-grid, .prize-grid, .insights-grid { grid-template-columns: 1fr; }
            .hero h1 { font-size: 3rem; }
            .stats-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
            .sidebar-card { position: static; margin-top: 50px; }
        }
      `}</style>

      {/* Global Header */}
      <Header />

      <div className="container-custom pt-24">
        
        {/* HERO SECTION */}
        <section className="hero">
            <div>
                <span className="category-tag">
                    {event.category} • {event.event_type}
                </span>
                <h1 className="serif">{event.title}</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 200, marginBottom: '40px', lineHeight: 1.6 }}>
                    {event.short_description}
                </p>
                
                <div style={{ width: '250px' }}>
                    <EventRegistrationModal 
                        event={event} 
                        trigger={<button className="btn-participate">Apply for Entry</button>} 
                    />
                </div>
            </div>
            <div 
                className="hero-image"
                style={{ backgroundImage: `url(${event.image_url})` }}
            />
        </section>

        {/* STATS BAR */}
        <div className="stats-grid">
            <div className="stat-item"><span>Treasury Pool</span><strong>{event.prize_pool || "TBA"}</strong></div>
            <div className="stat-item"><span>Status</span><strong>{new Date(event.end_date) > new Date() ? 'Active' : 'Closed'}</strong></div>
            <div className="stat-item"><span>Team Limit</span><strong>{event.max_team_size ? `Max ${event.max_team_size}` : "Solo"}</strong></div>
            <div className="stat-item"><span>Mode</span><strong>{event.mode}</strong></div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="main-grid">
            
            {/* CONTENT COLUMN */}
            <div className="content-col">
                <section>
                    <h2 className="section-title">Concept & Rigor</h2>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 300, marginBottom: '80px', maxWidth: '600px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {event.description || event.short_description}
                    </div>
                </section>

                <section>
                    <h2 className="section-title">The Roadmap</h2>
                    <div className="roadmap">
                        <div className="roadmap-line"></div>
                        <div className="roadmap-progress"></div>
                        
                        <div className="stage-item">
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>
                                {format(new Date(event.start_date), 'MMM dd')}
                            </span>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Digital Manifest</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Event kick-off and initial resource allocation.</p>
                        </div>
                        
                        <div className="stage-item">
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>
                                {format(new Date(event.end_date), 'MMM dd')}
                            </span>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Grand Submission</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Final project uploads and documentation freeze.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">Prizes</h2>
                    <div className="prize-grid">
                        <div className="prize-card">
                            <div className="prize-pos">01</div>
                            <strong style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>Winner</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>
                                {event.prize_pool ? `Major share of ${event.prize_pool}` : "TBA"}
                            </p>
                        </div>
                        <div className="prize-card">
                            <div className="prize-pos">02</div>
                            <strong style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>Runner Up</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>Special Recognition + Swag</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">Patrons</h2>
                    <div className="patrons-grid">
                        <div className="patron-logo">OpenAI</div>
                        <div className="patron-logo">Vercel</div>
                        <div className="patron-logo">Supabase</div>
                        <div className="patron-logo">Github</div>
                        <div className="patron-logo">React</div>
                        <div className="patron-logo">Stripe</div>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">Conversation</h2>
                    <div className="qa-item">
                        <div className="qa-q">@arch_it: Is the travel fully sponsored?</div>
                        <div className="qa-a">Organizer: Top 5 finalists receive round-trip flights to Milan and luxury accommodation.</div>
                    </div>
                    <div className="qa-item">
                        <div className="qa-q">@milano_dev: Can we use proprietary hardware?</div>
                        <div className="qa-a">Organizer: Only if standard protocols are supported for the live pitch.</div>
                    </div>
                </section>

                <section>
                    <h2 className="section-title">Member Insights</h2>
                    <div className="insights-grid">
                        <div className="insight-card">
                            <p className="insight-quote">"The technical depth expected here is on par with Swiss engineering."</p>
                            <span className="insight-author">— Alessandro R., Architect</span>
                        </div>
                        <div className="insight-card">
                            <p className="insight-quote">"A perfect intersection of luxury branding and advanced logic."</p>
                            <span className="insight-author">— Sofia L., Creative Lead</span>
                        </div>
                    </div>
                </section>
            </div>

            {/* SIDEBAR COLUMN */}
            <aside className="sidebar-col">
                <div className="sidebar-card">
                    <h3 className="serif" style={{ fontSize: '1.5rem', marginBottom: '30px', fontWeight: 400 }}>Event Summary</h3>
                    
                    <EventRegistrationModal 
                        event={event} 
                        trigger={<button className="btn-participate">Participate Now</button>} 
                    />

                    <ul className="meta-list">
                        <li><span>Starts</span> <strong>{format(new Date(event.start_date), 'dd MMM yyyy')}</strong></li>
                        <li><span>Ends</span> <strong>{format(new Date(event.end_date), 'dd MMM yyyy')}</strong></li>
                        <li><span>Venue</span> <strong>{event.mode === 'Online' ? 'Remote' : event.location}</strong></li>
                        <li><span>Solo</span> <strong>{event.max_team_size === 1 ? "REQUIRED" : "ALLOWED"}</strong></li>
                        <li><span>Mode</span> <strong>{event.mode.toUpperCase()}</strong></li>
                    </ul>

                    <div style={{ marginTop: '40px', paddingTop: '25px', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Concierge</span>
                        <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>help@codevo.com</p>
                    </div>
                </div>
            </aside>

        </div>
      </div>
    </div>
  );
}
