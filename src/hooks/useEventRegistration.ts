import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TeamInvitation {
  id: string;
  event_id: string;
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  role: string;
  status: string;
  registration_id: string | null;
}

interface RegistrationStatus {
  isRegistered: boolean;
  registration: {
    id: string;
    team_name: string | null;
    team_role: string;
    participation_type: string;
    payment_status: string;
    status: string;
  } | null;
  hasPendingInvitation: boolean;
  hasAcceptedInvitation: boolean;
  invitation: TeamInvitation | null;
  loading: boolean;
}

export function useEventRegistration(eventId: string | undefined, refreshKey?: number): RegistrationStatus & { refetch: () => void } {
  const [status, setStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    registration: null,
    hasPendingInvitation: false,
    hasAcceptedInvitation: false,
    invitation: null,
    loading: true,
  });

  const checkRegistration = async () => {
    if (!eventId) {
      setStatus({ 
        isRegistered: false, 
        registration: null, 
        hasPendingInvitation: false,
        hasAcceptedInvitation: false,
        invitation: null,
        loading: false 
      });
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setStatus({ 
        isRegistered: false, 
        registration: null, 
        hasPendingInvitation: false,
        hasAcceptedInvitation: false,
        invitation: null,
        loading: false 
      });
      return;
    }

    // First check if user has their own registration
    const { data: registrationData, error: regError } = await supabase
      .from('event_registrations')
      .select('id, team_name, team_role, participation_type, payment_status, status')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!regError && registrationData) {
      setStatus({
        isRegistered: true,
        registration: registrationData as any,
        hasPendingInvitation: false,
        hasAcceptedInvitation: false,
        invitation: null,
        loading: false,
      });
      return;
    }

    // Check for pending or accepted invitations by email
    const userEmail = session.user.email?.toLowerCase();
    if (userEmail) {
      const { data: invitationData, error: invError } = await supabase
        .from('team_invitations')
        .select('id, event_id, team_name, inviter_name, inviter_email, role, status, registration_id')
        .eq('event_id', eventId)
        .eq('invitee_email', userEmail)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (!invError && invitationData) {
        setStatus({
          isRegistered: false,
          registration: null,
          hasPendingInvitation: invitationData.status === 'pending',
          hasAcceptedInvitation: invitationData.status === 'accepted',
          invitation: invitationData as TeamInvitation,
          loading: false,
        });
        return;
      }
    }

    // No registration or invitation found
    setStatus({ 
      isRegistered: false, 
      registration: null, 
      hasPendingInvitation: false,
      hasAcceptedInvitation: false,
      invitation: null,
      loading: false 
    });
  };

  useEffect(() => {
    checkRegistration();
  }, [eventId, refreshKey]);

  return { ...status, refetch: checkRegistration };
}

export function useCheckPendingInvitations() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('team_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('invitee_email', session.user.email.toLowerCase())
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingCount(count);
      }
      setLoading(false);
    }

    check();
  }, []);

  return { pendingCount, loading };
}
