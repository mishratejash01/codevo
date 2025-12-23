import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { Calendar, MapPin, Share2, Trophy, ArrowLeft, Loader2, Code, Users } from 'lucide-react';
import { HackathonRegistrationModal } from '@/components/events/HackathonRegistrationModal';
import { NormalEventRegistrationModal } from '@/components/events/NormalEventRegistrationModal';
import { AlreadyRegisteredCard } from '@/components/events/AlreadyRegisteredCard';
import { PendingInvitationCard, InvitationBanner } from '@/components/events/InvitationBanner';
import { InviteeRegistrationForm } from '@/components/events/InviteeRegistrationForm';
import { useEventRegistration } from '@/hooks/useEventRegistration';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { 
    isRegistered, 
    registration, 
    hasPendingInvitation,
    hasAcceptedInvitation,
    invitation,
    loading: regLoading,
    refetch: refetchRegistration
  } = useEventRegistration(event?.id, refreshKey);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [authLoading, session, navigate]);

  useEffect(() => {
    if (session) {
      getEvent();
    }
  }, [slug, session]);

  async function getEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      navigate('/events');
      return;
    }
    setEvent(data);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/auth');
  };

  const handleRegisterClick = () => {
    // Block registration if user has pending/accepted invitation
    if (hasPendingInvitation) {
      toast.info("You have a pending team invitation. Please respond to it first.");
      return;
    }
    if (hasAcceptedInvitation) {
      toast.info("Please complete your team registration below.");
      return;
    }
    if (isRegistered) {
      toast.info("You're already registered for this event!");
      return;
    }
    if (event.registration_link) {
      window.open(event.registration_link, '_blank');
    } else {
      setIsRegisterOpen(true);
    }
  };

  const handleInvitationAccepted = () => {
    // Trigger a refresh of registration status
    refetchRegistration();
  };

  const handleInvitationDeclined = () => {
    // Trigger a refresh of registration status
    refetchRegistration();
  };

  const handleRegistrationComplete = () => {
    // Refetch registration status to show updated state
    refetchRegistration();
  };

  const isHackathon = event?.event_type === 'hackathon';

  const handleShare = async () => {
    try {
        await navigator.share({
            title: event.title,
            text: `Check out ${event.title} on Codevo!`,
            url: window.location.href
        });
    } catch (err) {
        toast.info("Link copied to clipboard");
        navigator.clipboard.writeText(window.location.href);
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
    </div>
  );

  // Determine what to render in the sidebar
  const renderSidebarContent = () => {
    // Show loading while checking registration/invitation status
    if (regLoading) {
      return (
        <div className="mt-8 flex justify-center py-6">
          <Loader2 className="animate-spin h-6 w-6 text-purple-500" />
        </div>
      );
    }

    // Already registered - show confirmation
    if (isRegistered) {
      return (
        <div className="mt-8">
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

    // Has pending invitation - show accept/decline
    if (hasPendingInvitation && invitation) {
      return (
        <div className="mt-8">
          <PendingInvitationCard
            invitation={invitation as any}
            eventTitle={event.title}
            onAccept={handleInvitationAccepted}
            onDecline={handleInvitationDeclined}
          />
        </div>
      );
    }

    // Accepted invitation - show registration form
    if (hasAcceptedInvitation && invitation) {
      return (
        <div className="mt-8">
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
              registration_id: invitation.registration_id,
            }}
            onComplete={handleRegistrationComplete}
          />
        </div>
      );
    }

    // No registration/invitation - show register button
    return (
      <div className="mt-8 space-y-3">
        <Button 
          onClick={handleRegisterClick} 
          className="w-full h-12 text-base md:text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all hover:scale-[1.02]"
        >
          {isHackathon && <Code className="w-4 h-4 mr-2" />}
          Register Now
        </Button>
        <Button variant="outline" onClick={handleShare} className="w-full border-white/10 hover:bg-white/5 text-gray-300">
          <Share2 className="w-4 h-4 mr-2" /> Share Event
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <Header session={session} onLogout={handleLogout} />

      {/* Hero Image Section */}
      <div className="relative h-[50vh] md:h-[60vh] w-full">
        <div className="absolute inset-0">
          <img src={event.image_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
          <div className="container mx-auto max-w-6xl">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white pl-0 hover:bg-transparent" onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Button>
            <div className="flex flex-wrap gap-3 mb-4 animate-in slide-in-from-bottom-4 duration-500">
              <Badge className="bg-purple-600 hover:bg-purple-700 px-3 py-1 text-sm">{event.category}</Badge>
              <Badge variant="outline" className="border-white/20 px-3 py-1 text-sm backdrop-blur-md">{event.mode}</Badge>
              {event.is_featured && <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Featured</Badge>}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 font-neuropol tracking-wide shadow-black drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl">
        
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Invitation Banner */}
          <InvitationBanner />
          
          {/* About Section */}
          <section className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-500 rounded-full"/> About the Event
            </h3>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base md:text-lg bg-[#151518]/50 p-6 rounded-2xl border border-white/5">
              {event.content || event.short_description}
            </div>
          </section>

          {/* Prize Pool Section */}
          {event.prize_pool && (
            <div className="bg-gradient-to-br from-[#151518] to-[#1a1a1e] p-8 rounded-2xl border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                <Trophy className="w-6 h-6" /> Prize Pool
              </h3>
              <div className="text-4xl font-bold text-white tracking-tight">{event.prize_pool}</div>
              <p className="text-gray-400 mt-2 font-medium">Plus certificates, swag kits, and internship opportunities for top performers!</p>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="relative">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 md:p-8 sticky top-28 shadow-2xl">
            <h3 className="text-xl font-semibold mb-6 pb-4 border-b border-white/10">Event Details</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-purple-500/20 transition-colors"><Calendar className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Date & Time</div>
                  <div className="text-sm text-gray-400 mt-1">
                    <span className="block text-white/90">{format(new Date(event.start_date), 'EEEE, MMMM do, yyyy')}</span>
                    <span className="block mt-0.5">{format(new Date(event.start_date), 'p')} - {format(new Date(event.end_date), 'p')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-purple-500/20 transition-colors"><MapPin className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Location</div>
                  <div className="text-sm text-gray-400 mt-1">{event.location}</div>
                </div>
              </div>
            </div>

            {/* Dynamic sidebar content based on registration/invitation state */}
            {renderSidebarContent()}
          </div>
        </div>
      </div>

      {/* Registration Modals */}
      {event && isHackathon ? (
        <HackathonRegistrationModal 
          event={event} 
          isOpen={isRegisterOpen} 
          onOpenChange={setIsRegisterOpen} 
        />
      ) : event && (
        <NormalEventRegistrationModal 
          event={event} 
          isOpen={isRegisterOpen} 
          onOpenChange={setIsRegisterOpen} 
        />
      )}
    </div>
  );
}
