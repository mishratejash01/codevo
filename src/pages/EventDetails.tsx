import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  Mail, 
  Globe, 
  Lock, 
  User, 
  ShieldCheck 
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
  
  // --- STATE MANAGEMENT (Full Logic Restored) ---
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Hook for detailed registration states (Team Invites, Membership, etc.)
  const { 
    isRegistered, 
    invitation, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

  // --- AUTH LOGIC ---
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
        toast.error("Resource not found");
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

  // --- REGISTRATION FLOW CONTROL ---
  const handleRegisterClick = () => {
    if (hasPendingInvitation) {
      toast.info("A pending team invitation requires your attention.");
      return;
    }
    if (hasAcceptedInvitation) {
      toast.info("Please complete your profile to finalize team entry.");
      return;
    }
    if (isRegistered) {
      toast.success("Identity verified. You are already in the manifest.");
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

  // Switch logic for rendering the correct registration form
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
      <span className="text-[0.6rem] uppercase tracking-[4px] text-[#777777]">Synchronizing Protocol</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      <Header session={session} onLogout={handleLogout} />
      
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        
        {/* --- NAVIGATION --- */}
        <nav className="py-[30px] flex justify-between items-center border-b border-[#1a1a1a]">
          <div className="flex items-center gap-[30px]">
            <button 
              onClick={() => navigate('/events')} 
              className="bg-transparent border-none text-[#777777] text-[0.65rem] tracking-[2px] uppercase cursor-pointer hover:text-white transition-colors"
            >
              ← ABORT & RETURN
            </button>
            <div className="text-[1.1rem] tracking-[5px] uppercase font-light">STUDIO.DEI</div>
          </div>
          <div className="hidden md:block text-[0.65rem] tracking-[2px] text-[#777777] uppercase font-mono">
            {event.slug?.toUpperCase()}_MANIFEST_2025
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="py-[60px] md:py-[100px] grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="uppercase text-[0.7rem] tracking-[3px] text-[#ff8c00] font-bold">
                {event.mode} Access Protocol
              </span>
              <div className="w-1 h-1 bg-[#1a1a1a] rounded-full" />
              <span className="uppercase text-[0.7rem] tracking-[3px] text-[#777777]">
                {event.category}
              </span>
            </div>
            
            <h1 className="font-serif text-[4rem] md:text-[5rem] lg:text-[5.5rem] leading-[0.95] mb-8 font-bold tracking-tight">
              {event.title}
            </h1>
            
            <p className="text-[1.1rem] text-[#777777] font-light leading-relaxed max-w-[550px] mb-10">
              {event.short_description}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 0.85, scale: 1 }} 
            className="w-full h-[450px] md:h-[550px] bg-cover bg-center border border-[#1a1a1a] grayscale md:grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out cursor-crosshair relative group"
            style={{ backgroundImage: `url(${event.image_url})` }}
          >
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
             <div className="absolute bottom-6 left-6 text-[0.55rem] uppercase tracking-[2px] text-white/40 group-hover:text-white transition-colors">
               Visual Asset Ref: {event.id.slice(0, 8)}
             </div>
          </motion.div>
        </section>

        {/* --- TECHNICAL STATUS DASHBOARD (Positioning sample updated with logic) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 py-[50px] border-y border-[#1a1a1a] mb-[100px] gap-y-10">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Authorized User</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0] truncate pr-4">
              {userProfile?.full_name || session?.user.email?.split('@')[0]}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Deployment Sector</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0] truncate pr-4">
              {event.location || event.mode}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Comm Channel</span>
            <strong className="text-[1rem] font-light text-[#e0e0e0] truncate pr-4">
              {session?.user.email}
            </strong>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] uppercase text-[#777777] tracking-[2px]">Mission Status</span>
            <div className="flex items-center gap-2">
               {isRegistered && <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_8px_#00ff88]" />}
               <strong className={cn(
                 "text-[1rem] font-light uppercase tracking-wider",
                 isRegistered ? "text-[#00ff88]" : "text-[#ff8c00]"
               )}>
                 {isRegistered ? 'Active Operative' : hasPendingInvitation ? 'Invitation Detected' : 'Pending Entry'}
               </strong>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-[80px] lg:gap-[120px] mb-[100px]">
          
          <div className="content-col space-y-[120px]">
            
            {/* Logic: Only show banner if invitations exist */}
            <InvitationBanner />

            {/* --- CRITICAL REGISTRATION LOGIC INJECTION --- */}
            <AnimatePresence mode="wait">
              {/* Branch 1: Pending Invitation */}
              {hasPendingInvitation && invitation && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} />
                 </motion.div>
              )}
              
              {/* Branch 2: Accepted Invitation (Final Profile Step) */}
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

              {/* Branch 3: Membership List (Already Registered) */}
              {isRegistered && (
                <section>
                  <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Team Composition</h2>
                  <AlreadyRegisteredCard 
                    eventId={event.id} 
                    eventTitle={event.title} 
                    eventType={event.event_type || 'normal'} 
                    isPaid={event.is_paid} 
                    registrationFee={event.registration_fee} 
                    currency={event.currency} 
                  />
                </section>
              )}
            </AnimatePresence>

            {/* --- CORE EVENT COMPONENTS --- */}
            
            {/* Schedule Section */}
            <section id="schedule">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Event Schedule</h2>
              <EventStagesTimeline 
                eventId={event.id} 
                eventStartDate={event.start_date} 
                eventEndDate={event.end_date} 
                registrationDeadline={event.registration_deadline} 
              />
            </section>

            {/* About Section */}
            <section id="about">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Mission Briefing</h2>
              <EventDetailsContent event={event} />
            </section>

            {/* Eligibility Section */}
            <section id="eligibility">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Clearance & Requirements</h2>
              <EventEligibility 
                eligibilityCriteria={event.eligibility_criteria} 
                minTeamSize={event.min_team_size} 
                maxTeamSize={event.max_team_size} 
                allowSolo={event.allow_solo} 
                mode={event.mode} 
                location={event.location} 
              />
            </section>

            {/* Prizes Section */}
            <section id="prizes">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Rewards & Laurels</h2>
              <EventPrizes eventId={event.id} prizePool={event.prize_pool} />
            </section>

            {/* Sponsors Section */}
            <section id="partners">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Patrons & Technical Partners</h2>
              <EventSponsors eventId={event.id} />
            </section>

            {/* Intel/Reviews Section */}
            <section id="intel">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Participant Intel</h2>
              <EventReviews eventId={event.id} />
            </section>

            {/* FAQs Section */}
            <section id="comms">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Standard Protocols (FAQ)</h2>
              <EventFAQs eventId={event.id} />
            </section>

            {/* Discussion Section */}
            <section id="discussion">
              <h2 className="font-serif text-[2.5rem] mb-12 font-normal border-b border-[#1a1a1a] pb-6">Mission Debrief</h2>
              <EventDiscussions eventId={event.id} />
            </section>
          </div>

          {/* --- SIDEBAR --- */}
          <aside className="hidden lg:block">
            <div className="sticky top-12 bg-[#0a0a0a] p-10 border border-[#1a1a1a]">
              <h3 className="font-serif text-[1.8rem] mb-[35px] font-normal tracking-tight">Event Summary</h3>
              
              {/* Dynamic Action Logic */}
              <div className="mb-10">
                {!isRegistered && !hasPendingInvitation && !hasAcceptedInvitation ? (
                  <button 
                    onClick={handleRegisterClick}
                    disabled={regLoading}
                    className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-white flex items-center justify-center gap-2"
                  >
                    {regLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Initialize Entry'}
                  </button>
                ) : isRegistered && event.is_paid && event.payment_status === 'pending' ? (
                  <button 
                    className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-center text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-2"
                    onClick={() => toast.info("Redirecting to secure gateway...")}
                  >
                    <ShieldCheck size={16} /> Complete Payment
                  </button>
                ) : isRegistered ? (
                  <div className="w-full border border-[#00ff88] p-[20px] text-center bg-[#00ff88]/5">
                    <span className="text-[#00ff88] text-[0.65rem] font-bold uppercase tracking-[2px]">Access Granted</span>
                  </div>
                ) : null}
              </div>

              {/* Data Table */}
              <ul className="list-none space-y-5">
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Starts On</span>
                  <strong className="font-medium text-[#e0e0e0]">
                    {format(new Date(event.start_date), 'MMMM dd, yyyy')}
                  </strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Protocol</span>
                  <strong className="font-medium text-[#e0e0e0]">{event.mode} Assembly</strong>
                </li>
                <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                  <span className="text-[#777777] uppercase tracking-wider">Sector</span>
                  <strong className="font-medium text-[#e0e0e0] truncate ml-4">{event.location || 'Distributed'}</strong>
                </li>
                {event.is_paid && (
                  <li className="flex justify-between py-4 border-b border-[#1a1a1a] text-[0.8rem]">
                    <span className="text-[#777777] uppercase tracking-wider">Access Fee</span>
                    <strong className="font-medium text-[#ff8c00]">{event.currency} {event.registration_fee}</strong>
                  </li>
                )}
              </ul>

              {/* Footer Help */}
              <div className="mt-12 pt-[30px] border-t border-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-2 text-[#777777]">
                  <Lock size={12} />
                  <span className="text-[0.6rem] tracking-[2px] uppercase font-bold">Secure Support</span>
                </div>
                <p className="text-[0.85rem] text-[#e0e0e0] font-light hover:text-[#ff8c00] transition-colors cursor-pointer">
                  {event.contact_email || 'support@studio-dei.it'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="py-[100px] text-center border-t border-[#1a1a1a]">
        <p className="text-[0.6rem] tracking-[6px] text-[#777777] uppercase font-light">
          © {new Date().getFullYear()} STUDIO DEI MILANO • AUTHORED BY HAND
        </p>
      </footer>

      {/* --- MODAL INJECTIONS --- */}
      {renderRegistrationModal()}
    </div>
  );
}
