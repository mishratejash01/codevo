import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Share2, Trophy, ArrowLeft, Loader2, Code, 
  Users, Clock, Star, MessageCircle, HelpCircle, CheckCircle, 
  Sparkles, Zap, ChevronRight, Globe 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

// --- Import All Registration Modals ---
import { HackathonRegistrationModal } from '@/components/events/HackathonRegistrationModal';
import { NormalEventRegistrationModal } from '@/components/events/NormalEventRegistrationModal';
import { WorkshopRegistrationModal } from '@/components/events/WorkshopRegistrationModal';
import { WebinarRegistrationModal } from '@/components/events/WebinarRegistrationModal';
import { MeetupRegistrationModal } from '@/components/events/MeetupRegistrationModal';
import { ContestRegistrationModal } from '@/components/events/ContestRegistrationModal';

// Internal Component Imports
import { AlreadyRegisteredCard } from '@/components/events/AlreadyRegisteredCard';
import { PendingInvitationCard, InvitationBanner } from '@/components/events/InvitationBanner';
import { InviteeRegistrationForm } from '@/components/events/InviteeRegistrationForm';
import { useEventRegistration } from '@/hooks/useEventRegistration';
import { EventStagesTimeline } from '@/components/events/EventStagesTimeline';
import { EventDetailsContent } from '@/components/events/EventDetails';
import { EventDatesDeadlines } from '@/components/events/EventDatesDeadlines';
import { EventPrizes } from '@/components/events/EventPrizes';
import { EventReviews } from '@/components/events/EventReviews';
import { EventFAQs } from '@/components/events/EventFAQs';
import { EventDiscussions } from '@/components/events/EventDiscussions';
import { EventEligibility } from '@/components/events/EventEligibility';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stages');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    isRegistered, 
    invitation, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

  // Auth & Data Fetching
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
    if (!authLoading && !session) navigate('/auth');
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (session) getEvent();
  }, [slug, session]);

  async function getEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) { navigate('/events'); return; }
    setEvent(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // --- STRICT REGISTRATION LOGIC ---
  const handleRegisterClick = () => {
    // 1. INVITATION CHECK: Don't open anything if user has pending actions
    if (hasPendingInvitation) { 
      toast.info("You have a pending team invitation. Please check the sidebar."); 
      return; 
    }
    if (hasAcceptedInvitation) { 
      toast.info("Please complete your team registration in the sidebar."); 
      return; 
    }
    if (isRegistered) { 
      toast.info("You're already registered!"); 
      return; 
    }

    // 2. DETERMINE TYPE (Sanitize the string to remove spaces)
    const rawType = event.form_type || event.event_type || '';
    const effectiveType = rawType.trim().toLowerCase(); // .trim() fixes "Workshop " issue
    
    const internalTypes = ['hackathon', 'workshop', 'webinar', 'meetup', 'contest'];

    // 3. PRIORITY CHECK: If it matches a known internal type, OPEN MODAL
    if (internalTypes.includes(effectiveType)) {
      setIsRegisterOpen(true);
      return;
    }

    // 4. SECONDARY CHECK: Only if NOT internal type, check for link
    if (event.registration_link) {
       window.open(event.registration_link, '_blank');
       return;
    }

    // 5. FALLBACK: Default to normal modal
    setIsRegisterOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event.title, text: `Check out ${event.title}!`, url: window.location.href });
    } catch { toast.info("Link copied!"); navigator.clipboard.writeText(window.location.href); }
  };

  // --- Modal Renderer ---
  const renderRegistrationModal = () => {
    if (!event) return null;

    // Use the same sanitized logic here
    const rawType = event.form_type || event.event_type || 'normal';
    const type = rawType.trim().toLowerCase();

    const commonProps = {
      event,
      isOpen: isRegisterOpen,
      onOpenChange: setIsRegisterOpen
    };

    switch (type) {
      case 'hackathon':
        return <HackathonRegistrationModal {...commonProps} />;
      case 'workshop':
        return <WorkshopRegistrationModal {...commonProps} />;
      case 'webinar':
        return <WebinarRegistrationModal {...commonProps} />;
      case 'meetup':
        return <MeetupRegistrationModal {...commonProps} />;
      case 'contest':
        return <ContestRegistrationModal {...commonProps} />;
      case 'normal':
      default:
        return <NormalEventRegistrationModal {...commonProps} />;
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  const isHackathon = event?.event_type === 'hackathon';

  // --- Sidebar Content ---
  const renderSidebarContent = () => {
    if (regLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    
    if (isRegistered) {
      return (
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-50" />
          <AlreadyRegisteredCard 
            eventId={event.id} 
            eventTitle={event.title} 
            eventType={event.event_type || 'normal'} 
            isPaid={event.is_paid} 
            registrationFee={event.registration_fee} 
            currency={event.currency} 
          />
        </div>
      );
    }
    
    if (hasPendingInvitation && invitation) {
      return (
        <PendingInvitationCard 
          invitation={invitation as any} 
          eventTitle={event.title} 
          onAccept={refetchRegistration} 
          onDecline={refetchRegistration} 
        />
      );
    }
    
    if (hasAcceptedInvitation && invitation) {
      return (
        <InviteeRegistrationForm 
          eventId={event.id} 
          eventTitle={event.title} 
          isPaid={event.is_paid} 
          registrationFee={event.registration_fee} 
          currency={event.currency} 
          invitation={{ 
            id: invitation.id, 
            team_name: invitation.team_name, 
            inviter_name: invitation.inviter_name, 
            role: invitation.role, 
            registration_id: invitation.registration_id 
          }} 
          onComplete={refetchRegistration} 
        />
      );
    }
    
    return (
      <div className="space-y-4 pt-2">
        <Button 
          onClick={handleRegisterClick} 
          className="w-full h-14 text-base font-bold bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
        >
          {isHackathon && <Code className="w-5 h-5 mr-2" />} 
          Initialize Registration
        </Button>
        <Button 
          variant="outline" 
          onClick={handleShare} 
          className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <Share2 className="w-4 h-4 mr-2" /> Share Protocol
        </Button>
      </div>
    );
  };

  const tabs = [
    { id: 'stages', label: 'Timeline', icon: Clock },
    { id: 'details', label: 'Briefing', icon: Zap },
    { id: 'dates', label: 'Deadlines', icon: Calendar },
    { id: 'prizes', label: 'Bounties', icon: Trophy },
    { id: 'eligibility', label: 'Criteria', icon: CheckCircle },
    { id: 'reviews', label: 'Intel', icon: Star },
    { id: 'faqs', label: 'Comms', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-inter relative overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />
      
      {/* Background Noise & Ambient Light */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
         <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[150px] animate-pulse opacity-40" />
      </div>

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
                   <Sparkles className="w-3 h-3" /> Featured Event
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
            
            {/* Desktop Quick Action (Hidden on Mobile) */}
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
          <div className="lg:col-span-8 space-y-12">
             <InvitationBanner />
             
             <div className="min-h-[500px]">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.3 }}
                 >
                   {activeTab === 'stages' && <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />}
                   {activeTab === 'details' && <EventDetailsContent event={event} />}
                   {activeTab === 'dates' && <EventDatesDeadlines startDate={event.start_date} endDate={event.end_date} registrationDeadline={event.registration_deadline} />}
                   {activeTab === 'prizes' && <EventPrizes eventId={event.id} prizePool={event.prize_pool} />}
                   {activeTab === 'eligibility' && <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />}
                   {activeTab === 'reviews' && <EventReviews eventId={event.id} />}
                   {activeTab === 'faqs' && <div className="space-y-12"><EventFAQs eventId={event.id} /><EventDiscussions eventId={event.id} /></div>}
                 </motion.div>
               </AnimatePresence>
             </div>
          </div>

          {/* RIGHT COLUMN: Sidebar / "Mission Card" */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32 space-y-6">
              
              {/* Glass Card */}
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
                        <div className="text-sm font-bold text-white">{event.min_team_size} - {event.max_team_size} Operatives</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                   </div>
                </div>

                <div className="w-full h-px bg-white/10 mb-8" />
                
                {renderSidebarContent()}
              </div>

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

      {/* Modals - Dynamically Rendered based on form_type */}
      {renderRegistrationModal()}
    </div>
  );
}
