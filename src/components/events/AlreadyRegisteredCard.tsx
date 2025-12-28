import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Check, Users, RefreshCw, ChevronDown, ChevronUp, Layers, 
  UserPlus, Pencil, Trash2, ShieldCheck, QrCode, X, Info 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamInvitation {
  id: string;
  invitee_name: string;
  invitee_email: string;
  invitee_mobile: string | null;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'update_pending';
  created_at: string;
  pending_role?: string; // Hypothetical field for role changes needing acceptance
}

interface Registration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
  invited_by_registration_id: string | null;
  created_at: string;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  eventType: string; 
  isPaid: boolean;
  registrationFee?: number;
  currency?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  eventTitle, 
  isPaid,
  registrationFee,
  currency = 'INR',
  minTeamSize = 1,
  maxTeamSize = 4
}: AlreadyRegisteredCardProps) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  
  // Feature states
  const [isLeader, setIsLeader] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamInvitation | null>(null);
  const [showQR, setShowQR] = useState(false);

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
    const leaderStatus = !reg.invited_by_registration_id;
    setIsLeader(leaderStatus);

    // Fetch team context (all invitations linked to this team)
    const primaryId = reg.invited_by_registration_id || reg.id;
    
    if (reg.participation_type === 'Team') {
      const { data: invites } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('registration_id', primaryId)
        .order('created_at', { ascending: true });

      if (invites) setInvitations(invites as any);
    }

    setLoading(false);
  }

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (invitations.length + 1 >= maxTeamSize) {
      toast.error(`Team capacity reached (${maxTeamSize} max)`);
      return;
    }
    // API logic to insert into team_invitations
    toast.success("Invitation dispatched successfully!");
    setIsInviteOpen(false);
    fetchRegistration();
  };

  const handleRemoveMember = async (id: string) => {
    // Logic to delete invitation/registration
    setInvitations(prev => prev.filter(i => i.id !== id));
    toast.success("Member removed from squad");
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    // If leader updates a member, set status to update_pending
    toast.info("Update sent. Awaiting member acceptance.");
    setIsEditOpen(false);
  };

  if (loading) return <div className="p-10 border border-[#1a1a1a] animate-pulse bg-black h-64" />;
  if (!registration) return null;

  const isPaymentPending = isPaid && registration.payment_status === 'pending';
  const membersCount = invitations.length + 1;
  const qrValue = `${window.location.origin}/profile/${registration.user_id}?event=${eventId}`;

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* Header with QR Trigger */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Active Registry</span>
            <h2 className="font-serif text-3xl font-normal text-white">Access Granted</h2>
          </div>
        </div>
        <button 
          onClick={() => setShowQR(true)}
          className="p-3 border border-[#1a1a1a] hover:border-[#00ff88] text-[#777777] hover:text-[#00ff88] transition-all"
        >
          <QrCode className="w-5 h-5" />
        </button>
      </header>

      {/* Team Manifest */}
      {registration.participation_type === 'Team' && (
        <div className="mx-6 md:mx-10 my-10 border border-[#1a1a1a]">
          <div className="p-5 bg-[#0d0d0d] flex justify-between items-center border-b border-[#1a1a1a]">
            <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white font-bold">
              <Users className="w-3.5 h-3.5" />
              Squad Manifest ({membersCount}/{maxTeamSize})
            </div>
            {isLeader && membersCount < maxTeamSize && (
              <Button 
                onClick={() => setIsInviteOpen(true)}
                variant="outline" 
                className="h-8 text-[9px] uppercase tracking-widest rounded-none border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black"
              >
                <UserPlus className="w-3 h-3 mr-2" /> Invite
              </Button>
            )}
          </div>

          <div className="bg-[#050505]">
            {/* Leader Row */}
            <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center gap-5 text-white">
              <div className="flex gap-4 items-start flex-1">
                <div className="text-[10px] text-[#00ff88] border border-[#00ff88]/30 px-1.5 py-1">LEADER</div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{isLeader ? "You" : registration.full_name}</h4>
                  <p className="text-[11px] text-[#777777]">{registration.team_role}</p>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(true)} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
            </div>

            {/* Invitations/Members */}
            {invitations.map((invite, index) => {
              const canManage = isLeader || invite.invitee_email === registration.email;
              return (
                <div key={invite.id} className="p-6 border-b border-[#1a1a1a] last:border-b-0 flex justify-between items-center gap-5 text-white">
                  <div className="flex gap-4 items-start flex-1">
                    <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">{String(index + 2).padStart(2, '0')}</div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{invite.invitee_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#777777]">{invite.role}</span>
                        {invite.status === 'update_pending' && (
                          <span className="text-[9px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 uppercase tracking-tighter">Awaiting Acceptance</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {canManage && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setSelectedMember(invite); setIsEditOpen(true); }} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      {isLeader && (
                        <button onClick={() => handleRemoveMember(invite.id)} className="text-[#777777] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-sm">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="font-serif text-2xl">Squad Credential</DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-[2px] text-[#777777]">
              {eventTitle} Identification
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-[#1a1a1a] gap-6">
            <div className="bg-white p-4">
              <QRCodeSVG value={qrValue} size={180} level="H" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest text-[#00ff88]">{registration.full_name}</p>
              <p className="text-[10px] text-[#777777]">{registration.team_name || "Individual Participant"}</p>
            </div>
          </div>
          <Button onClick={() => setShowQR(false)} className="w-full bg-[#1a1a1a] hover:bg-[#222] rounded-none uppercase text-[10px] tracking-widest">Close Badge</Button>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Dispatch Invitation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-[#777777]">Member Identity (Full Name)</Label>
              <Input required placeholder="Ex: John Doe" className="bg-black border-[#1a1a1a] focus:border-[#00ff88] rounded-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-[#777777]">Protocol Email</Label>
              <Input type="email" required placeholder="member@example.com" className="bg-black border-[#1a1a1a] rounded-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-[#777777]">Assigned Squad Role</Label>
              <Input required placeholder="Ex: Frontend Developer" className="bg-black border-[#1a1a1a] rounded-none" />
            </div>
            <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12">Send Protocol</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info Badge */}
      <div className="px-10 pb-10">
        <div className="border border-[#1a1a1a] p-4 flex items-start gap-4 bg-[#0d0d0d]">
          <Info className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#777777] leading-relaxed uppercase tracking-wider">
            Changes to member details by the leader require acceptance from the target subject. Members can modify their own credentials independently.
          </p>
        </div>
      </div>
    </div>
  );
}
