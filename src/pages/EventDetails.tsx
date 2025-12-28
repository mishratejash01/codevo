import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  Mail, 
  Globe, 
  User, 
  CreditCard,
  MapPin,
  Building2,
  Lock,
  ShieldCheck,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

// Component Manifest
import { HackathonRegistrationModal } from '@/components/events/HackathonRegistrationModal';
import { NormalEventRegistrationModal } from '@/components/events/NormalEventRegistrationModal';
import { WorkshopRegistrationModal } from '@/components/events/WorkshopRegistrationModal';
import { WebinarRegistrationModal } from '@/components/events/WebinarRegistrationModal';
import { MeetupRegistrationModal } from '@/components/events/MeetupRegistrationModal';
import { ContestRegistrationModal } from '@/components/events/ContestRegistrationModal';
import { AlreadyRegisteredCard } from '@/components/events/AlreadyRegisteredCard';
import { PendingInvitationCard, InvitationBanner } from '@/components/events/InvitationBanner';
import { InviteeRegistrationForm } from '@/components/events/InviteeRegistrationForm';
import { useEventRegistration } from '@/hooks/useEventRegistration';
import { EventStagesTimeline } from '@/components/events/EventStagesTimeline';
import { EventDetailsContent } from '@/components/events/EventDetails';
import { EventPrizes } from '@/components/events/EventPrizes';
import { EventReviews } from '@/components/events/EventReviews';
import { EventFAQs } from '@/components/events/EventFAQs';
import { EventDiscussions } from '@/components/events/EventDiscussions';
import { EventEligibility } from '@/components/events/EventEligibility';
import { EventSponsors } from '@/components/events/EventSponsors';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // --- RESTORED ALL ORIGINAL STATES ---
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Deep registration state logic from hook
  const { 
    isRegistered, 
    invitation, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

  // --- AUTHENTICATION & PROFILE LOGIC ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchProfile(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(uid: string) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (data) setUserProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!authLoading && !session) navigate('/auth');
  }, [authLoading, session]);

  useEffect(() => {
    if (session) getEvent();
  }, [slug, session]);

  async function getEvent() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        toast.error("Event not found in registry");
        navigate('/events');
        return;
      }
      setEvent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- REGISTRATION FLOW HANDLERS ---
  const handleRegisterClick = () => {
    if (hasPendingInvitation) {
      toast.info("You have a pending team invitation.");
      return;
    }
    if (hasAcceptedInvitation) {
      toast.info("Please complete your profile registration.");
      return;
    }
    if (isRegistered) {
      toast.success("You are already registered for this event.");
      return;
    }

    const effectiveType = (event.form_type || event.event_type || '').toLowerCase();
    const internalTypes = ['hackathon', 'workshop', 'webinar', 'meetup', 'contest'];

    if (internalTypes.includes(effectiveType)) {
      setIsRegisterOpen(true);
      return;
    }

    if (event.registration_link) {
       window.open(event.registration_link, '_blank');
       return;
    }

    setIsRegisterOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Logic to determine which modal to render based on SQL event_type
  const renderRegistrationModal = () => {
    if (!event) return null;
    const type = (event.form_type || event.event_type || 'normal').toLowerCase();
    const commonProps = { event, isOpen: isRegisterOpen, onOpenChange: setIsRegisterOpen };

    switch (type) {
      case 'hackathon': return <HackathonRegistrationModal {...commonProps} />;
      case 'workshop': return <WorkshopRegistrationModal {...commonProps} />;
      case 'webinar': return <WebinarRegistrationModal {...commonProps} />;
      case 'meetup': return <MeetupRegistrationModal {...commonProps} />;
      case 'contest': return <ContestRegistrationModal {...commonProps} />;
      default: return <NormalEventRegistrationModal {...commonProps} />;
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-[#ff8c00]" />
      <span className="text-[0.6rem] uppercase tracking-[4px] text-[#777777]">Initializing Event Manifest</span>
    </div>
  );

  const daysRemaining = event.registration_deadline 
    ? differenceInDays(new Date(event.registration_deadline), new Date()) 
    : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        
        {/* --- TOP NAVIGATION --- */}
        <nav className="py-[30px] flex justify-between items-center border-b border-[#1a1a1a]">
          <div className="flex items-center gap-[30px]">
            <button 
              onClick={() => navigate('/events')} 
              className="bg-transparent border-none text-[#777777] text-[0.65rem] tracking-[2px] uppercase cursor-pointer hover:text-white transition-colors"
            >
              ← GO BACK
            </button>
            <div className="text-[1.1rem] tracking-[5px] uppercase font-light">STUDIO.DEI</div>
          </div>
          <div className="hidden md:block text-[0.6rem] tracking-[2px] text-[#777777] uppercase font-mono">
            REF_CODE: {event.id.slice(0, 8).toUpperCase()}
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="py-[80px] grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="uppercase text-[0.7rem] tracking-[3px] text-[#ff8c00] mb-5 block font-bold">
              Category: {event.category} • Mode: {event.mode}
            </span>
            <h1 className="font-serif text-[4rem] md:text-[4.5rem] lg:text-[5rem] leading-[1] mb-6 font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="text-[1.1rem] text-[#777777] font-light leading-relaxed max-w-[500px]">
              {event.short_description}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, filter: 'grayscale(1)' }} 
            animate={{ opacity: 0.7, filter: 'grayscale(1)' }} 
            whileHover={{ opacity: 1, filter: 'grayscale(0)' }}
            className="w-full h-[500px] bg-cover bg-center border border-[#1a1a1a] transition-all duration-1000 ease-in-out cursor-crosshair" 
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        </section>

        {/* --- REGISTRATION STATUS BAR (SQL MAPPED) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-[50px] border-y border-[#1a1a1a] mb-[80px] gap-y-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Last Day to Join</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">
              {event.registration_deadline ? format(new Date(event.registration_deadline), 'MMMM dd, yyyy') : 'Open Entry'}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Total Capacity</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">{event.max_participants || 'Unlimited'} People</strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Currently Joined</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">{event.current_participants || 0} People</strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Registration Status</span>
            <strong className={cn(
              "text-[1rem] font-light uppercase tracking-wider",
              daysRemaining && daysRemaining <= 3 ? "text-[#ff4444]" : "text-[#ff8c00]"
            )}>
              {daysRemaining !== null 
                ? (daysRemaining > 0 ? `Closes in ${daysRemaining} Days` : 'Closed')
                : 'Active'}
            </strong>
          </div>
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-[80px] lg:gap-[100px] mb-[100px]">
          
          <div className="content-col space-y-[120px]">
            
            <InvitationBanner />

            {/* --- CRITICAL REGISTRATION LOGIC INJECTION --- */}
            <AnimatePresence mode="wait">
              {/* State A: User has a pending invite */}
              {hasPendingInvitation && invitation && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} />
                 </motion.div>
              )}
              
              {/* State B: User accepted invite but needs to fill profile */}
              {hasAcceptedInvitation && invitation && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <InviteeRegistrationForm 
                      eventId={event.id} 
                      eventTitle={event.title} 
                      isPaid={event.is_paid} 
                      registrationFee={event.registration_fee} 
                      currency={event.currency} 
                      invitation={{ id: invitation.id, team_name: invitation.team_name, inviter_name: invitation.inviter_name, role: invitation.role, registration_id: invitation.registration_id }} 
                      onComplete={refetchRegistration} 
                    />
                 </motion.div>
              )}

              {/* State C: User is already registered - Show Team Composition */}
              {isRegistered && (
                <section>
                  <h2 className="font-serif text-[2.2rem] mb-10 font-normal border-b border-[#1a1a1a] pb-5">Team Composition</h2>
                  <AlreadyRegisteredCard 
                    eventId={event.id} 
                    eventTitle={event.title}
                    maxTeamSize={event.max_team_size || 4}
                    isPaid={event.is_paid} 
                    registrationFee={event.registration_fee} 
                    currency={event.currency} 
                  />
                </section>
              )}
            </AnimatePresence>

            {/* Section: About */}
            <section id="about">
              <h2 className="section-title">About the Event</h2>
              <EventDetailsContent event={event} />
            </section>

            {/* Section: Tracks (SQL jsonb mapping) */}
            {event.tracks && Array.isArray(event.tracks) && event.tracks.length > 0 && (
              <section id="tracks">
                <h2 className="section-title">Available Tracks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
                  {event.tracks.map((track: any, idx: number) => (
                    <div key={idx} className="border border-[#1a1a1a] p-[25px] bg-[#050505]">
                      <h4 className="font-serif text-[1.2rem] mb-2.5 text-[#ff8c00]">
                        {String(idx + 1).padStart(2, '0')}. {typeof track === 'string' ? track : track.name}
                      </h4>
                      <p className="text-[0.8rem] text-[#777777]">
                        {typeof track === 'string' ? 'Join this track to build specialized solutions.' : track.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section: Schedule */}
            <section id="schedule">
              <h2 className="section-title">Event Schedule</h2>
              <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />
            </section>

            {/* Section: Who Can Join */}
            <section id="eligibility">
              <h2 className="section-title">Who Can Join</h2>
              <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />
            </section>

            {/* Section: Prizes */}
            <section id="prizes">
              <h2 className="section-title">Awards</h2>
              <EventPrizes eventId={event.id} prizePool={event.prize_pool} />
            </section>

            {/* Section: Rules (Restored Text-Only logic) */}
            {event.rules && (
              <section id="rules">
                <h2 className="section-title">The Rules</h2>
                <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-10 leading-[2] text-[0.9rem] text-[#777777] whitespace-pre-wrap">
                  {event.rules}
                </div>
              </section>
            )}

            {/* Section: Sponsors */}
            <section id="partners">
              <h2 className="section-title">Our Partners</h2>
              <EventSponsors eventId={event.id} />
            </section>

            {/* Section: Intel/Feedback */}
            <section id="intel">
              <h2 className="section-title">Feedback</h2>
              <EventReviews eventId={event.id} />
            </section>

            {/* Section: Comms/FAQ */}
            <section id="comms">
              <h2 className="section-title">Common Questions</h2>
              <EventFAQs eventId={event.id} />
            </section>

            {/* Section: Discussion */}
            <section id="discussion">
              <h2 className="section-title">Community Chat</h2>
              <EventDiscussions eventId={event.id} />
            </section>
          </div>

          {/* --- STICKY SIDEBAR --- */}
          <aside className="hidden lg:block relative">
            <div className="sticky top-10 bg-[#0a0a0a] p-10 border border-[#1a1a1a] sidebar-card">
              <h3 className="font-serif text-[1.6rem] mb-[30px] font-normal tracking-tight">Event Details</h3>
              
              {/* ACTION BRANCHING */}
              <div className="mb-10">
                {!isRegistered && !hasPendingInvitation && !hasAcceptedInvitation ? (
                  <button 
                    onClick={handleRegisterClick}
                    disabled={regLoading}
                    className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-2"
                  >
                    {regLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Join Event'}
                  </button>
                ) : isRegistered && event.is_paid && event.payment_status === 'pending' ? (
                  <button 
                    className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-2"
                    onClick={() => toast.info("Redirecting to payment portal...")}
                  >
                    <CreditCard size={16} /> Pay {event.currency} {event.registration_fee}
                  </button>
                ) : isRegistered ? (
                  <div className="w-full border border-[#00ff88] p-[20px] text-center bg-[#00ff88]/5">
                    <span className="text-[#00ff88] text-[0.65rem] font-bold uppercase tracking-[2px]">Registration Active</span>
                  </div>
                ) : null}
              </div>

              {/* STATS LIST */}
              <ul className="list-none space-y-5">
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Format</span>
                  <strong className="font-medium text-[#e0e0e0]">{event.mode}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Location</span>
                  <strong className="font-medium text-[#e0e0e0]">{event.location || 'Online'}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Venue</span>
                  <strong className="font-medium text-[#e0e0e0] truncate ml-4">{event.venue || 'Digital Hub'}</strong>
                </li>
              </ul>

              {/* ORGANIZER BLOCK */}
              {(event.organizer_name || event.organizer_logo) && (
                <div className="mt-12 pt-[30px] border-t border-[#1a1a1a] flex items-center gap-4">
                  {event.organizer_logo ? (
                    <img src={event.organizer_logo} className="w-10 h-10 border border-[#1a1a1a] filter grayscale rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center text-[0.5rem] text-[#777777]">LOGO</div>
                  )}
                  <div>
                    <span className="text-[0.55rem] text-[#777777] tracking-[2px] uppercase block">Organized By</span>
                    <p className="text-[0.85rem] text-[#e0e0e0] font-medium">{event.organizer_name || 'Studio.Dei'}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex flex-col gap-1">
                <span className="text-[0.55rem] text-[#777777] tracking-[2px] uppercase">Support Contact</span>
                <p className="text-[0.8rem] text-[#e0e0e0] font-light truncate">{event.contact_email || 'support@studio-dei.it'}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-[100px] text-center border-t border-[#1a1a1a]">
        <p className="text-[0.6rem] tracking-[6px] text-[#777777] uppercase font-light">
          © {new Date().getFullYear()} STUDIO.DEI • ALL RIGHTS RESERVED
        </p>
      </footer>

      {/* --- MODAL INJECTIONS --- */}
      {renderRegistrationModal()}
    </div>
  );
}
