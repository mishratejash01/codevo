import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Users, RefreshCw, ChevronDown, ChevronUp, Layers, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TeamInvitation {
  id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_mobile: string | null;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
  created_at: string;
}

interface Registration {
  id: string;
  full_name: string;
  email: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
  preferred_track: string | null;
  created_at: string;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  eventType: string; 
  isPaid: boolean;
  registrationFee?: number;
  currency?: string;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  eventTitle, 
  isPaid,
  registrationFee,
  currency = 'INR'
}: AlreadyRegisteredCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistration();
  }, [eventId]);

  async function fetchRegistration() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data: reg, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error || !reg) {
      setLoading(false);
      return;
    }

    setRegistration(reg as any);

    // FIX: Fetch invitations if participation is 'Team', ignore the eventType string filter
    if (reg.participation_type === 'Team') {
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('registration_id', reg.id)
        .order('created_at', { ascending: true });

      if (invites) setInvitations(invites as any);
    }

    setLoading(false);
  }

  async function resendInvitation(invitationId: string) {
    setResendingId(invitationId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Invitation resent successfully!");
    setResendingId(null);
  }

  if (loading) {
    return (
      <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] p-10 animate-pulse mx-auto">
        <div className="h-8 bg-zinc-800 w-1/2 mb-6" />
        <div className="h-40 bg-zinc-900 w-full" />
      </div>
    );
  }

  if (!registration) return null;

  const isPaymentPending = isPaid && registration.payment_status === 'pending';
  const completedCount = invitations.filter(i => i.status === 'completed').length;
  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* Header Section */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Registration Verified</span>
            <h2 className="font-serif text-3xl md:text-[2.4rem] font-normal leading-none text-white">You're Registered!</h2>
          </div>
        </div>
        {isPaymentPending && (
          <div className="text-[10px] tracking-[2px] uppercase py-2 px-4 border border-[#ff8c00] text-[#ff8c00]">
            Payment Pending
          </div>
        )}
      </header>

      {/* Info Grid */}
      <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 text-white">
        <div className="space-y-3">
          <label className="block text-[10px] tracking-[2px] uppercase text-[#777777]">Full Identity</label>
          <p className="text-base font-light leading-relaxed">{registration.full_name}</p>
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] tracking-[2px] uppercase text-[#777777]">Protocol Email</label>
          <p className="text-base font-light leading-relaxed break-all">{registration.email}</p>
        </div>
        {registration.team_name && (
          <div className="space-y-3">
            <label className="block text-[10px] tracking-[2px] uppercase text-[#777777]">Squad Identification</label>
            <p className="text-base font-light leading-relaxed">{registration.team_name}</p>
          </div>
        )}
        <div className="space-y-3">
          <label className="block text-[10px] tracking-[2px] uppercase text-[#777777]">Assigned Role</label>
          <div className="flex items-center gap-2.5 text-[#ff8c00]">
            <Layers className="w-4 h-4" />
            <p className="font-semibold text-base">{registration.team_role || 'Participant'}</p>
          </div>
        </div>
      </div>

      {/* Team Manifest Section */}
      {registration.participation_type === 'Team' && (
        <div className="mx-6 md:mx-10 mb-10 border border-[#1a1a1a]">
          <button
            onClick={() => setShowTeamDetails(!showTeamDetails)}
            className="w-full p-5 bg-[#0d0d0d] flex justify-between items-center cursor-pointer transition-colors hover:bg-[#111]"
          >
            <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white">
              <Users className="w-3.5 h-3.5" />
              Team Manifest
            </div>
            <div className="text-[10px] text-[#777777] flex items-center gap-2 uppercase tracking-wider">
              {completedCount + 1} REGISTERED / {pendingCount} PENDING 
              {showTeamDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </button>

          {showTeamDetails && (
            <div className="bg-[#050505] border-t border-[#1a1a1a]">
              {/* Leader (Current User) Row */}
              <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center gap-5 text-white">
                <div className="flex gap-4 items-start flex-1">
                  <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1 mt-0.5">01</div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">{registration.full_name} (Leader)</h4>
                    <p className="text-[12px] text-[#777777] break-all">{registration.email}</p>
                  </div>
                </div>
                <div className="text-[10px] tracking-[1px] uppercase text-[#00ff88]">Confirmed</div>
              </div>

              {/* Invited Members Rows */}
              {invitations.map((invite, index) => (
                <div key={invite.id} className="p-6 border-b border-[#1a1a1a] last:border-b-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 text-white">
                  <div className={cn("flex gap-4 items-start flex-1", invite.status === 'pending' && "opacity-50")}>
                    <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1 mt-0.5">
                      {String(index + 2).padStart(2, '0')}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{invite.invitee_name || 'Protocol Subject'}</h4>
                      <p className="text-[12px] text-[#777777] break-all">{invite.invitee_email}</p>
                    </div>
                  </div>
                  
                  {invite.status === 'completed' ? (
                    <div className="text-[10px] tracking-[1px] uppercase text-[#00ff88]">Confirmed</div>
                  ) : (
                    <button
                      onClick={() => resendInvitation(invite.id)}
                      disabled={resendingId === invite.id}
                      className="bg-transparent border border-[#1a1a1a] text-[#e0e0e0] px-3.5 py-2 text-[10px] uppercase tracking-[2px] flex items-center gap-2 cursor-pointer transition-all hover:border-[#ff8c00] hover:text-[#ff8c00] disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-2.5 h-2.5", resendingId === invite.id && "animate-spin")} />
                      Resend Protocol
                    </button>
                  )}
                </div>
              ))}
              
              {invitations.length === 0 && (
                 <div className="p-10 text-center text-[10px] uppercase tracking-[3px] text-[#777777]">
                    No invitations dispatched
                 </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Area */}
      <div className="px-6 md:px-10 pb-10 space-y-5">
        {isPaymentPending ? (
          <Button className="w-full bg-[#ff8c00] hover:bg-[#ff8c00] hover:brightness-110 text-black rounded-none py-8 text-sm font-extrabold uppercase tracking-[4px] transition-all">
            Complete Payment — {currency} {registrationFee}
          </Button>
        ) : (
          <div className="w-full border border-[#00ff88]/20 bg-[#00ff88]/5 py-6 text-center">
             <p className="text-[11px] tracking-[3px] uppercase text-[#00ff88] font-bold">Access Granted</p>
          </div>
        )}
        <p className="text-center text-[10px] tracking-[2px] text-[#777777] uppercase leading-relaxed">
          Finalize assembly access for {eventTitle}
        </p>
      </div>
    </div>
  );
}
