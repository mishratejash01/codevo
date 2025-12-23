import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Mail, CheckCircle2, X, ChevronRight, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PendingInvitation {
  id: string;
  event_id: string;
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  role: string;
  token: string;
  created_at: string;
  registration_id: string | null;
  event?: {
    title: string;
    slug: string;
    image_url: string;
    start_date: string;
  };
}

interface PendingInvitationCardProps {
  invitation: PendingInvitation;
  eventTitle: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function PendingInvitationCard({ 
  invitation, 
  eventTitle,
  onAccept,
  onDecline 
}: PendingInvitationCardProps) {
  const [processing, setProcessing] = useState(false);

  async function handleResponse(accept: boolean) {
    setProcessing(true);
    
    const { error } = await supabase
      .from('team_invitations')
      .update({
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (error) {
      toast.error("Failed to respond to invitation");
      setProcessing(false);
      return;
    }

    if (accept) {
      toast.success("Invitation accepted! Complete your registration below.");
      onAccept();
    } else {
      toast.info("Invitation declined");
      onDecline();
    }
    
    setProcessing(false);
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Mail className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">You're Invited!</h3>
            <p className="text-sm text-purple-400">{eventTitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <p className="text-zinc-400 mb-1">
            <strong className="text-white">{invitation.inviter_name}</strong> wants you to join
          </p>
          <p className="text-2xl font-bold text-purple-400">{invitation.team_name}</p>
          <p className="text-sm text-zinc-500 mt-2">as a <strong>{invitation.role}</strong></p>
        </div>

        <div className="text-center text-sm text-zinc-500">
          <p>Accept to join the team and complete your registration.</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => handleResponse(false)}
            disabled={processing}
          >
            <X className="w-4 h-4 mr-2" /> Decline
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            onClick={() => handleResponse(true)}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Accept & Join
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InvitationBanner() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<PendingInvitation | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  async function fetchPendingInvitations() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        event:events(title, slug, image_url, start_date)
      `)
      .eq('invitee_email', session.user.email.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvitations(data as any);
    }
    setLoading(false);
  }

  async function handleResponse(invitationId: string, accept: boolean) {
    setProcessing(true);
    
    const { error } = await supabase
      .from('team_invitations')
      .update({
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (error) {
      toast.error("Failed to respond to invitation");
      setProcessing(false);
      return;
    }

    if (accept) {
      toast.success("Invitation accepted! Complete your registration on the event page.");
    } else {
      toast.info("Invitation declined");
    }

    setSelectedInvite(null);
    setProcessing(false);
    fetchPendingInvitations();
  }

  if (loading || invitations.length === 0) return null;

  return (
    <>
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
            <Mail className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-bold text-white">
              You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}!
            </h3>
            <p className="text-sm text-purple-300 truncate">
              {invitations[0].inviter_name} invited you to join <strong>{invitations[0].team_name}</strong>
            </p>
          </div>
          <Button 
            onClick={() => setSelectedInvite(invitations[0])}
            className="bg-white text-black hover:bg-gray-200 shrink-0"
          >
            View <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Mini preview of other invitations */}
        {invitations.length > 1 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            {invitations.slice(1).map((invite) => (
              <button
                key={invite.id}
                onClick={() => setSelectedInvite(invite)}
                className="flex items-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg px-3 py-2 text-xs transition-colors shrink-0"
              >
                <Users className="w-3 h-3 text-purple-400" />
                <span className="text-zinc-300">{invite.team_name}</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                  {invite.event?.title?.slice(0, 15)}...
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invitation Detail Modal */}
      <Dialog open={!!selectedInvite} onOpenChange={() => setSelectedInvite(null)}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-zinc-900 to-black border border-purple-500/20 text-white p-0 gap-0">
          {selectedInvite && (
            <>
              {/* Header with Event Image */}
              {selectedInvite.event?.image_url && (
                <div className="h-40 relative overflow-hidden">
                  <img 
                    src={selectedInvite.event.image_url} 
                    alt="" 
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <Badge className="bg-purple-500/80 mb-2">
                      <Trophy className="w-3 h-3 mr-1" /> Hackathon
                    </Badge>
                    <h3 className="text-xl font-bold">{selectedInvite.event?.title}</h3>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                      <Users className="w-8 h-8 text-purple-400" />
                    </div>
                    <span className="block text-xl">You've been invited!</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-zinc-400 mb-1">
                    <strong className="text-white">{selectedInvite.inviter_name}</strong> wants you to join
                  </p>
                  <p className="text-2xl font-bold text-purple-400">{selectedInvite.team_name}</p>
                  <p className="text-sm text-zinc-500 mt-2">as a <strong>{selectedInvite.role}</strong></p>
                </div>

                <div className="text-center text-sm text-zinc-500">
                  <p>By accepting, you'll join the team for this hackathon.</p>
                  <p>You'll need to complete your registration details.</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => handleResponse(selectedInvite.id, false)}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-2" /> Decline
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                    onClick={() => handleResponse(selectedInvite.id, true)}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Accept & Join
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
