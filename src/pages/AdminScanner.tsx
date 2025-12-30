import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRegistrationTable, getAttendanceRPC } from '@/utils/eventHelpers';

// Type for the fetched guest data
interface GuestData {
  id: string;
  full_name: string;
  email: string;
  college_org_name: string;
  current_status: string;
  status: string | null;
  participation_type: string | null;
  team_name: string | null;
  is_attended: boolean | null;
  attended_at: string | null;
  formType: string;
  events: {
    title: string;
    venue: string | null;
  } | null;
}

// Type for valid RPC names
type AttendanceRPCName = 
  | 'mark_as_attended'
  | 'mark_workshop_attended'
  | 'mark_webinar_attended'
  | 'mark_meetup_attended'
  | 'mark_contest_attended';

export default function AdminScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [processingVerdict, setProcessingVerdict] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
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
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
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
    setVerifying(false);
    setAlreadyScanned(false);
    setProcessingVerdict(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.pause(true); 
    }

    setVerifying(true);
    
    // SECURITY: Reject Public/Dashboard URLs
    if (decodedText.includes('http') || decodedText.includes('/verify/')) {
        toast.error("INVALID QR: Public Dashboard Link");
        setTimeout(() => {
            resetState();
            if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
        }, 2000);
        return;
    }

    // Parse Refactored Format: "formType:registrationId"
    const parts = decodedText.trim().split(':');
    const formType = parts.length > 1 ? parts[0] : 'normal';
    const cleanId = parts.length > 1 ? parts[1] : parts[0];

    try {
      // 1. Fetch Record from the dynamic table
      const tableName = getRegistrationTable(formType);
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`
          id, full_name, email, college_org_name, 
          current_status, status, participation_type, 
          team_name, is_attended, attended_at,
          events ( title, venue )
        `)
        .eq('id', cleanId)
        .single();

      if (error || !data) throw new Error("Invalid Pass ID");

      // Cast and inject formType into guestData for RPC handling
      const guestRecord = data as unknown as Omit<GuestData, 'formType'>;
      setGuestData({ ...guestRecord, formType });
      
      // 2. Check IS_ATTENDED status
      if (guestRecord.is_attended === true) {
        setAlreadyScanned(true);
        toast.warning("ALERT: Already Entered!");
      } else {
        setAlreadyScanned(false);
      }

    } catch (err: any) {
      toast.error(err.message);
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 2000);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerdict = async (approved: boolean) => {
    if (!guestData) return;

    if (!approved) {
      toast.error("Entry Denied");
      resetState();
      if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      return;
    }

    setProcessingVerdict(true);
    try {
      // 3. USE DYNAMIC RPC FUNCTION - Cast to valid RPC name
      const rpcName = getAttendanceRPC(guestData.formType) as AttendanceRPCName;
      const { error } = await supabase.rpc(rpcName, {
        reg_id: guestData.id
      });

      if (error) throw error;

      toast.success(`Welcome, ${guestData.full_name}`);
      
      // Auto-reset after delay
      setTimeout(() => {
        resetState();
        if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
      }, 1500);

    } catch (err: any) {
      console.error("Verdict Error:", err);
      toast.error("System Error: " + err.message);
    } finally {
      setProcessingVerdict(false);
    }
  };

  const handleReset = () => {
    resetState();
    if (html5QrCodeRef.current) html5QrCodeRef.current.resume();
  };

  return (
    <div className="admin-gate-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;500&family=Inter:wght@300;400;600&display=swap');

        .admin-gate-wrapper {
            background-color: #080808;
            color: #e2e2e2;
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: center;
            padding: 30px 20px;
            min-height: 100vh;
        }

        .gate-container { width: 100%; max-width: 420px; }

        .gate-header {
            border-left: 1px solid #e2e2e2;
            padding: 5px 20px;
            margin-bottom: 30px;
        }

        .gate-header h1 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 24px;
            margin: 0;
            font-weight: 500;
            color: #fff;
        }

        .gate-header p {
            font-size: 10px;
            color: #555555;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
        }

        .viewfinder {
            width: 100%;
            aspect-ratio: 1;
            background: #111;
            border: 1px solid #222222;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        #reader { width: 100%; height: 100%; object-fit: cover; }
        #reader video { object-fit: cover !important; }

        .mark {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 1px solid #e2e2e2;
            opacity: 0.5;
            z-index: 10;
            pointer-events: none;
        }
        .tl { top: 20px; left: 20px; border-right: none; border-bottom: none; }
        .tr { top: 20px; right: 20px; border-left: none; border-bottom: none; }
        .bl { bottom: 20px; left: 20px; border-right: none; border-top: none; }
        .br { bottom: 20px; right: 20px; border-left: none; border-top: none; }

        .scan-beam {
            position: absolute;
            width: 80%;
            height: 1px;
            background: #e2e2e2;
            box-shadow: 0 0 15px #e2e2e2;
            animation: move-beam 4s infinite ease-in-out;
            z-index: 10;
            pointer-events: none;
        }

        @keyframes move-beam {
            0%, 100% { top: 30%; opacity: 0; }
            50% { top: 70%; opacity: 1; }
        }

        .pass-info-card {
            background: #111;
            border: 1px solid #222222;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            animation: fadeUp 0.5s ease-out;
        }
        
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .already-entered {
            background: #1a1600;
            border: 1px solid #d4af37;
            color: #d4af37;
            padding: 12px;
            font-size: 10px;
            text-align: center;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .name-heading {
            font-family: 'Cormorant Garamond', serif;
            font-size: 28px;
            margin: 0 0 4px 0;
            color: #fff;
            font-weight: 500;
        }

        .role-heading {
            font-size: 11px;
            color: #555555;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 30px;
            display: block;
        }

        .row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-top: 1px solid #1a1a1a;
            font-size: 12px;
            color: #cccccc;
        }

        .row span:first-child { 
            color: #555555; 
            text-transform: uppercase; 
            font-size: 9px; 
            letter-spacing: 1px; 
        }

        .gate-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 30px;
            border-top: 1px solid #222222;
        }

        .gate-btn {
            background: transparent;
            border: none;
            padding: 20px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            color: #e2e2e2;
            transition: all 0.3s ease;
        }

        .btn-grant { background: #e2e2e2; color: #000; font-weight: 600; }
        .btn-grant:hover { opacity: 0.9; }
        .btn-grant:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-deny { color: #555555; }
        .btn-deny:hover { color: #8a2a2b; background: rgba(138, 42, 43, 0.1); }
        
        .scan-btn {
            width: 100%;
            background: #e2e2e2;
            color: #000;
            border: none;
            padding: 12px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            font-weight: 600;
        }

        .reset-btn {
            width: 100%;
            background: #222;
            color: #e2e2e2;
            border: 1px solid #333;
            padding: 16px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            cursor: pointer;
            margin-top: 25px;
            transition: all 0.2s ease;
        }
        .reset-btn:hover { background: #333; border-color: #e2e2e2; }
      `}</style>

      <div className="gate-container">
        <header className="gate-header">
          <h1>{guestData ? (guestData.events?.title || 'Event Entry') : 'Entry Gate'}</h1>
          <p>{guestData ? (guestData.events?.venue || 'Venue Not Set') : 'Secure Terminal'} • Check-in Point</p>
        </header>

        <div className="viewfinder">
          <div className="mark tl"></div>
          <div className="mark tr"></div>
          <div className="mark bl"></div>
          <div className="mark br"></div>
          <div className="scan-beam"></div>
          
          <div id="reader"></div>
          
          {!isScanning && !guestData && (
            <div style={{position: 'absolute', zIndex: 20}}>
               <button onClick={startScanner} className="scan-btn">
                 ACTIVATE OPTICS
               </button>
            </div>
          )}
          
          {verifying && (
             <div style={{position: 'absolute', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <Loader2 className="animate-spin text-white mb-2" />
                <span style={{fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '2px'}}>Recognizing...</span>
             </div>
          )}
        </div>

        {guestData ? (
          <div className="pass-info-card">
            {alreadyScanned && (
              <div className="already-entered">
                This pass has already entered
              </div>
            )}

            <h2 className="name-heading">{guestData.full_name}</h2>
            <span className="role-heading">{guestData.participation_type || 'Solo'} • {guestData.team_name || 'Individual'}</span>

            <div className="row">
              <span>Organization</span>
              <span>{guestData.college_org_name}</span>
            </div>
            <div className="row">
              <span>Email</span>
              <span>{guestData.email}</span>
            </div>
            <div className="row">
              <span>UID</span>
              <span>{guestData.id.substring(0, 8).toUpperCase()}</span>
            </div>
            {guestData.attended_at && (
               <div className="row">
                 <span>Last Check-in</span>
                 <span>{new Date(guestData.attended_at).toLocaleTimeString()}</span>
               </div>
            )}

            {!alreadyScanned ? (
                <div className="gate-actions">
                  <button 
                    className="gate-btn btn-deny" 
                    onClick={() => handleVerdict(false)}
                    disabled={processingVerdict}
                  >
                    Deny
                  </button>
                  <button 
                    className="gate-btn btn-grant" 
                    onClick={() => handleVerdict(true)}
                    disabled={processingVerdict}
                  >
                    {processingVerdict ? "Processing..." : "Allow Entry"}
                  </button>
                </div>
            ) : (
                <button className="reset-btn" onClick={handleReset}>
                   SCAN NEXT CREDENTIAL
                </button>
            )}
          </div>
        ) : (
           <div style={{textAlign: 'center', color: '#333', fontSize: '10px', letterSpacing: '1px', marginTop: '20px'}}>
              WAITING FOR CREDENTIAL SIGNAL
           </div>
        )}

        {guestData && !alreadyScanned && (
            <div style={{textAlign: 'center', marginTop: '20px'}}>
                <button 
                    style={{background:'none', border:'none', color:'#555', fontSize:'9px', textTransform:'uppercase', letterSpacing:'2px', cursor:'pointer'}} 
                    onClick={handleReset}
                >
                    Discard & Scan Next
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
