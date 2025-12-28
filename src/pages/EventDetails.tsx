import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  Mail, 
  Globe, 
  User, 
  CreditCard,
  MapPin,
  Building2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { cn } from "@/lib/utils";

// Internal Component Imports
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
  
  // --- STATE MANAGEMENT (Full Logic) ---
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { 
    isRegistered, 
    invitation, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

  // --- AUTH & PROFILE FETCH ---
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
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setUserProfile(data);
  }

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
        toast.error("Event not found");
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

  // --- REGISTRATION ACTIONS ---
  const handleRegisterClick = () => {
    if (hasPendingInvitation) { toast.info("Pending invitation detected."); return; }
    if (hasAcceptedInvitation) { toast.info("Please finish registration."); return; }
    if (isRegistered) { toast.success("Already registered."); return; }

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
      <span className="text-[0.6rem] uppercase tracking-[4px] text-[#777777]">Syncing Event Protocol</span>
    </div>
  );

  // Logic for the countdown stat in the bar
  const daysRemaining = event.registration_deadline 
    ? differenceInDays(new Date(event.registration_deadline), new Date()) 
    : null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Header session={session} onLogout={() => supabase.auth.signOut()} />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="py-[30px] flex justify-between items-center border-b border-[#1a1a1a]">
          <div className="flex items-center gap-[30px]">
            <button onClick={() => navigate('/events')} className="bg-transparent border-none text-[#777777] text-[0.65rem] tracking-[2px] uppercase cursor-pointer hover:text-white transition-colors">
              ← GO BACK
            </button>
            <div className="text-[1.1rem] tracking-[5px] uppercase font-light">STUDIO.DEI</div>
          </div>
          <div className="hidden md:block text-[0.65rem] tracking-[2px] text-[#777777] uppercase font-mono">
            REF_CODE: {event.id.slice(0, 8).toUpperCase()}
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="py-[80px] grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="uppercase text-[0.7rem] tracking-[3px] text-[#ff8c00] mb-5 block font-bold">
              Category: {event.category} • Mode: {event.mode}
            </span>
            <h1 className="font-serif text-[4rem] md:text-[4.5rem] leading-[1] mb-6 font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="text-[1.1rem] text-[#777777] font-light leading-relaxed max-w-[500px]">
              {event.short_description}
            </p>
          </motion.div>
          <div 
            className="w-full h-[500px] bg-cover bg-center border border-[#1a1a1a] grayscale md:grayscale hover:grayscale-0 transition-all duration-700 opacity-80" 
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        </section>

        {/* --- REGISTRATION STATUS BAR --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-[50px] border-y border-[#1a1a1a] mb-[80px] gap-y-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Last Day to Join</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0]">
              {event.registration_deadline ? format(new Date(event.registration_deadline), 'MMMM dd, yyyy') : 'Open'}
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
                ? (daysRemaining > 0 ? `Closes in ${daysRemaining} Days` : 'Registration Closed')
                : 'Protocol Active'}
            </strong>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-[100px] mb-[100px]">
          
          <div className="content-col space-y-[100px]">
            
            <InvitationBanner />

            {/* Branching Registration Views (Restore Logic) */}
            <AnimatePresence mode="wait">
              {hasPendingInvitation && invitation && (
                 <PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} />
              )}
              {hasAcceptedInvitation && invitation && (
                 <InviteeRegistrationForm eventId={event.id} eventTitle={event.title} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} invitation={{ id: invitation.id, team_name: invitation.team_name, inviter_name: invitation.inviter_name, role: invitation.role, registration_id: invitation.registration_id }} onComplete={refetchRegistration} />
              )}
              {isRegistered && (
                <section>
                  <h2 className="section-title">Team Members</h2>
                  <AlreadyRegisteredCard eventId={event.id} eventTitle={event.title} eventType={event.event_type || 'normal'} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} />
                </section>
              )}
            </AnimatePresence>

            {/* About Section */}
            <section id="about">
              <h2 className="section-title">About the Event</h2>
              <EventDetailsContent event={event} />
            </section>

            {/* Tracks Section (JSON Logic mapping) */}
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
                        {typeof track === 'string' ? 'Standard assembly track' : track.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule Section */}
            <section id="schedule">
              <h2 className="section-title">Event Schedule</h2>
              <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />
            </section>

            {/* Eligibility Section */}
            <section id="eligibility">
              <h2 className="section-title">Who Can Join</h2>
              <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />
            </section>

            {/* Awards Section */}
            <section id="prizes">
              <h2 className="section-title">Awards</h2>
              <EventPrizes eventId={event.id} prizePool={event.prize_pool} />
            </section>

            {/* Rules Section */}
            {(event.rules || event.rules_document_url) && (
              <section id="rules">
                <h2 className="section-title">The Rules</h2>
                <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-10 leading-[2] text-[0.9rem] text-[#777777] whitespace-pre-wrap">
                  {event.rules || "Please adhere to standard assembly guidelines."}
                  {event.rules_document_url && (
                    <a href={event.rules_document_url} target="_blank" className="text-[#ff8c00] mt-5 block hover:underline">
                      Read Full Terms and Conditions →
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Partners Section */}
            <section id="partners">
              <h2 className="section-title">Our Partners</h2>
              <EventSponsors eventId={event.id} />
            </section>

            {/* Feedback Section */}
            <section id="intel">
              <h2 className="section-title">Feedback</h2>
              <EventReviews eventId={event.id} />
            </section>

            {/* FAQ Section */}
            <section id="comms">
              <h2 className="section-title">Common Questions</h2>
              <EventFAQs eventId={event.id} />
            </section>

            {/* Discussion Section */}
            <section id="discussion">
              <h2 className="section-title">Community Chat</h2>
              <EventDiscussions eventId={event.id} />
            </section>
          </div>

          {/* --- SIDEBAR (Restore Sticky Logic) --- */}
          <aside className="hidden lg:block">
            <div className="sticky top-10 bg-[#0a0a0a] p-10 border border-[#1a1a1a]">
              <h3 className="font-serif text-[1.6rem] mb-[30px]">Event Details</h3>
              
              {!isRegistered && !hasPendingInvitation && !hasAcceptedInvitation ? (
                <button 
                  onClick={handleRegisterClick}
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer mb-[30px] transition-all hover:bg-white"
                >
                  Join Event
                </button>
              ) : isRegistered && event.is_paid ? (
                <button 
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer mb-[30px] transition-all hover:bg-white"
                  onClick={() => toast.info("Redirecting to payment portal...")}
                >
                  Pay Fee - {event.currency} {event.registration_fee}
                </button>
              ) : isRegistered ? (
                <div className="w-full border border-[#00ff88] p-[20px] text-center bg-[#00ff88]/5 mb-[30px]">
                  <span className="text-[#00ff88] text-[0.65rem] font-bold uppercase tracking-[2px]">Registration Active</span>
                </div>
              ) : null}

              <ul className="list-none space-y-4">
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Event Mode</span> 
                  <strong className="font-medium text-[#e0e0e0]">{event.mode}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Location</span> 
                  <strong className="font-medium text-[#e0e0e0]">{event.location || 'Online'}</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Venue</span> 
                  <strong className="font-medium text-[#e0e0e0] truncate ml-4">{event.venue || 'Global Hub'}</strong>
                </li>
              </ul>

              {/* Organizer Box */}
              {(event.organizer_name || event.organizer_logo) && (
                <div className="mt-10 pt-[25px] border-t border-[#1a1a1a] flex items-center gap-4">
                  {event.organizer_logo && (
                    <img src={event.organizer_logo} className="w-10 h-10 border border-[#1a1a1a] filter grayscale rounded object-cover" />
                  )}
                  <div>
                    <span className="text-[0.6rem] text-[#777777] tracking-[2px] uppercase block">Organized By</span>
                    <p className="text-[0.85rem] text-[#e0e0e0] font-medium">{event.organizer_name || 'Studio Dei Milano'}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex flex-col gap-1">
                <span className="text-[0.6rem] text-[#777777] tracking-[2px] uppercase">Contact Support</span>
                <p className="text-[0.8rem] text-[#e0e0e0] font-light">{event.contact_email}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-[80px] text-center border-t border-[#1a1a1a]">
        <p className="text-[0.6rem] tracking-[5px] text-[#777777] uppercase">
          © {new Date().getFullYear()} STUDIO DEI MILANO • HANDCRAFTED DESIGN
        </p>
      </footer>

      {renderRegistrationModal()}
    </div>
  );
}
