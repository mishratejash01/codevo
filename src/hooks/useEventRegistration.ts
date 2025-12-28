import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// --- Interfaces (Restored to prevent TS errors in components) ---
export interface TeamInvitation {
  id: string;
  event_id: string;
  team_name: string;
  inviter_name: string;
  inviter_email: string;
  role: string;
  status: string;
  registration_id: string | null;
  token?: string; // Added optional token as it comes from RPC
}

export interface Registration {
  id: string;
  team_name: string | null;
  team_role: string;
  participation_type: string;
  payment_status: string;
  status: string;
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

// --- Main Hook: useEventRegistration ---
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
    // 1. Basic validation
    if (!eventId) return;

    setStatus(prev => ({ ...prev, loading: true }));

    try {
      // 2. Check Session
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

      // 3. Call the SAFE RPC function (The Fix)
      const { data, error } = await supabase.rpc('get_my_event_access_status', {
        p_event_id: eventId
      });

      if (error) {
        console.error('Error checking event access status:', error);
        setStatus(prev => ({ ...prev, loading: false, state: 'error' }));
        return;
      }

      // 4. Map RPC response to your App's expected format
      // The RPC returns { state: string, registration: object, invitation: object }
      const responseState = data.state as 'registered' | 'invited_pending' | 'invited_accepted' | 'none';
      
      console.log('[useEventRegistration] RPC response:', data);

      setStatus({
        isRegistered: responseState === 'registered',
        registration: data.registration || null,
        hasPendingInvitation: responseState === 'invited_pending',
        hasAcceptedInvitation: responseState === 'invited_accepted', // New state logic support
        invitation: data.invitation || null,
        loading: false,
        state: responseState
      });

    } catch (err) {
      console.error('Error in checkRegistration:', err);
      setStatus(prev => ({ ...prev, loading: false, state: 'error' }));
    }
  }, [eventId]);

  // 5. Trigger on mount or refreshKey change
  useEffect(() => {
    checkRegistration();
  }, [checkRegistration, refreshKey]);

  return { ...status, refetch: checkRegistration };
}

// --- Secondary Hook: useCheckPendingInvitations (Restored) ---
// This was missing in the previous step but is needed for your header/dashboard notifications
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

      // Simple count query - this should be safe now with the new RLS policies
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
