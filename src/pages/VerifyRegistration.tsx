import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';

export default function VerifyRegistration() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);

  useEffect(() => {
    if (registrationId) fetchVerificationData();
  }, [registrationId]);

  async function fetchVerificationData() {
    try {
      const { data: reg, error: regError } = await supabase
        .from('event_registrations')
        .select(`*, events (*)`)
        .eq('id', registrationId)
        .single();

      if (regError || !reg) throw new Error("Registry record not found");
      setData(reg);

      if (reg.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', reg.user_id)
          .single();
        setUserProfile(profile);
      }

      const { data: sponsorData } = await supabase
        .from('event_sponsors')
        .select('*')
        .eq('event_id', reg.event_id);
      
      if (sponsorData) setSponsors(sponsorData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-white opacity-20" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-serif mb-4">Invalid Credential</h1>
      <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 border border-[#262626] text-[10px] uppercase tracking-widest text-[#4a4a4a] hover:text-white transition-colors">Return Home</button>
    </div>
  );

  const event = data.events;
  const isAttended = data.is_attended; // THIS IS THE CORRECT FIELD

  return (
    <div className="verify-registration-container">
      <style>{`
        .verify-registration-container { --bg: #0a0a0a; --card-bg: #111111; --silver: #e2e2e2; --silver-muted: #4a4a4a; --platinum-grad: linear-gradient(135deg, #f0f0f0 0%, #a1a1a1 100%); --border: #262626; --accent: #ffffff; min-height: 100vh; background-color: var(--bg); color: var(--silver); font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; padding: 24px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .container { width: 100%; max-width: 420px; animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pass-card { background: var(--card-bg) !important; border: 1px solid var(--border); position: relative; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
        .card-top-accent { height: 2px; width: 100%; background: var(--platinum-grad) !important; opacity: 0.8; }
        .card-content { padding: 40px 35px; }
        header h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; color: var(--accent); line-height: 1.1; margin-bottom: 8px; }
        header p { font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: var(--silver-muted); margin-bottom: 40px; }
        .identity-block { display: flex; align-items: center; gap: 20px; padding: 25px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 30px; }
        .avatar-frame { width: 65px; height: 65px; border: 1px solid var(--silver-muted); padding: 3px; overflow: hidden; }
        .avatar-frame img { width: 100%; height: 100%; object-fit: cover; }
        .id-text h3 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; color: var(--silver); }
        .id-text span { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: var(--silver-muted); }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-item label { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: var(--silver-muted); margin-bottom: 5px; }
        .info-item p { font-size: 13px; font-weight: 300; color: #ccc; line-height: 1.4; }
        .info-item p span { display: block; }
        .sponsor-section { margin-top: 30px; border-top: 1px solid var(--border); padding-top: 20px; }
        .sponsor-section label { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: 3px; color: var(--silver-muted); margin-bottom: 15px; text-align: center; }
        .logo-cloud { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }
        .mini-logo { height: 20px; max-width: 60px; filter: brightness(0) invert(1); opacity: 0.6; }
        .verification-zone { display: flex; flex-direction: column; align-items: center; position: relative; margin-top: 30px; }
        .qr-wrapper { background: #fff; padding: 12px; position: relative; }
        .qr-dimmed { filter: grayscale(1) contrast(0.5) blur(1px); opacity: 0.15; }
        .stamp-attended { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-12deg); border: 2px solid #555; padding: 8px 16px; background: rgba(17, 17, 17, 0.9); backdrop-filter: blur(2px); z-index: 5; text-align: center; box-shadow: 0 0 20px rgba(0,0,0,0.5); pointer-events: none; }
        .stamp-attended span { display: block; font-size: 18px; font-weight: 700; letter-spacing: 4px; color: #888; text-transform: uppercase; }
        .id-hash { margin-top: 20px; font-family: 'Space Mono', monospace; font-size: 8px; color: var(--silver-muted); letter-spacing: 2px; }
        .actions { margin-top: 30px; display: flex; flex-direction: column; gap: 12px; }
        .btn-primary { background: var(--platinum-grad); border: none; padding: 16px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: #000; cursor: pointer; }
        .btn-secondary { background: transparent; border: 1px solid var(--border); padding: 14px; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: var(--silver-muted); text-align: center; cursor: pointer; }
        @media print {
          .actions { display: none !important; }
          .stamp-attended { display: none !important; }
          .qr-dimmed { filter: none !important; opacity: 1 !important; }
          .mini-logo { filter: none !important; opacity: 1 !important; }
          body { background: var(--bg) !important; -webkit-print-color-adjust: exact; }
          .verify-registration-container { background: var(--bg) !important; padding: 0 !important; }
          .pass-card { box-shadow: none !important; }
        }
      `}</style>

      <div className="container">
        <div className="pass-card">
          <div className="card-top-accent"></div>
          <div className="card-content">
            <header>
              <p>Official Event Entry</p>
              <h2>{event.title}</h2>
            </header>

            <div className="identity-block">
              <div className="avatar-frame">
                <img src={userProfile?.avatar_url || "/placeholder.svg"} alt="Identity" />
              </div>
              <div className="id-text">
                <h3>{data.full_name}</h3>
                <span>{data.participation_type} • {data.team_name || 'Individual'}</span>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Date & Time</label>
                <p>
                  {event.start_date ? format(parseISO(event.start_date), 'MMM dd, yyyy') : 'TBA'}
                  <span className="text-[#00ff88] mt-0.5">{event.start_date ? format(parseISO(event.start_date), 'hh:mm a') : ''}</span>
                </p>
              </div>
              <div className="info-item">
                <label>Mode</label>
                <p className="uppercase">{event.mode || 'In-Person'}</p>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <label>Venue & Location</label>
                <p>
                  <span className="font-semibold block text-white mb-0.5">{event.venue || 'Main Venue'}</span>
                  {event.location || 'Online'}
                </p>
              </div>
            </div>

            {sponsors.length > 0 && (
              <div className="sponsor-section">
                <label>Event Patrons & Partners</label>
                <div className="logo-cloud">
                  {sponsors.map((s: any) => (
                    <img key={s.id} src={s.logo_url} alt={s.name} className="mini-logo" />
                  ))}
                </div>
              </div>
            )}

            <div className="verification-zone">
              <div className={cn("qr-wrapper", isAttended && "qr-dimmed")}>
                <QRCodeSVG value={data.id} size={140} level="H" bgColor="#ffffff" fgColor="#000000" />
              </div>
              {isAttended && (
                <div className="stamp-attended">
                  <span>Attended</span>
                </div>
              )}
              <div className="id-hash">UID: {data.id.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={() => window.print()}>Download Digital Pass</button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
