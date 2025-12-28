import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, ShieldCheck, ShieldAlert, 
  Calendar, MapPin, Clock, CheckCircle2, XCircle 
} from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// @ts-ignore
import Barcode from 'react-barcode';

export default function VerifyRegistration() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (registrationId) fetchVerificationData();
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
      <span className="text-[10px] uppercase tracking-[4px] text-[#777777]">Validating Credential</span>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-serif mb-4">Invalid Credential</h1>
      <p className="text-[#777777] mb-8">This registration record could not be verified.</p>
      <Button onClick={() => navigate('/')} variant="outline" className="border-[#1a1a1a]">Return Home</Button>
    </div>
  );

  const event = data.events;
  const now = new Date();
  const eventEndTime = event.end_date ? parseISO(event.end_date) : null;
  
  // LOGIC: Verified if confirmed, completed, or attended. 
  const isVerified = ['confirmed', 'completed', 'attended'].includes(data.current_status);
  const isValid = eventEndTime ? isBefore(now, eventEndTime) : true;
  const isAttended = data.current_status === 'attended'; // Check for attended status

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-10 flex flex-col items-center relative overflow-hidden">
      
      {/* Permanent Non-Removable Watermark */}
      {isAttended && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center rotate-[-35deg] opacity-20 select-none">
          <h1 className="text-[80px] md:text-[120px] font-black border-[12px] border-red-500 text-red-500 px-12 py-6 uppercase tracking-tighter">
            Attended
          </h1>
        </div>
      )}

      <div className={cn(
        "w-full max-w-[450px] space-y-6 transition-all duration-500",
        isAttended && "opacity-40 grayscale blur-[1px]" // Visual indication of used pass
      )}>
        
        {/* Verification Status Banner */}
        <div className={cn(
          "w-full p-4 border flex items-center gap-4",
          isValid && isVerified 
            ? "bg-[#00ff88]/5 border-[#00ff88]/20 text-[#00ff88]" 
            : "bg-red-500/5 border-red-500/20 text-red-500"
        )}>
          {isValid && isVerified ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[2px] font-bold">
              {isAttended ? 'Pass Already Used' : isValid && isVerified ? 'Pass Active & Valid' : 'Pass Invalid or Expired'}
            </p>
          </div>
          <Badge className={cn(
            "text-[9px] uppercase font-bold rounded-none border-none",
            isValid && isVerified && !isAttended ? "bg-[#00ff88] text-black" : "bg-red-500 text-white"
          )}>
            {isAttended ? 'USED' : isValid ? 'VALID' : 'EXPIRED'}
          </Badge>
        </div>

        {/* Digital Pass Card */}
        <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-2xl">
          <div className={cn("h-1.5 w-full", isAttended ? "bg-red-500" : isValid ? "bg-[#00ff88]" : "bg-red-500")} />
          
          <div className="p-6 md:p-8 space-y-6">
            <header className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] text-[#777777] uppercase tracking-[3px]">Official Entry Pass</span>
                <h2 className="text-xl font-serif text-white">{event.title}</h2>
              </div>
            </header>

            {/* Participant Profile */}
            <div className="flex items-center gap-4 py-4 border-y border-[#1a1a1a]">
              <Avatar className="h-14 w-14 border border-[#1a1a1a]">
                <AvatarImage src={data.avatar_url} />
                <AvatarFallback className="bg-[#1a1a1a] text-lg font-serif">
                  {data.full_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-base font-medium text-white">{data.full_name}</h3>
                <p className="text-[10px] text-[#777777] uppercase tracking-wider">{data.participation_type} • {data.team_name || 'Solo'}</p>
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#777777]">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-wider">Date</span>
                </div>
                <p className="text-xs text-white">{format(parseISO(event.start_date), 'MMM dd, yyyy')}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-[#777777]">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-wider">Venue</span>
                </div>
                <p className="text-xs text-white truncate">{event.venue || 'Digital Hub, Online'}</p>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="pt-6 border-t border-[#1a1a1a] flex flex-col items-center">
              <div className="bg-white p-4 w-full flex justify-center overflow-hidden">
                <Barcode 
                  value={data.id.toUpperCase()} 
                  width={1.2} 
                  height={50} 
                  displayValue={false}
                  background="white"
                  lineColor="black"
                />
              </div>
              <p className="mt-2 text-[9px] font-mono tracking-[4px] text-[#777777]">{data.id.toUpperCase()}</p>
            </div>
          </div>
          
          <footer className="bg-[#0d0d0d] p-4 flex justify-between items-center border-t border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <ShieldCheck className={cn("w-3.5 h-3.5", isVerified ? "text-[#00ff88]" : "text-[#777777]")} />
              <span className="text-[8px] uppercase tracking-widest text-[#777777]">Security Verified</span>
            </div>
            <img src="/placeholder.svg" className="h-4 opacity-30 grayscale" alt="Logo" />
          </footer>
        </div>

        {!isAttended && (
          <Button 
            onClick={() => window.print()} 
            className="w-full bg-white text-black font-bold uppercase tracking-[3px] rounded-none hover:bg-[#00ff88] transition-colors h-12 text-[10px]"
          >
            Download Pass
          </Button>
        )}
      </div>
    </div>
  );
}
