import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, ShieldCheck, ShieldAlert, 
  Calendar, MapPin, Clock, CheckCircle2, XCircle,
  QrCode, User, BadgeCheck
} from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function VerifyRegistration() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (registrationId) {
      fetchVerificationData();
      
      // REAL-TIME SUBSCRIPTION: Listen for check-in updates
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'event_registrations',
            filter: `id=eq.${registrationId}`,
          },
          (payload) => {
            setData((prev: any) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [registrationId]);

  async function fetchVerificationData() {
    try {
      const { data: reg, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (*)
        `)
        .eq('id', registrationId)
        .single();

      if (regError || !reg) throw new Error("Registry record not found");

      setData(reg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-[#00ff88]" />
      <span className="text-[10px] uppercase tracking-[4px] text-[#777777]">Syncing with Registry</span>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-serif mb-4">Registry Error</h1>
      <p className="text-[#777777] mb-8 uppercase tracking-widest text-xs">Credential Not Found in Studio.Dei Manifest</p>
      <Button onClick={() => navigate('/')} variant="outline" className="border-[#1a1a1a] rounded-none px-10">Return Home</Button>
    </div>
  );

  const event = data.events;
  const now = new Date();
  const eventEndTime = event.end_date ? parseISO(event.end_date) : null;
  
  // VALIDITY LOGIC: Verified if confirmed. Valid if current time is before event end time.
  const isVerified = data.current_status === 'confirmed' || data.current_status === 'completed';
  const isValid = eventEndTime ? isBefore(now, eventEndTime) : true;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-10 flex flex-col items-center selection:bg-[#00ff88]/30">
      <div className="w-full max-w-[450px] space-y-6">
        
        {/* Pass Validity Header Banner */}
        <div className={cn(
          "w-full p-5 border flex items-center gap-4 transition-colors duration-700",
          isValid && isVerified 
            ? "bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]" 
            : "bg-red-500/10 border-red-500/30 text-red-500"
        )}>
          {isValid && isVerified ? (
            <BadgeCheck className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <XCircle className="w-6 h-6 stroke-[2.5]" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-[2px]">
              {isValid && isVerified ? 'Credential: Valid' : 'Credential: Void/Expired'}
            </h4>
            <p className="text-[9px] opacity-70 uppercase tracking-widest mt-0.5">
              Verified at {format(now, 'HH:mm:ss')} • Gate Security
            </p>
          </div>
          <Badge className={cn(
            "text-[9px] font-bold rounded-none border-none px-3 py-1",
            isValid && isVerified ? "bg-[#00ff88] text-black" : "bg-red-500 text-white"
          )}>
            {isValid ? 'ACTIVE' : 'EXPIRED'}
          </Badge>
        </div>

        {/* The Digital Pass Card Container */}
        <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          
          {/* --- ATTENDANCE WATERMARK --- */}
          {data?.is_attended && (
            <div className="watermark-attended animate-in fade-in zoom-in duration-500">
              ATTENDED
            </div>
          )}

          {/* Top Decorative Border */}
          <div className={cn(
            "h-1.5 w-full transition-colors duration-1000", 
            isValid ? "bg-[#00ff88]" : "bg-red-500"
          )} />
          
          <div className="p-6 md:p-10 space-y-10">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] text-[#555] uppercase tracking-[4px]">Event Credential</span>
                <h2 className="text-2xl font-serif text-white tracking-tight uppercase leading-none">{event.title}</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-[#555] uppercase tracking-[2px]">Status</span>
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mt-1",
                  data.is_attended ? "text-[#00ff88]" : "text-[#ff8c00]"
                )}>
                  {data.is_attended ? 'Gate Cleared' : 'Entry Pending'}
                </p>
              </div>
            </header>

            {/* Participant Profile Section */}
            <div className="flex items-center gap-6 py-8 border-y border-[#1a1a1a] relative">
              <Avatar className="h-16 w-16 border border-[#1a1a1a] rounded-none">
                <AvatarImage src={data.avatar_url} />
                <AvatarFallback className="bg-[#1a1a1a] text-xl font-serif text-[#555]">
                  {data.full_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h3 className="text-xl font-medium text-white tracking-tight">{data.full_name}</h3>
                <p className="text-[9px] text-[#777] uppercase tracking-[3px] font-medium">{data.participation_type} Access Mode</p>
                {data.team_name && (
                  <Badge variant="outline" className="text-[8px] border-[#1a1a1a] text-[#ff8c00] rounded-none mt-2 uppercase tracking-widest px-2 py-0.5">
                    Squad: {data.team_name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-2 gap-y-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[#555]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-[3px]">Schedule Date</span>
                </div>
                <p className="text-xs text-white font-medium">{format(parseISO(event.start_date), 'MMMM dd, yyyy')}</p>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-end gap-2 text-[#555]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-[3px]">Sector</span>
                </div>
                <p className="text-xs text-white font-medium truncate">{event.location || 'Online / Hybrid'}</p>
              </div>
            </div>

            {/* Dynamic QR Code Section */}
            <div className="pt-10 border-t border-[#1a1a1a] flex flex-col items-center gap-5">
              <div className={cn(
                "bg-white p-4 inline-block transition-all duration-700",
                data?.is_attended ? "opacity-20 grayscale scale-95" : "opacity-100"
              )}>
                <QRCodeSVG 
                  value={window.location.origin + "/verify/" + data.id} 
                  size={150}
                  level="H"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[8px] font-mono tracking-[5px] text-[#555] uppercase">
                  Registry Identity Hash
                </p>
                <p className="text-[10px] font-mono text-[#777]">
                  {data.id.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          
          <footer className="bg-[#0d0d0d] p-6 flex justify-between items-center border-t border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <ShieldCheck className={cn("w-4 h-4", isVerified ? "text-[#00ff88]" : "text-[#555]")} />
              <span className="text-[9px] uppercase tracking-[3px] text-[#555]">Studio.Dei Manifest v2.4</span>
            </div>
            <img 
              src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" 
              className="h-6 opacity-40 grayscale hover:opacity-100 transition-opacity" 
              alt="Logo"
            />
          </footer>
        </div>

        {/* Save/Download Action */}
        <Button 
          onClick={() => window.print()} 
          className="w-full bg-white text-black font-bold uppercase tracking-[5px] rounded-none hover:bg-[#00ff88] transition-all h-14 text-[11px] shadow-lg shadow-black/20"
        >
          {data?.is_attended ? 'Save Receipt' : 'Download Gate Pass'}
        </Button>
      </div>
    </div>
  );
}
