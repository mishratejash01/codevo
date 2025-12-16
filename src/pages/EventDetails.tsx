import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { format } from 'date-fns';
import { Calendar, MapPin, Share2, Trophy, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function EventDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    getEvent();
  }, [slug, navigate]);

  const handleRegister = () => {
    if (event.registration_link) {
      window.open(event.registration_link, '_blank');
    } else {
      toast.success("Registration request sent! Check your dashboard.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Header session={null} onLogout={() => {}} />

      <div className="relative h-[60vh] w-full">
        <div className="absolute inset-0">
          <img src={event.image_url} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
          <div className="container mx-auto">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white pl-0 hover:bg-transparent" onClick={() => navigate('/events')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Button>
            <div className="flex gap-4 mb-4">
              <Badge className="bg-purple-600 hover:bg-purple-700">{event.category}</Badge>
              <Badge variant="outline" className="border-white/20">{event.mode}</Badge>
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 font-neuropol">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          <section className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-bold mb-4 text-white">About the Event</h3>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
              {event.content || event.short_description}
            </div>
          </section>

          {event.prize_pool && (
            <div className="bg-[#151518] p-8 rounded-2xl border border-yellow-500/20">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-yellow-400">
                <Trophy className="w-5 h-5" /> Prize Pool
              </h3>
              <div className="text-3xl font-bold text-white">{event.prize_pool}</div>
              <p className="text-gray-400 mt-2">Plus certificates and swag for all participants!</p>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-6 pb-4 border-b border-white/10">Event Details</h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg"><Calendar className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Date & Time</div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(event.start_date), 'PPP')} <br/>
                    {format(new Date(event.start_date), 'p')} - {format(new Date(event.end_date), 'p')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/5 rounded-lg"><MapPin className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <div className="font-medium text-white">Location</div>
                  <div className="text-sm text-gray-400">{event.location}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button onClick={handleRegister} className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-gray-200">
                Register Now
              </Button>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                <Share2 className="w-4 h-4 mr-2" /> Share Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
