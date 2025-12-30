import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, QrCode, Ticket, Calendar, Mail, User, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRegistrationTable } from '@/utils/eventHelpers'; //

interface SimpleRegistrationCardProps {
  eventId: string;
  eventTitle: string;
  formType: string; // Passed from the parent component
}

interface RegistrationData {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  college_org_name: string;
  country_city: string;
  current_status: string;
  status: string | null;
  payment_status: string | null;
  created_at: string | null;
}

export function SimpleRegistrationCard({ 
  eventId, 
  eventTitle, 
  formType 
}: SimpleRegistrationCardProps) {
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchRegistration();
  }, [eventId, formType]);

  async function fetchRegistration() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { 
        setLoading(false); 
        return; 
      }

      // Determine the correct database table dynamically based on event type
      const table = getRegistrationTable(formType);
      
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Registration fetch error:", error);
      } else if (data) {
        setRegistration(data as RegistrationData);
      }
    } catch (err) {
      console.error("Critical error fetching registration:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="w-full h-[200px] flex items-center justify-center border border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff8c00]"></div>
    </div>
  );

  if (!registration) return null;

  const isConfirmed = registration.status === 'confirmed' || registration.payment_status === 'exempt' || registration.payment_status === 'completed';

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* Header */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88] shrink-0">
            <Check className="w-5 h-5 md:w-6 md:h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] md:text-[10px] tracking-[3px] uppercase text-[#777777] block">Registry Verified</span>
            <h2 className="font-serif text-2xl md:text-[2.4rem] font-normal leading-none text-white break-words">
              {eventTitle}
            </h2>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">
          <Button 
            // Updated to the refactored dynamic verification route
            onClick={() => navigate(`/verify/${formType}/${registration.id}`)}
            className="flex-1 md:flex-none h-[45px] bg-[#1a1a1a] border border-[#1a1a1a] hover:bg-[#00ff88] hover:text-black hover:border-[#00ff88] text-[#777777] transition-all uppercase tracking-widest text-[10px] font-medium px-4 md:px-6 rounded-none flex items-center justify-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            <span>View Pass</span>
          </Button>
          
          <button 
            onClick={() => setShowQR(true)} 
            className="w-[45px] h-[45px] border border-[#1a1a1a] flex items-center justify-center text-[#777777] hover:text-[#00ff88] transition-colors shrink-0"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Registration Details */}
      <div className="p-6 md:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-[#777777] mt-1 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-[2px] text-[#777777] block mb-1">Registered Name</span>
              <p className="text-white text-sm">{registration.full_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-[#777777] mt-1 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-[2px] text-[#777777] block mb-1">Email</span>
              <p className="text-white text-sm">{registration.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#777777] mt-1 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-[2px] text-[#777777] block mb-1">Location</span>
              <p className="text-white text-sm">{registration.country_city || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#777777] mt-1 shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-[2px] text-[#777777] block mb-1">Registered On</span>
              <p className="text-white text-sm">
                {registration.created_at 
                  ? format(new Date(registration.created_at), 'MMM dd, yyyy') 
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[2px] text-[#777777]">Registration Status</span>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] bg-transparent">
            <div className="relative flex h-2 w-2">
              {isConfirmed && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isConfirmed 
                  ? "bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.8)]" 
                  : "bg-yellow-500"
              }`}></span>
            </div>
            <span className="text-[10px] uppercase tracking-[1px] text-[#e0e0e0] font-medium">
              {isConfirmed ? 'Confirmed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-xs rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center">Entry QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="bg-white p-4">
              {/* Updated QR format: "formType:registrationId" for the AdminScanner */}
              <QRCodeSVG 
                value={`${formType}:${registration.id}`} 
                size={180} 
              />
            </div>
            <p className="text-[10px] text-[#777777] uppercase tracking-[2px] text-center">
              Present this at the venue for verification
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
