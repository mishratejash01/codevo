import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { Calendar, MapPin, Share2, Trophy, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { EventRegistrationModal } from '@/components/EventRegistrationModal';
import { toast } from 'sonner';

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // New State for Registration Status
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    async function getEventAndRegistrationStatus() {
      // 1. Fetch Event Details
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !eventData) {
        navigate('/events');
        return;
      }
      setEvent(eventData);

      // 2. Check Registration Status (if user is logged in)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', eventData.id)
          .eq('user_id', session.user.id)
          .maybeSingle(); // Returns null if not found, doesn't throw error

        if (registration) {
          setIsRegistered(true);
        }
      }
      
      setLoading(false);
      setCheckingRegistration(false);
    }

    getEventAndRegistrationStatus();
  }, [slug, navigate]);

  const handleRegisterClick = () => {
    if (event.registration_link) {
      window.open(event.registration_link, '_blank');
    } else {
      setIsRegisterOpen(true);
    }
  };

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

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <Header session={null} onLogout={() => {}} />

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
          <section className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-500 rounded-full"/> About the Event
            </h3>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base md:text-lg bg-[#151518]/50 p-6 rounded-2xl border border-white/5">
              {event.content || event.short_description}
            </div>
          </section>

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

            <div className="mt-8 space-y-3">
              {/* --- MODIFIED BUTTON LOGIC --- */}
              {isRegistered ? (
                <Button 
                  className="w-full h-12 text-base md:text-lg font-bold bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30 cursor-default"
                  onClick={() => navigate('/profile')} // Optional: Send them to profile/dashboard
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Already Registered
                </Button>
              ) : (
                <Button 
                  onClick={handleRegisterClick} 
                  disabled={checkingRegistration}
                  className="w-full h-12 text-base md:text-lg font-bold bg-white text-black hover:bg-gray-200 transition-all hover:scale-[1.02]"
                >
                  {checkingRegistration ? <Loader2 className="w-4 h-4 animate-spin"/> : "Register Now"}
                </Button>
              )}

              <Button variant="outline" onClick={handleShare} className="w-full border-white/10 hover:bg-white/5 text-gray-300">
                <Share2 className="w-4 h-4 mr-2" /> Share Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {event && (
        <EventRegistrationModal 
          event={event} 
          isOpen={isRegisterOpen} 
          onOpenChange={setIsRegisterOpen} 
        />
      )}
    </div>
  );
}
