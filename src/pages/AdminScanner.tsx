import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, Loader2, UserCheck, XCircle, RefreshCw, Scan, Camera, CheckCircle, Mail, Building, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [guestData, setGuestData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      setIsScanning(true);
      resetState();
      
      await html5QrCodeRef.current.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        onScanSuccess,
        () => {} // Quietly ignore scan failures
      );
    } catch (err) {
      toast.error("Camera access denied");
      setIsScanning(false);
    }
  };

  const resetState = () => {
    setGuestData(null);
    setErrorStatus(null);
    setVerifying(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // 1. IMMEDIATELY Pause to prevent multiple simultaneous requests (Fixes Infinite Recursion)
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }

    setVerifying(true);
    const cleanId = decodedText.trim().toLowerCase();

    try {
      // 2. Fetch full record details using the UID from the QR code
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id, 
          full_name, 
          email, 
          college_org_name, 
          current_status, 
          payment_status, 
          participation_type, 
          team_name,
          mobile_number
        `)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found in database");
      if (data.current_status === 'attended') throw new Error("Security Alert: Already Checked In");

      // 3. Mark as attended in backend
      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({ 
          current_status: 'attended',
          updated_at: new Date().toISOString() 
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setGuestData(data);
      toast.success(`Access Granted: ${data.full_name}`);
    } catch (err: any) {
      setErrorStatus(err.message);
      toast.error(err.message);
    } finally {
      setVerifying(false);
      // 4. Wait 4 seconds for Admin to see the details, then RESUME camera
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.resume();
        }
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 font-sans text-[#FAFAFA]">
      <style>{`
        @keyframes scanline { 0%, 100% { top: 0%; } 50% { top: 100%; } }
        #reader video { object-fit: cover !important; border-radius: 20px; }
      `}</style>

      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <header className="pl-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#3B82F6]" /> Entry Terminal
          </h1>
          <p className="text-[12px] text-[#A1A1AA] mt-1">Authorized personnel only • Secure Sync Active</p>
        </header>

        {/* Camera Container */}
        <div className="relative w-full aspect-square bg-black border border-[#27272A] rounded-[24px] overflow-hidden shadow-2xl">
          <div id="reader" className="w-full h-full"></div>

          {isScanning && !verifying && !guestData && !errorStatus && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
              <div className="w-[70%] h-[70%] border-2 border-white/5 rounded-[32px] relative">
                <div className="absolute w-full h-[2px] bg-[#3B82F6] shadow-[0_0_15px_#3B82F6] top-0 animate-[scanline_2.5s_infinite_ease-in-out]" />
              </div>
            </div>
          )}

          {!isScanning && (
            <div className="absolute inset-0 bg-[#09090B] z-10 flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-[#27272A] mb-4" />
              <button onClick={startScanner} className="bg-[#3B82F6] px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest">Enable Terminal</button>
            </div>
          )}
        </div>

        {/* Detailed Verification Panel */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-[20px] p-6 min-h-[220px] flex flex-col justify-center">
          {verifying ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6]" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">Validating UID...</p>
            </div>
          ) : guestData ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-widest block mb-1">Guest Details</span>
                  <h2 className="text-xl font-semibold leading-tight">{guestData.full_name}</h2>
                </div>
                <div className="bg-green-500/10 text-[#22C55E] border border-green-500/20 px-3 py-1 rounded text-[10px] font-black tracking-tighter">VERIFIED</div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4 border-t border-[#27272A]">
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
                  <Building className="w-4 h-4 text-[#3B82F6]" /> {guestData.college_org_name}
                </div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
                  <Mail className="w-4 h-4 text-[#3B82F6]" /> {guestData.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
                  <Users className="w-4 h-4 text-[#3B82F6]" /> {guestData.participation_type || 'Solo'} • {guestData.team_name || 'Individual'}
                </div>
              </div>
            </div>
          ) : errorStatus ? (
            <div className="text-center py-6 animate-in slide-in-from-top-2">
              <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
              <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Access Denied</p>
              <p className="text-xs text-[#A1A1AA] mt-2">{errorStatus}</p>
            </div>
          ) : (
            <div className="text-center text-[#27272A] opacity-50">
              <Scan className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm tracking-widest uppercase">Waiting for scan...</p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[#27272A] uppercase tracking-[4px]">Secure Node: Alpha-04</p>
      </div>
    </div>
  );
}
