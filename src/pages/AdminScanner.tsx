import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, Loader2, XCircle, Scan, Camera, Building, Mail, Users, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [processingVerdict, setProcessingVerdict] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const resetState = () => {
    setGuestData(null);
    setErrorStatus(null);
    setVerifying(false);
    setProcessingVerdict(false);
  };

  const startScanner = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      setIsScanning(true);
      resetState();
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        onScanSuccess,
        () => {}
      );
    } catch (err) {
      toast.error("Camera access denied");
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }
    setVerifying(true);
    const cleanId = decodedText.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`id, full_name, email, college_org_name, current_status, participation_type, team_name`)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found");
      if (data.current_status === 'attended') throw new Error("Security Alert: Already Checked In");

      setGuestData(data);
    } catch (err: any) {
      setErrorStatus(err.message);
      toast.error(err.message);
      setTimeout(() => { resetState(); html5QrCodeRef.current?.resume(); }, 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerdict = async (approved: boolean) => {
    if (!guestData) return;
    if (!approved) {
      toast.error("Entry Rejected");
      resetState();
      html5QrCodeRef.current?.resume();
      return;
    }

    setProcessingVerdict(true);
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ 
          current_status: 'attended',
          updated_at: new Date().toISOString() 
        })
        .eq('id', guestData.id);

      if (error) throw error;
      toast.success(`Access Granted: ${guestData.full_name}`);
      resetState();
      html5QrCodeRef.current?.resume();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingVerdict(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 text-[#FAFAFA]">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <header>
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-[#3B82F6]" /> Entry Terminal</h1>
        </header>

        <div className="relative w-full aspect-square bg-black border border-[#27272A] rounded-[24px] overflow-hidden">
          <div id="reader" className="w-full h-full"></div>
          {!isScanning && (
            <div className="absolute inset-0 bg-[#09090B] flex flex-col items-center justify-center">
              <Camera className="mb-4 text-[#27272A]" />
              <button onClick={startScanner} className="bg-[#3B82F6] px-6 py-2 rounded-lg font-bold">Enable Scanner</button>
            </div>
          )}
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-[20px] p-6 min-h-[250px] flex flex-col justify-center">
          {verifying ? (
            <Loader2 className="animate-spin mx-auto text-[#3B82F6]" />
          ) : guestData ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{guestData.full_name}</h2>
              <div className="text-sm text-[#A1A1AA] space-y-2 pb-4 border-b border-[#27272A]">
                <div className="flex items-center gap-2"><Building size={14} /> {guestData.college_org_name}</div>
                <div className="flex items-center gap-2"><Users size={14} /> {guestData.participation_type}</div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  disabled={processingVerdict}
                  onClick={() => handleVerdict(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {processingVerdict ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Accept</>}
                </button>
                <button 
                  disabled={processingVerdict}
                  onClick={() => handleVerdict(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ) : errorStatus ? (
            <div className="text-center text-red-500"><XCircle className="mx-auto mb-2" /> {errorStatus}</div>
          ) : (
            <div className="text-center opacity-50"><Scan className="mx-auto mb-2" /> Waiting for scan...</div>
          )}
        </div>
      </div>
    </div>
  );
}
