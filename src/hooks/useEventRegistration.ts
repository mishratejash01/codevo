import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamInvitation {
  id: string;
  event_id: string;
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  role: string;
  status: string;
  registration_id: string | null;
  token?: string; 
}

export interface Registration {
  id: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
  user_id: string;
  full_name: string;
  email: string;
}

export interface RegistrationStatus {
  isRegistered: boolean;
  registration: Registration | null;
  hasPendingInvitation: boolean;
  hasAcceptedInvitation: boolean;
  invitation: TeamInvitation | null;
  loading: boolean;
  state: 'registered' | 'invited_pending' | 'invited_accepted' | 'none' | 'loading' | 'error';
}

export function useEventRegistration(eventId: string | undefined, refreshKey?: number): RegistrationStatus & { refetch: () => void } {
  const [status, setStatus] = useState<RegistrationStatus>({
    isRegistered: false,
    registration: null,
    hasPendingInvitation: false,
    hasAcceptedInvitation: false,
    invitation: null,
    loading: true,
    state: 'loading',
  });

  const checkRegistration = useCallback(async () => {
    if (!eventId) return;

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
          loading: false,
          state: 'none'
        });
        return;
      }

      const { data, error } = await supabase.rpc('get_my_event_access_status', {
        p_event_id: eventId
      });

      if (error) {
        console.error('Error checking status:', error);
        setStatus(prev => ({ ...prev, loading: false, state: 'error' }));
        return;
      }

      console.log('Status RPC:', data);
      const responseState = data.state as 'registered' | 'invited_pending' | 'invited_accepted' | 'none';

      setStatus({
        isRegistered: responseState === 'registered',
        registration: data.registration || null,
        hasPendingInvitation: responseState === 'invited_pending',
        hasAcceptedInvitation: responseState === 'invited_accepted',
        invitation: data.invitation || null,
        loading: false,
        state: responseState
      });

    } catch (err) {
      console.error('Error in checkRegistration:', err);
      setStatus(prev => ({ ...prev, loading: false, state: 'error' }));
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
