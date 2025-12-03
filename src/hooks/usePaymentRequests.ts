import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useWallet } from './useWallet';

export interface PaymentRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at?: string;
  from_profile?: {
    display_name?: string;
    email?: string;
  };
  to_profile?: {
    display_name?: string;
    email?: string;
  };
}

export const usePaymentRequests = () => {
  const { user } = useAuth();
  const { transferFunds } = useWallet();
  const [incomingRequests, setIncomingRequests] = useState<PaymentRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
      setupRealtimeSubscription();
    } else {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('payment-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
          filter: `to_user_id=eq.${user.id}`
        },
        () => {
          fetchRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
          filter: `from_user_id=eq.${user.id}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch incoming requests (requests TO this user)
    const { data: incoming, error: incomingError } = await supabase
      .from('payment_requests')
      .select(`
        *,
        from_profile:profiles!payment_requests_from_user_id_fkey(display_name, email)
      `)
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false });

    if (incomingError) {
      console.error('Error fetching incoming requests:', incomingError);
    } else {
      setIncomingRequests((incoming || []) as PaymentRequest[]);
    }

    // Fetch outgoing requests (requests FROM this user)
    const { data: outgoing, error: outgoingError } = await supabase
      .from('payment_requests')
      .select(`
        *,
        to_profile:profiles!payment_requests_to_user_id_fkey(display_name, email)
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false });

    if (outgoingError) {
      console.error('Error fetching outgoing requests:', outgoingError);
    } else {
      setOutgoingRequests((outgoing || []) as PaymentRequest[]);
    }

    setLoading(false);
  };

  const createRequest = async (
    toUserId: string,
    amount: number,
    description?: string
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('payment_requests').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      amount,
      description
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchRequests();
    return { success: true };
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Get the request details
    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    // Transfer the funds
    const transferResult = await transferFunds(
      request.from_user_id,
      request.amount,
      request.description || `Payment for request`
    );

    if (!transferResult.success) {
      return { success: false, error: transferResult.error };
    }

    // Update the request status
    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'accepted',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchRequests();
    return { success: true };
  };

  const declineRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'declined',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchRequests();
    return { success: true };
  };

  const cancelRequest = async (requestId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('payment_requests')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchRequests();
    return { success: true };
  };

  return {
    incomingRequests,
    outgoingRequests,
    loading,
    fetchRequests,
    createRequest,
    acceptRequest,
    declineRequest,
    cancelRequest
  };
};
