import { useState, useEffect, useCallback } from 'react';
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

interface Registration {
  id: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
}

interface RegistrationStatus {
  isRegistered: boolean;
  registration: Registration | null;
  hasPendingInvitation: boolean;
  hasAcceptedInvitation: boolean;
  invitation: TeamInvitation | null;
  loading: boolean;
}

interface RPCResponse {
  state: 'registered' | 'invited_pending' | 'invited_accepted' | 'none';
  registration: Registration | null;
  invitation: TeamInvitation | null;
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

  const checkRegistration = useCallback(async () => {
    // Wait for eventId to be available
    if (!eventId) {
      return;
    }

    // Set loading true before starting query
    setStatus(prev => ({ ...prev, loading: true }));

    try {
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

      // Use the RPC function as single source of truth
      const { data, error } = await supabase.rpc('get_my_event_access_status', {
        p_event_id: eventId
      });

      if (error) {
        console.error('Error checking event access status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = data as unknown as RPCResponse;
      
      console.log('[useEventRegistration] RPC response:', response);

      setStatus({
        isRegistered: response.state === 'registered',
        registration: response.registration,
        hasPendingInvitation: response.state === 'invited_pending',
        hasAcceptedInvitation: response.state === 'invited_accepted',
        invitation: response.invitation,
        loading: false,
      });

    } catch (err) {
      console.error('Error in checkRegistration:', err);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [eventId]);

  useEffect(() => {
    checkRegistration();
  }, [checkRegistration, refreshKey]);

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
        .ilike('invitee_email', session.user.email)
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
