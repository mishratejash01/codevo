import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, Loader2, XCircle, Scan, Camera, Building, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {} 
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
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }

    setVerifying(true);
    
    // Extract ID if the QR is a verification URL, otherwise use raw text
    const cleanId = decodedText.includes('/verify/') 
      ? decodedText.split('/verify/').pop()?.trim().toLowerCase() 
      : decodedText.trim().toLowerCase();

    try {
      // Fetch details from event_registrations
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id, 
          full_name, 
          email, 
          college_org_name, 
          current_status, 
          participation_type, 
          team_name
        `)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found");
      if (data.current_status === 'attended') throw new Error("Security Alert: Already Checked In");

      // Mark as attended in backend
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
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 text-[#FAFAFA]">
      <style>{`@keyframes scanline { 0%, 100% { top: 0%; } 50% { top: 100%; } } #reader video { object-fit: cover !important; border-radius: 20px; }`}</style>
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <header>
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-[#3B82F6]" /> Entry Terminal</h1>
          <p className="text-[12px] text-[#A1A1AA]">Authorized Personnel Only</p>
        </header>

        <div className="relative w-full aspect-square bg-black border border-[#27272A] rounded-[24px] overflow-hidden">
          <div id="reader" className="w-full h-full"></div>
          {!isScanning && (
            <div className="absolute inset-0 bg-[#09090B] flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-[#27272A] mb-4" />
              <button onClick={startScanner} className="bg-[#3B82F6] px-6 py-2 rounded-lg font-bold">Enable Terminal</button>
            </div>
          )}
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-[20px] p-6 min-h-[220px] flex flex-col justify-center">
          {verifying ? (
            <div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-[#3B82F6]" /><p className="text-[11px] uppercase tracking-widest">Validating...</p></div>
          ) : guestData ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div><h2 className="text-xl font-semibold">{guestData.full_name}</h2></div>
                <div className="bg-green-500/10 text-[#22C55E] px-3 py-1 rounded text-[10px] font-black">VERIFIED</div>
              </div>
              <div className="grid gap-3 pt-4 border-t border-[#27272A]">
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Building className="w-4 h-4" /> {guestData.college_org_name}</div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Mail className="w-4 h-4" /> {guestData.email}</div>
                <div className="flex items-center gap-3 text-sm text-[#A1A1AA]"><Users className="w-4 h-4" /> {guestData.participation_type} • {guestData.team_name || 'Solo'}</div>
              </div>
            </div>
          ) : errorStatus ? (
            <div className="text-center"><XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" /><p className="text-sm font-bold text-red-500 uppercase">Access Denied</p><p className="text-xs text-[#A1A1AA] mt-2">{errorStatus}</p></div>
          ) : (
            <div className="text-center opacity-50"><Scan className="w-10 h-10 mx-auto mb-3" /><p className="text-sm">Waiting for scan...</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
