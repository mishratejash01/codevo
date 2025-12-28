import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Check, Users, ChevronDown, ChevronUp, 
  Pencil, Trash2, QrCode, Info, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  invitee_name: string | null;
  invitee_email: string;
  role: string | null;
  status: string | null;
  created_at: string | null;
  event_id: string;
  token: string;
}

interface Registration {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status?: string;
  invited_by_registration_id: string | null;
  avatar_url?: string | null;
  github_link?: string | null;
  linkedin_link?: string | null;
}

interface AlreadyRegisteredCardProps {
  eventId: string;
  eventTitle: string;
  maxTeamSize?: number;
  isPaid?: boolean;
  registrationFee?: number;
  currency?: string;
}

export function AlreadyRegisteredCard({ 
  eventId, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  eventTitle, 
  maxTeamSize = 4,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPaid,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registrationFee,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currency
}: AlreadyRegisteredCardProps) {
  const [currentUserReg, setCurrentUserReg] = useState<Registration | null>(null);
  const [leaderReg, setLeaderReg] = useState<Registration | null>(null);
  const [teamMembers, setTeamMembers] = useState<Registration[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showTeamDetails, setShowTeamDetails] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [editingMember, setEditingMember] = useState<{ id: string; name: string; role: string; type: 'reg' | 'invite' } | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    fetchTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function fetchTeamData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      // 1. Get Current User's Registration
      const { data: myReg, error: myRegError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (myRegError || !myReg) { 
        console.error("My Reg Fetch Error:", myRegError);
        setLoading(false); 
        return; 
      }
      
      setCurrentUserReg(myReg as any);

      // 2. Fetch Team Members via RPC
      if (myReg.participation_type === 'Team' && myReg.team_name) {
        const { data: allMembers, error: rpcError } = await supabase.rpc('get_event_team_members', {
          p_event_id: eventId,
          p_team_name: myReg.team_name
        });

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          setLeaderReg(myReg as any);
          setIsLeader(true); 
        } else if (allMembers && allMembers.length > 0) {
          const leader = allMembers.find((m: any) => m.team_role === 'Leader') || 
                         allMembers.find((m: any) => !m.invited_by_registration_id) || 
                         allMembers[0];
                         
          const members = allMembers.filter((m: any) => m.id !== leader.id);

          setLeaderReg(leader as any);
          setTeamMembers(members as any);
          
          const amILeader = leader.user_id === session.user.id;
          setIsLeader(amILeader);

          // 3. Fetch Invitations
          const { data: invites } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('event_id', eventId)
            // Loose match for invitations too
            .ilike('team_name', myReg.team_name.trim());

          setInvitations(invites as TeamInvitation[] || []);
        } else {
           setLeaderReg(myReg as any);
           setTeamMembers([]);
           setIsLeader(true);
        }
      } else {
        setLeaderReg(myReg as any);
        setTeamMembers([]);
        setIsLeader(true);
      }
    } catch (err) {
      console.error("Critical error in fetchTeamData:", err);
    } finally {
      setLoading(false);
    }
  }

  const confirmedCount = teamMembers.length + 1;
  const isTeamFull = confirmedCount >= maxTeamSize;

  const handleDeleteInvitation = async (inviteId: string) => {
    const { error } = await supabase.from('team_invitations').delete().eq('id', inviteId);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success("Invitation removed");
      fetchTeamData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from('event_registrations').delete().eq('id', memberId);
    if (error) {
      toast.error("Remove failed: " + error.message);
    } else {
      toast.success("Team member removed");
      fetchTeamData();
    }
  };

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
      toast.success("Details updated");
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
      invitee_email: inviteForm.email.toLowerCase().trim(),
      role: inviteForm.role,
      team_name: leaderReg?.team_name?.trim() || 'Team',
      inviter_name: leaderReg?.full_name || 'Leader',
      inviter_email: leaderReg?.email || '',
      status: 'pending',
      token: crypto.randomUUID(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Invitation sent successfully");
      setIsInviteOpen(false);
      setInviteForm({ name: '', email: '', role: '' });
      fetchTeamData();
    }
  };

  if (loading) return (
    <div className="w-full h-[200px] flex items-center justify-center border border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff8c00]"></div>
    </div>
  );

  if (!currentUserReg || !leaderReg) return null;

  const StatusBadge = ({ status }: { status: string }) => {
    const isConfirmed = status === 'completed' || status === 'confirmed';
    const isPending = status === 'pending' || status === 'accepted' || status === 'pending_payment';
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
      <header className="p-6 md:p-10 border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="flex items-center gap-5">
          <div className="w-[50px] h-[50px] border border-[#00ff88] rounded-full flex items-center justify-center text-[#00ff88]">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] tracking-[3px] uppercase text-[#777777] block">Registry Verified</span>
            <h2 className="font-serif text-3xl md:text-[2.4rem] font-normal leading-none text-white">
              {currentUserReg.team_name || 'Solo Entry'}
            </h2>
          </div>
        </div>
        <button onClick={() => setShowQR(true)} className="w-[45px] h-[45px] border border-[#1a1a1a] flex items-center justify-center text-[#777777] hover:text-[#00ff88] transition-colors">
          <QrCode className="w-5 h-5" />
        </button>
      </header>

      <div className="mx-6 md:mx-10 my-10 border border-[#1a1a1a]">
        <button onClick={() => setShowTeamDetails(!showTeamDetails)} className="w-full p-5 bg-[#0d0d0d] flex justify-between items-center cursor-pointer hover:bg-[#111]">
          <div className="text-[11px] tracking-[2px] uppercase flex items-center gap-3 text-white">
            <Users className="w-3.5 h-3.5" />
            Squad Manifest ({confirmedCount}/{maxTeamSize})
          </div>
          <div className="flex items-center gap-4">
             {isLeader && !isTeamFull && currentUserReg.participation_type === 'Team' && (
                <button onClick={(e) => { e.stopPropagation(); setIsInviteOpen(true); }} className="text-[9px] uppercase tracking-[2px] text-[#00ff88] border border-[#00ff88]/20 px-2 py-1 hover:bg-[#00ff88]/10">
                  + Add Member
                </button>
             )}
             {showTeamDetails ? <ChevronUp className="w-3 h-3 text-[#777777]" /> : <ChevronDown className="w-3 h-3 text-[#777777]" />}
          </div>
        </button>

        {showTeamDetails && (
          <div className="bg-[#050505] border-t border-[#1a1a1a] divide-y divide-[#1a1a1a]">
            <div className="p-6 flex justify-between items-center gap-5 text-white">
              <div className="flex gap-4 items-center flex-1">
                <Avatar className="h-9 w-9 border border-[#1a1a1a]">
                  <AvatarImage src={leaderReg.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#1a1a1a] text-[#666666] text-xs">
                    {leaderReg.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {leaderReg.full_name} 
                    <span className="text-[9px] bg-[#ff8c00]/10 text-[#ff8c00] px-1 rounded border border-[#ff8c00]/20">LEADER</span>
                  </h4>
                  <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{leaderReg.team_role || 'Squad Alpha'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <StatusBadge status="completed" />
                {isLeader && (
                  <button onClick={() => handleEditOpen(leaderReg.id, leaderReg.full_name, leaderReg.team_role, 'reg')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                )}
                {leaderReg.github_link && (
                  <a href={leaderReg.github_link} target="_blank" rel="noreferrer" className="text-[#777777] hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
                )}
              </div>
            </div>

            {teamMembers.map((member) => (
              <div key={member.id} className="p-6 flex justify-between items-center gap-5 text-white">
                <div className="flex gap-4 items-center flex-1">
                  <Avatar className="h-9 w-9 border border-[#1a1a1a]">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#1a1a1a] text-[#666666] text-xs">
                      {member.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-medium">{member.full_name}</h4>
                    <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{member.team_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status="completed" />
                  
                  {(isLeader || member.user_id === currentUserReg.user_id) && (
                    <button onClick={() => handleEditOpen(member.id, member.full_name, member.team_role, 'reg')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  )}
                  
                  {isLeader && (
                    <button onClick={() => handleRemoveMember(member.id)} className="text-[#777777] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}

                  {member.github_link && (
                    <a href={member.github_link} target="_blank" rel="noreferrer" className="text-[#777777] hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              </div>
            ))}

            {isLeader && invitations.filter(inv => inv.status !== 'completed').map((invite) => (
              <div key={invite.id} className="p-6 flex justify-between items-center gap-5 text-white bg-white/[0.02]">
                <div className="flex gap-4 items-center flex-1 opacity-60">
                  <div className="text-[10px] text-[#777777] border border-[#1a1a1a] px-1.5 py-1">INVITE</div>
                  <div>
                    <h4 className="text-sm font-medium">{invite.invitee_name || invite.invitee_email}</h4>
                    <p className="text-[11px] text-[#777777] uppercase tracking-tighter">{invite.role || 'Member'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={invite.status || 'pending'} />
                  <button onClick={() => handleEditOpen(invite.id, invite.invitee_name || '', invite.role || 'Member', 'invite')} className="text-[#777777] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteInvitation(invite.id)} className="text-[#777777] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Modify Registry</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Identity Name</Label>
              <Input value={editingMember?.name || ''} onChange={e => setEditingMember(p => p ? {...p, name: e.target.value} : null)} className="bg-black border-[#1a1a1a] rounded-none focus:border-[#00ff88] h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-[#777777]">Role</Label>
              <Input value={editingMember?.role || ''} onChange={e => setEditingMember(p => p ? {...p, role: e.target.value} : null)} className="bg-black border-[#1a1a1a] rounded-none focus:border-[#00ff88] h-12" />
            </div>
            <Button onClick={saveMemberChanges} className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12 hover:bg-[#00ff88]/90">Apply Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Squad Expansion</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-6 pt-4">
            <Input required placeholder="Subject Name" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Input required type="email" placeholder="Registry Email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Input required placeholder="Designated Role" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="bg-black border-[#1a1a1a] rounded-none h-12 focus:border-[#00ff88]" />
            <Button type="submit" className="w-full bg-[#00ff88] text-black font-bold uppercase tracking-widest rounded-none h-12">Dispatch Invitation</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-sm">
          <DialogHeader className="items-center"><DialogTitle className="font-serif text-2xl">Squad Credential</DialogTitle></DialogHeader>
          <div className="bg-white p-4 mx-auto my-6"><QRCodeSVG value={`${window.location.origin}/verify/${currentUserReg.id}`} size={200} level="H" /></div>
          <p className="text-center text-sm font-medium uppercase tracking-widest">{currentUserReg.full_name}</p>
        </DialogContent>
      </Dialog>

      <div className="px-6 md:px-10 pb-10">
        <div className="border border-[#1a1a1a] p-4 bg-[#0d0d0d] flex items-start gap-4">
          <Info className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#777777] leading-relaxed uppercase tracking-wider">
            {isTeamFull ? "Squad full. No further capacity available." : `Confirmations accepted until ${maxTeamSize} registered members are reached.`}
          </p>
        </div>
      </div>
    </div>
  );
}
