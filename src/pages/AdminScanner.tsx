import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ShieldCheck, Loader2, UserCheck, XCircle, RefreshCw, Scan, Camera, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [result, setResult] = useState<{ success: boolean; name?: string; message?: string } | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Initialize the low-level QR engine on mount
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
      setResult(null);
      
      await html5QrCodeRef.current.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        () => {} // Quietly ignore scan failures
      );
    } catch (err) {
      console.error(err);
      toast.error("Camera access denied or error occurred");
      setIsScanning(false);
    }
  };

  const toggleCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    
    if (isScanning && html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      // Restart with new facing mode
      await html5QrCodeRef.current.start(
        { facingMode: newMode },
        { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
        onScanSuccess,
        () => {}
      );
    }
  };

  async function onScanSuccess(decodedText: string) {
    if (verifying) return;
    setVerifying(true);

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, full_name, current_status')
        .eq('id', decodedText.toLowerCase())
        .single();

      if (error || !data) throw new Error("Invalid Pass: Record not found");
      if (data.current_status === 'attended') throw new Error("Duplicate Entry: Already Attended");

      const { error: updateError } = await supabase
        .from('event_registrations')
        .update({ 
          current_status: 'attended',
          updated_at: new Date().toISOString() 
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setResult({ success: true, name: data.full_name });
      toast.success(`Verified: ${data.full_name}`);
    } catch (err: any) {
      setResult({ success: false, message: err.message });
      toast.error(err.message);
    } finally {
      setVerifying(false);
      // Wait 4 seconds before allowing the next scan to show results clearly
      setTimeout(() => setResult(null), 4000);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center p-6 font-sans">
      <style>{`
        @keyframes scanline {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 16px;
        }
        #reader {
          border: none !important;
        }
      `}</style>

      <div className="w-full max-w-[420px] flex flex-col gap-5">
        <header className="text-left pl-1">
          <h1 className="text-[18px] font-bold tracking-tight flex items-center gap-2.5 text-[#FAFAFA]">
            <ShieldCheck className="w-5 h-5 text-[#3B82F6]" /> 
            Entry Scanner
          </h1>
          <p className="text-[12px] text-[#A1A1AA] mt-1">Ready to verify guest credentials</p>
        </header>

        {/* Camera Viewport Container */}
        <div className="relative w-full aspect-square bg-black border border-[#27272A] rounded-[24px] overflow-hidden shadow-2xl">
          {/* Internal Camera Feed */}
          <div id="reader" className="w-full h-full"></div>

          {/* Camera Switch Button */}
          <button 
            onClick={toggleCamera}
            className="absolute top-4 right-4 z-30 bg-[#18181B]/80 backdrop-blur-md border border-[#27272A] text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>

          {/* Scanning HUD Overlay */}
          {isScanning && !result && !verifying && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
              <div className="w-[70%] h-[70%] border-2 border-white/10 rounded-[32px] relative">
                <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent shadow-[0_0_15px_#3B82F6] top-0 animate-[scanline_2.5s_infinite_ease-in-out]" />
              </div>
            </div>
          )}

          {/* Active Label */}
          <div className="absolute bottom-5 w-full text-center z-20 pointer-events-none">
            <span className="text-[10px] uppercase tracking-[2px] text-white/40">
              {facingMode === "environment" ? "Back" : "Front"} Camera Active
            </span>
          </div>

          {/* Idle Overlay */}
          {!isScanning && (
            <div className="absolute inset-0 bg-[#09090B] z-10 flex flex-col items-center justify-center p-8 text-center">
              <Camera className="w-12 h-12 text-[#27272A] mb-4" />
              <p className="text-xs text-[#A1A1AA] uppercase tracking-widest">Camera Offline</p>
            </div>
          )}
        </div>

        {/* Data Display Panel */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-[16px] p-6 min-h-[180px] flex flex-col justify-center">
          {verifying ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
              <p className="text-[11px] uppercase tracking-widest text-[#A1A1AA]">Syncing Records...</p>
            </div>
          ) : result ? (
            <div className="animate-in fade-in zoom-in duration-300">
              {result.success ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-[#A1A1AA] block mb-1">Guest Name</span>
                    <span className="text-lg font-medium text-[#FAFAFA]">{result.name}</span>
                  </div>
                  <div className="pt-4 border-t border-[#27272A]">
                    <span className="text-[11px] uppercase font-semibold tracking-wider text-[#A1A1AA] block mb-1">Verification Status</span>
                    <div className="inline-flex items-center gap-2 bg-green-500/10 text-[#22C55E] border border-green-500/20 px-3 py-1.5 rounded-md text-[12px] font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> ACCESS GRANTED
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Entry Rejected</p>
                  <p className="text-xs text-[#A1A1AA] mt-1">{result.message}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-[#A1A1AA]">
              <Scan className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-[13px]">Waiting for credentials...</p>
            </div>
          )}
        </div>

        {/* Main Controls */}
        <button 
          onClick={isScanning ? () => {} : startScanner}
          disabled={verifying}
          className={cn(
            "w-full py-4.5 rounded-[12px] text-sm font-semibold flex items-center justify-center gap-3 transition-all active:opacity-80",
            isScanning ? "bg-[#27272A] text-[#FAFAFA] cursor-default" : "bg-[#3B82F6] text-white"
          )}
        >
          {verifying ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-4.5 h-4.5" />
          )}
          <span>{isScanning ? (result ? "Scanning Paused" : "Scanner Active") : "Start Scanning"}</span>
        </button>

        <p className="text-center text-[10px] text-[#A1A1AA] uppercase tracking-[2px]">
          System Terminal Alpha-04
        </p>
      </div>
    </div>
  );
}
