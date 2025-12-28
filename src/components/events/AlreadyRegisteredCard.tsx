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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamInvitation {
  id: string;
  invitee_name: string;
  invitee_email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
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
  invited_by_registration_id: string | null;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  maxTeamSize?: number;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  eventTitle, 
  maxTeamSize = 4
}: AlreadyRegisteredCardProps) {
  const [currentUserReg, setCurrentUserReg] = useState<Registration | null>(null);
  const [leaderReg, setLeaderReg] = useState<Registration | null>(null);
  const [teamMembers, setTeamMembers] = useState<Registration[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  
  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; name: string; role: string; type: 'reg' | 'invite' } | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    fetchTeamData();
  }, [eventId]);

  async function fetchTeamData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }

    // 1. Fetch current user's registration
    const { data: reg } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!reg) { setLoading(false); return; }
    setCurrentUserReg(reg);
    
    const leaderId = reg.invited_by_registration_id || reg.id;
    setIsLeader(!reg.invited_by_registration_id);

    // 2. Fetch all team components relative to the Leader ID
    const [leaderRes, membersRes, invitesRes] = await Promise.all([
      supabase.from('event_registrations').select('*').eq('id', leaderId).single(),
      supabase.from('event_registrations').select('*').eq('invited_by_registration_id', leaderId),
      supabase.from('team_invitations').select('*').eq('registration_id', leaderId)
    ]);

    setLeaderReg(leaderRes.data);
    setTeamMembers(membersRes.data || []);
    setInvitations(invitesRes.data || []);
    setLoading(false);
  }

  const confirmedCount = teamMembers.length + 1; // Members + Leader
  const isTeamFull = confirmedCount >= maxTeamSize;

  const handleEditOpen = (id: string, name: string, role: string, type: 'reg' | 'invite') => {
    setEditingMember({ id, name, role, type });
    setIsEditOpen(true);
  };

  const saveMemberChanges = async () => {
    if (!editingMember) return;
    const table = editingMember.type === 'reg' ? 'event_registrations' : 'team_invitations';
    const payload = editingMember.type === 'reg' 
      ? { full_name: editingMember.name, team_role: editingMember.role }
      : { invitee_name: editingMember.name, role: editingMember.role };

    const { error } = await supabase.from(table).update(payload).eq('id', editingMember.id);
    
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Squad details updated");
      setIsEditOpen(false);
      fetchTeamData();
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('team_invitations').insert({
      registration_id: leaderReg?.id,
      event_id: eventId,
      inviter_user_id: session?.user.id,
      invitee_name: inviteForm.name,
      invitee_email: inviteForm.email,
      role: inviteForm.role,
      team_name: leaderReg?.team_name || 'Team',
      inviter_name: leaderReg?.full_name || 'Leader',
      inviter_email: leaderReg?.email || '',
      status: 'pending',
      token: crypto.randomUUID(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Invitation sent");
      setIsInviteOpen(false);
      setInviteForm({ name: '', email: '', role: '' });
      fetchTeamData();
    }
  };

  if (loading || !currentUserReg || !leaderReg) return null;

  // STATUS BLOCK COMPONENT
  const StatusBadge = ({ status }: { status: 'completed' | 'pending' | 'declined' | 'expired' | 'accepted' }) => {
    const isConfirmed = status === 'completed';
    const isPending = status === 'pending' || status === 'accepted';
    const isRejected = status === 'declined' || status === 'expired';

    return (
      <div className="flex items-center gap-3 px-3 py-1.5 border border-[#1a1a1a] bg-transparent">
        <div className="relative flex h-2 w-2">
          {isConfirmed && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75"></span>
          )}
          <span className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isConfirmed && "bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.8)]",
            isPending && "bg-yellow-500",
            isRejected && "bg-red-600"
          )}></span>
        </div>
        <span className="text-[10px] uppercase tracking-[1px] text-[#e0e0e0] font-medium">
          {isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Rejected'}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[700px] bg-[#0a0a0a] border border-[#1a1a1a] mx-auto font-sans overflow-hidden">
      {/* Header */}
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Registry Verified</span>
            <h2 className="font-serif text-3xl md:text-[2.4rem] font-normal leading-none text-white">Squad Manifest</h2>
          </div>
        </div>
        <button onClick={() => setShowQR(true)} className="w-[45px] h-[45px] border border-[#1a1a1a] flex items-center justify-center text-[#777777] hover:text-[#00ff88]">
          <QrCode className="w-5 h-5" />
        </button>
      </header>

      {/* Manifest Section */}
      <div className="mx-6 md:mx-10 my-10 border border-[#1a1a1a]">
        <button onClick={() => setShowTeamDetails(!showTeamDetails)} className="w-full p-5 bg-[#0d0d0d] flex justify-between items-center cursor-pointer transition-colors hover:bg-[#111]">
          <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white">
            <Users className="w-3.5 h-3.5" />
            Squad Capacity ({confirmedCount}/{maxTeamSize})
          </div>
          <div className="flex items-center gap-4">
             {isLeader && !isTeamFull && (
                <button onClick={(e) => { e.stopPropagation(); setIsInviteOpen(true); }} className="text-[9px] uppercase tracking-[2px] text-[#00ff88] border border-[#00ff88]/20 px-2 py-1 hover:bg-[#00ff88]/10">
                  + Add Member
                </button>
             )}
             {showTeamDetails ? <ChevronUp className="w-3 h-3 text-[#777777]" /> : <ChevronDown className="w-3 h-3 text-[#777777]" />}
          </div>
        </button>

        {showTeamDetails && (
          <div className="bg-[#050505] border-t border-[#1a1a1a] divide-y divide-[#1a1a1a]">
            {/* 1. Leader Row (Always First) */}
            <div className="p-6 flex justify-between items-center gap-5 text-white">
              <div className="flex gap-4 items-center flex-1">
                <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">01</div>
                <div>
                  <h4 className="text-sm font-medium">{leaderReg.full_name} (Leader)</h4>
                  <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{leaderReg.team_role || 'Squad Alpha'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <StatusBadge status="completed" />
                {isLeader && (
                  <button onClick={() => handleEditOpen(leaderReg.id, leaderReg.full_name, leaderReg.team_role, 'reg')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>

            {/* 2. Registered Members Row */}
            {teamMembers.map((member, idx) => (
              <div key={member.id} className="p-6 flex justify-between items-center gap-5 text-white">
                <div className="flex gap-4 items-center flex-1">
                  <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">{String(idx + 2).padStart(2, '0')}</div>
                  <div>
                    <h4 className="text-sm font-medium">{member.full_name}</h4>
                    <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{member.team_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBadge status="completed" />
                  {(isLeader || member.user_id === currentUserReg.user_id) && (
                    <button onClick={() => handleEditOpen(member.id, member.full_name, member.team_role, 'reg')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            ))}

            {/* 3. Pending/Rejected Invitations Row */}
            {invitations.filter(inv => inv.status !== 'completed').map((invite) => {
              const showToAll = invite.status === 'pending' || invite.status === 'accepted';
              // If rejected/expired, only the Leader sees it. Confirmed/Pending are seen by everyone.
              if (!isLeader && !showToAll) return null;

              return (
                <div key={invite.id} className="p-6 flex justify-between items-center gap-5 text-white bg-white/[0.02]">
                  <div className="flex gap-4 items-center flex-1 opacity-60">
                    <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">--</div>
                    <div>
                      <h4 className="text-sm font-medium">{invite.invitee_name}</h4>
                      <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{invite.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <StatusBadge status={invite.status as any} />
                    {isLeader && (
                      <button onClick={() => handleEditOpen(invite.id, invite.invitee_name, invite.role, 'invite')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit & Invite Modals (Dialogs remain standard from previous steps) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Modify Registry</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Full Name</Label>
              <Input value={editingMember?.name || ''} onChange={e => setEditingMember(p => p ? {...p, name: e.target.value} : null)} className="bg-black border-[#1a1a1a] rounded-none focus:border-[#00ff88] h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Role</Label>
              <Input value={editingMember?.role || ''} onChange={e => setEditingMember(p => p ? {...p, role: e.target.value} : null)} className="bg-black border-[#1a1a1a] rounded-none focus:border-[#00ff88] h-12" />
            </div>
            <Button onClick={saveMemberChanges} className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12">Save Profile</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Squad Expansion</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-6 pt-4">
            <Input required placeholder="Subject Name" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Input required type="email" placeholder="Registry Email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Input required placeholder="Role" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12">Dispatch Invitation</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Badge Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-sm">
          <DialogHeader className="items-center"><DialogTitle className="font-serif text-2xl">Squad Credential</DialogTitle></DialogHeader>
          <div className="bg-white p-4 mx-auto my-6">
            <QRCodeSVG value={`${window.location.origin}/verify/${currentUserReg.id}`} size={200} level="H" />
          </div>
          <div className="text-center pb-4">
             <p className="text-sm font-medium uppercase tracking-widest">{currentUserReg.full_name}</p>
             <p className="text-[10px] text-[#777777] uppercase tracking-widest">{currentUserReg.team_name || 'Individual'}</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="px-6 md:px-10 pb-10">
        <div className="border border-[#1a1a1a] p-4 bg-[#0d0d0d] flex items-start gap-4">
          <Info className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#777777] leading-relaxed uppercase tracking-wider">
            {isTeamFull ? "Squad full. No further capacity available." : `Accepting members until ${maxTeamSize} confirmed registrations are reached.`}
          </p>
        </div>
      </div>
    </div>
  );
}
