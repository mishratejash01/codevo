import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Share2, Trophy, ArrowLeft, Loader2, Code, 
  Users, Clock, Star, MessageCircle, HelpCircle, CheckCircle, 
  Sparkles, Zap, ChevronRight, Globe, Lock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// --- COMPONENTS ---
import { EventRegistrationModal } from '@/components/EventRegistrationModal';
import { AlreadyRegisteredCard } from '@/components/events/AlreadyRegisteredCard';
import { PendingInvitationCard } from '@/components/events/InvitationBanner';

// --- HOOKS ---
import { useEventRegistration } from '@/hooks/useEventRegistration';

// --- Types based on your Schema (UNCHANGED) ---
interface EventStage {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  order_index: number;
}

interface EventPrize {
  id: string;
  position: number;
  title: string;
  prize_value: string | null;
  description: string | null;
}

interface EventFAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

interface EventReview {
  id: string;
  rating: number;
  review_text: string;
  user_id: string;
}

interface EventSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  type: string;
  tier: string | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  content: string | null;
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
  
  // Relations
  event_stages: EventStage[];
  event_prizes: EventPrize[];
  event_faqs: EventFAQ[];
  event_reviews: EventReview[];
  event_sponsors: EventSponsor[];
}

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  
  // UI State for the new design
  const [activeTab, setActiveTab] = useState('stages');

  // --- 1. Hook to check Registration & Invitation Status ---
  const { 
    isRegistered, 
    hasPendingInvitation, 
    invitation, 
    loading: regLoading, 
    refetch: refetchRegistration 
  } = useEventRegistration(event?.id);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/auth');
  };

  // Fetch Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_stages(*),
          event_prizes(*),
          event_faqs(*),
          event_reviews(*),
          event_sponsors(*)
        `)
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

      const eventData = data as unknown as Event;
      
      // Sort data
      if (eventData.event_stages) eventData.event_stages.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      if (eventData.event_prizes) eventData.event_prizes.sort((a, b) => a.position - b.position);
      if (eventData.event_faqs) eventData.event_faqs.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      setEvent(eventData);
      setLoading(false);
    };

    fetchEvent();
  }, [slug, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!event) return null;

  const isEventActive = new Date(event.end_date) > new Date();

  // Tabs Configuration
  const tabs = [
    { id: 'stages', label: 'Timeline', icon: Clock },
    { id: 'details', label: 'Briefing', icon: Zap },
    { id: 'prizes', label: 'Bounties', icon: Trophy },
    { id: 'sponsors', label: 'Patrons', icon: Users },
    { id: 'faqs', label: 'Comms', icon: MessageCircle },
    { id: 'reviews', label: 'Intel', icon: Star },
  ];

  // Logic helper for share
  const handleShare = async () => {
    try {
      await navigator.share({ title: event.title, text: `Check out ${event.title}!`, url: window.location.href });
    } catch { 
      toast({ title: "Link copied!", description: "Event link copied to clipboard." });
      navigator.clipboard.writeText(window.location.href); 
    }
  };

  // Logic helper for Scroll to invite
  const scrollToInvite = () => {
      const el = document.getElementById('invitation-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // --- RENDER HELPERS (extracted from original sidebar logic) ---
  const renderSidebarButtons = () => {
    if (regLoading) return <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />;

    if (isRegistered) {
      return (
        <Button disabled className="w-full h-14 text-base font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/50">
           <CheckCircle className="w-5 h-5 mr-2" /> Registered
        </Button>
      );
    }

    if (hasPendingInvitation) {
      return (
         <Button 
            onClick={scrollToInvite}
            className="w-full h-14 text-base font-bold bg-amber-500 hover:bg-amber-600 text-black transition-all"
         >
            <Users className="w-5 h-5 mr-2" /> View Invitation
         </Button>
      );
    }

    return (
      <Button 
        onClick={() => setIsRegistrationOpen(true)} 
        disabled={!isEventActive}
        className="w-full h-14 text-base font-bold bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
      >
        {event.event_type === 'hackathon' && <Code className="w-5 h-5 mr-2" />} 
        {isEventActive ? 'Initialize Registration' : 'Event Closed'}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />
      
      {/* Background Noise & Ambient Light */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
         <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[150px] animate-pulse opacity-40" />
      </div>

      <EventRegistrationModal 
        event={{ id: event.id, title: event.title }} 
        isOpen={isRegistrationOpen} 
        onOpenChange={(open) => {
          setIsRegistrationOpen(open);
          if (!open) refetchRegistration();
        }}
      />

      {/* --- CINEMATIC HERO --- */}
      <div className="relative h-[60vh] md:h-[70vh] w-full flex items-end pb-20 overflow-hidden border-b border-white/5">
        {/* Hero Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] z-10" />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "easeOut" }}
            src={event.image_url} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-80" 
          />
        </div>

        {/* Hero Content */}
        <div className="container relative z-20 mx-auto px-4 md:px-8 max-w-[1600px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
             <Button variant="ghost" className="mb-8 text-zinc-400 hover:text-white pl-0 hover:bg-transparent group" onClick={() => navigate('/events')}>
               <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mr-3 group-hover:border-white/30 transition-colors bg-black/50 backdrop-blur-md">
                 <ArrowLeft className="h-4 w-4" />
               </div>
               <span className="text-xs font-bold tracking-widest uppercase">Abort & Return</span>
             </Button>
             
             <div className="flex flex-wrap items-center gap-4 mb-6">
               <span className="px-3 py-1 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_-5px_rgba(var(--primary),0.5)]">
                 {event.category}
               </span>
               <span className="flex items-center gap-2 px-3 py-1 rounded border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                 <Globe className="w-3 h-3" /> {event.mode}
               </span>
               {event.is_featured && (
                 <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                   <Sparkles className="w-3 h-3" /> Featured
                 </span>
               )}
             </div>

             <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
               {event.title}
             </h1>
             
             <p className="text-lg md:text-xl text-zinc-400 max-w-2xl line-clamp-2 leading-relaxed">
               {event.short_description}
             </p>
          </motion.div>
        </div>
      </div>

      {/* --- NAVIGATION HUD --- */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto max-w-[1600px] px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex gap-1 overflow-x-auto no-scrollbar mask-linear-fade py-2 w-full md:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-full min-w-max",
                    activeTab === tab.id 
                      ? "text-black" 
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="hidden md:block">
              <Button size="sm" onClick={handleShare} variant="ghost" className="text-zinc-500 hover:text-white">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* LEFT COLUMN: Content */}
          <div className="lg:col-span-8 space-y-12 min-h-[500px]">
             
             <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.3 }}
                 >
                   {/* TAB: TIMELINE */}
                   {activeTab === 'stages' && (
                     <div className="space-y-8 pl-8 border-l border-white/10 relative">
                       {event.event_stages && event.event_stages.length > 0 ? (
                         event.event_stages.map((stage) => (
                           <div key={stage.id} className="relative group">
                              <div className="absolute -left-[41px] top-2 w-5 h-5 rounded-full bg-[#050505] border border-white/20 group-hover:border-white transition-colors flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-white transition-colors" />
                              </div>
                              <span className="text-xs font-mono text-zinc-500 mb-1 block uppercase tracking-widest">{format(new Date(stage.start_date), 'MMM dd, yyyy')}</span>
                              <h3 className="text-xl font-bold text-white mb-2">{stage.title}</h3>
                              <p className="text-zinc-400 leading-relaxed">{stage.description}</p>
                           </div>
                         ))
                       ) : (
                         <div className="text-zinc-500 italic">Timeline to be announced.</div>
                       )}
                     </div>
                   )}

                   {/* TAB: BRIEFING (Details) */}
                   {activeTab === 'details' && (
                     <div className="prose prose-invert prose-lg max-w-none">
                       <h2 className="text-3xl font-bold mb-6">Concept & Rigor</h2>
                       <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                         {event.content || event.short_description}
                       </div>
                     </div>
                   )}

                   {/* TAB: BOUNTIES (Prizes) */}
                   {activeTab === 'prizes' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {event.event_prizes && event.event_prizes.length > 0 ? (
                          event.event_prizes.map((prize) => (
                             <div key={prize.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="text-4xl font-light text-white/20 mb-4">{String(prize.position).padStart(2, '0')}</div>
                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{prize.title}</h3>
                                <p className="text-emerald-400 font-mono text-lg">{prize.prize_value}</p>
                                {prize.description && <p className="text-sm text-zinc-500 mt-2">{prize.description}</p>}
                             </div>
                          ))
                        ) : (
                           <div className="col-span-2 bg-white/5 border border-white/10 p-8 rounded-xl text-center">
                              <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                              <h3 className="text-xl font-bold">Prize Pool</h3>
                              <p className="text-2xl text-emerald-400 font-mono mt-2">{event.prize_pool || "TBA"}</p>
                           </div>
                        )}
                      </div>
                   )}

                   {/* TAB: PATRONS (Sponsors) */}
                   {activeTab === 'sponsors' && (
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                       {event.event_sponsors && event.event_sponsors.length > 0 ? (
                         event.event_sponsors.map((sponsor) => (
                           <div key={sponsor.id} className="aspect-video bg-[#050505] flex items-center justify-center p-6 group hover:bg-[#0a0a0a] transition-colors">
                              {sponsor.logo_url ? (
                                <img src={sponsor.logo_url} alt={sponsor.name} className="max-w-full max-h-12 opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all" />
                              ) : (
                                <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{sponsor.name}</span>
                              )}
                           </div>
                         ))
                       ) : (
                         <div className="col-span-3 p-12 text-center text-zinc-500">No public sponsors listed.</div>
                       )}
                     </div>
                   )}

                   {/* TAB: COMMS (FAQs) */}
                   {activeTab === 'faqs' && (
                     <div className="space-y-4">
                        {event.event_faqs && event.event_faqs.length > 0 ? (
                          event.event_faqs.map((faq) => (
                            <div key={faq.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors">
                               <h4 className="text-lg font-semibold text-white mb-2 flex items-start gap-3">
                                 <HelpCircle className="w-5 h-5 text-primary mt-1 shrink-0" />
                                 {faq.question}
                               </h4>
                               <p className="text-zinc-400 pl-8">{faq.answer}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 italic">No FAQs available.</div>
                        )}
                     </div>
                   )}

                   {/* TAB: INTEL (Reviews) */}
                   {activeTab === 'reviews' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {event.event_reviews && event.event_reviews.length > 0 ? (
                          event.event_reviews.map((review) => (
                            <div key={review.id} className="bg-white/5 p-6 rounded-xl border border-white/5">
                               <div className="flex gap-1 mb-3">
                                 {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700")} />
                                 ))}
                               </div>
                               <p className="text-zinc-300 italic mb-4">"{review.review_text}"</p>
                               <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">— Member</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 italic col-span-2">No intel gathered yet.</div>
                        )}
                     </div>
                   )}

                 </motion.div>
             </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32 space-y-6">
              
              {/* Mission Status Card */}
              <div className="relative overflow-hidden rounded-[2rem] bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 p-8 shadow-[0_0_50px_-20px_rgba(0,0,0,0.5)]">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                
                <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Mission Status
                </h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="text-zinc-500 mb-2 group-hover:text-primary transition-colors"><Calendar className="w-5 h-5" /></div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Start Date</div>
                      <div className="text-sm font-bold text-white mt-1">{format(new Date(event.start_date), 'MMM dd')}</div>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="text-zinc-500 mb-2 group-hover:text-blue-400 transition-colors"><MapPin className="w-5 h-5" /></div>
                      <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Sector</div>
                      <div className="text-sm font-bold text-white mt-1 truncate">{event.location || event.mode}</div>
                   </div>
                   <div className="col-span-2 bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Squad Size</div>
                        <div className="text-sm font-bold text-white">
                          {event.max_team_size ? (event.max_team_size === 1 ? 'Solo Operative' : `Max ${event.max_team_size} Operatives`) : 'Solo'}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                   </div>
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />
                
                {/* ACTION BUTTONS (Logic from Target) */}
                <div className="space-y-4">
                  {renderSidebarButtons()}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleShare} 
                    className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share Protocol
                  </Button>
                </div>
              </div>

              {/* Already Registered Card / Invitation Card (Logic: If present, show here) */}
              {isRegistered && (
                 <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <AlreadyRegisteredCard 
                       eventId={event.id} 
                       eventTitle={event.title} 
                       eventType={event.event_type} 
                       isPaid={event.is_paid || false} 
                       registrationFee={event.registration_fee || 0}
                    />
                 </div>
              )}

              {hasPendingInvitation && invitation && (
                 <div id="invitation-card">
                   <PendingInvitationCard 
                     invitation={invitation as any}
                     eventTitle={event.title}
                     onAccept={() => refetchRegistration()}
                     onDecline={() => refetchRegistration()}
                   />
                 </div>
              )}

              {/* Support Card */}
              <div className="rounded-2xl border border-white/5 bg-[#0c0c0e]/50 p-6 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-zinc-400" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-bold text-white">Need Intel?</h4>
                    <p className="text-xs text-zinc-500 mt-1">Contact mission control for support.</p>
                 </div>
                 <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                    <ChevronRight className="w-4 h-4" />
                 </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
