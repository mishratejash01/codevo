import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { ShieldCheck, Loader2, XCircle, Scan, Camera, Building, Mail, Users, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [processingVerdict, setProcessingVerdict] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  
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
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
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
    setAlreadyScanned(false);
    setProcessingVerdict(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }

    setVerifying(true);
    
    // Support URL scanning by extracting the ID
    const cleanId = decodedText.includes('/verify/') 
      ? decodedText.split('/verify/').pop()?.split('?')[0].trim()
      : decodedText.trim();

    try {
      // 1. Fetch record using ID
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id, 
          full_name, 
          email, 
          college_org_name, 
          current_status, 
          status,
          participation_type, 
          team_name,
          is_attended,
          attended_at
        `)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found");

      setGuestData(data);
      
      // 2. Check IS_ATTENDED boolean only
      if (data.is_attended === true) {
        setAlreadyScanned(true);
        toast.warning("ALERT: User has already entered!");
      } else {
        setAlreadyScanned(false);
      }

    } catch (err: any) {
      setErrorStatus(err.message);
      toast.error(err.message);
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerdict = async (approved: boolean) => {
    if (!guestData) return;

    if (!approved) {
      toast.error("Entry Rejected");
      resetState();
      if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      return;
    }

    setProcessingVerdict(true);
    try {
      // 3. Update ONLY is_attended and attended_at
      // We do NOT update 'current_status' or 'status' to avoid constraints
      const { error } = await supabase
        .from('event_registrations')
        .update({ 
          is_attended: true,
          attended_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', guestData.id);

      if (error) throw error;

      toast.success(`Access Granted: ${guestData.full_name}`);
      
      // Auto-refresh scanner
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error("Database Error: " + err.message);
      setProcessingVerdict(false);
    }
  };

  const handleReset = () => {
    resetState();
    if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
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
            <div className="absolute inset-0 bg-[#09090B] z-10 flex flex-col items-center justify-center text-center p-6">
              <Camera className="w-12 h-12 text-[#27272A] mb-4" />
              <button onClick={startScanner} className="bg-[#3B82F6] px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#2563EB] transition-colors">
                Enable Terminal
              </button>
            </div>
          )}
        </div>

        <div className={cn(
          "bg-[#18181B] border rounded-[20px] p-6 min-h-[220px] flex flex-col justify-center transition-colors duration-500",
          alreadyScanned ? "border-yellow-500/50 bg-yellow-500/5" : "border-[#27272A]"
        )}>
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
                {alreadyScanned ? (
                  <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded text-[10px] font-black tracking-tighter">ALREADY IN</div>
                ) : (
                  <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded text-[10px] font-black tracking-tighter">SCANNED</div>
                )}
              </div>

              {alreadyScanned && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                  <p className="text-[10px] text-yellow-200 uppercase leading-tight font-bold">
                    Warning: This pass was used at {guestData.attended_at ? new Date(guestData.attended_at).toLocaleTimeString() : 'Unknown'}.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-2 text-sm">
                <div className="flex items-center gap-3 text-[#A1A1AA]"><Building className="w-4 h-4 text-[#3B82F6]" /> {guestData.college_org_name}</div>
                <div className="flex items-center gap-3 text-[#A1A1AA]"><Mail className="w-4 h-4 text-[#3B82F6]" /> {guestData.email}</div>
                <div className="flex items-center gap-3 text-[#A1A1AA]"><Users className="w-4 h-4 text-[#3B82F6]" /> {guestData.participation_type} • {guestData.team_name || 'Individual'}</div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-[#27272A] mt-2">
                {!alreadyScanned ? (
                  <>
                    <button 
                      disabled={processingVerdict}
                      onClick={() => handleVerdict(true)}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {processingVerdict ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Accept</>}
                    </button>
                    <button 
                      disabled={processingVerdict}
                      onClick={() => handleVerdict(false)}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <X size={18} /> Reject
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleReset}
                    className="w-full bg-[#27272A] hover:bg-[#3f3f46] py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw size={18} /> Scan Next
                  </button>
                )}
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
