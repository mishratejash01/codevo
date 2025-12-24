import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { Calendar, MapPin, Share2, Trophy, ArrowLeft, Loader2, Code, Users, Clock, Star, MessageCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { HackathonRegistrationModal } from '@/components/events/HackathonRegistrationModal';
import { NormalEventRegistrationModal } from '@/components/events/NormalEventRegistrationModal';
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
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stages');
  
  const { 
    isRegistered, 
    registration, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    invitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id);

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

  const handleRegisterClick = () => {
    if (hasPendingInvitation) { toast.info("You have a pending team invitation."); return; }
    if (hasAcceptedInvitation) { toast.info("Please complete your team registration."); return; }
    if (isRegistered) { toast.info("You're already registered!"); return; }
    if (event.registration_link) window.open(event.registration_link, '_blank');
    else setIsRegisterOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: event.title, text: `Check out ${event.title}!`, url: window.location.href });
    } catch { toast.info("Link copied!"); navigator.clipboard.writeText(window.location.href); }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
    </div>
  );

  const isHackathon = event?.event_type === 'hackathon';

  const renderSidebarContent = () => {
    if (regLoading) return <div className="mt-8 flex justify-center py-6"><Loader2 className="animate-spin h-6 w-6 text-purple-500" /></div>;
    if (isRegistered) return <div className="mt-8"><AlreadyRegisteredCard eventId={event.id} eventTitle={event.title} eventType={event.event_type || 'normal'} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} /></div>;
    if (hasPendingInvitation && invitation) return <div className="mt-8"><PendingInvitationCard invitation={invitation as any} eventTitle={event.title} onAccept={refetchRegistration} onDecline={refetchRegistration} /></div>;
    if (hasAcceptedInvitation && invitation) return <div className="mt-8"><InviteeRegistrationForm eventId={event.id} eventTitle={event.title} isPaid={event.is_paid} registrationFee={event.registration_fee} currency={event.currency} invitation={{ id: invitation.id, team_name: invitation.team_name, inviter_name: invitation.inviter_name, role: invitation.role, registration_id: invitation.registration_id }} onComplete={refetchRegistration} /></div>;
    return (
      <div className="mt-8 space-y-3">
        <Button onClick={handleRegisterClick} className="w-full h-12 text-base font-bold bg-white text-black hover:bg-gray-200">
          {isHackathon && <Code className="w-4 h-4 mr-2" />} Register Now
        </Button>
        <Button variant="outline" onClick={handleShare} className="w-full border-white/10 hover:bg-white/5 text-gray-300">
          <Share2 className="w-4 h-4 mr-2" /> Share Event
        </Button>
      </div>
    );
  };

  const tabs = [
    { id: 'stages', label: 'Stages & Timeline', icon: Clock },
    { id: 'details', label: 'Details', icon: MessageCircle },
    { id: 'dates', label: 'Dates & Deadlines', icon: Calendar },
    { id: 'prizes', label: 'Prizes', icon: Trophy },
    { id: 'eligibility', label: 'Eligibility', icon: CheckCircle },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'faqs', label: 'FAQs & Discussions', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <Header session={session} onLogout={handleLogout} />

      {/* Hero */}
      <div className="relative h-[45vh] md:h-[55vh] w-full">
        <div className="absolute inset-0">
          <img src={event.image_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
          <div className="container mx-auto max-w-6xl">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white pl-0" onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge className="bg-purple-600 px-3 py-1">{event.category}</Badge>
              <Badge variant="outline" className="border-white/20 px-3 py-1">{event.mode}</Badge>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2">{event.title}</h1>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-white/10 sticky top-0 z-20 bg-[#09090b]/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <InvitationBanner />
          {activeTab === 'stages' && <EventStagesTimeline eventId={event.id} eventStartDate={event.start_date} eventEndDate={event.end_date} registrationDeadline={event.registration_deadline} />}
          {activeTab === 'details' && <EventDetailsContent event={event} />}
          {activeTab === 'dates' && <EventDatesDeadlines startDate={event.start_date} endDate={event.end_date} registrationDeadline={event.registration_deadline} />}
          {activeTab === 'prizes' && <EventPrizes eventId={event.id} prizePool={event.prize_pool} />}
          {activeTab === 'eligibility' && <EventEligibility eligibilityCriteria={event.eligibility_criteria} minTeamSize={event.min_team_size} maxTeamSize={event.max_team_size} allowSolo={event.allow_solo} mode={event.mode} location={event.location} />}
          {activeTab === 'reviews' && <EventReviews eventId={event.id} />}
          {activeTab === 'faqs' && <><EventFAQs eventId={event.id} /><div className="mt-10"><EventDiscussions eventId={event.id} /></div></>}
        </div>

        {/* Sidebar */}
        <div className="relative">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 md:p-8 sticky top-28 shadow-2xl">
            <h3 className="text-xl font-semibold mb-6 pb-4 border-b border-white/10">Event Details</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl"><Calendar className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Date & Time</div>
                  <div className="text-sm text-gray-400 mt-1">{format(new Date(event.start_date), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl"><MapPin className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Location</div>
                  <div className="text-sm text-gray-400 mt-1">{event.location || event.mode}</div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl"><Users className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Team Size</div>
                  <div className="text-sm text-gray-400 mt-1">{event.min_team_size} - {event.max_team_size} members</div>
                </div>
              </div>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      </div>

      {event && isHackathon ? (
        <HackathonRegistrationModal event={event} isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} />
      ) : event && (
        <NormalEventRegistrationModal event={event} isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} />
      )}
    </div>
  );
}
