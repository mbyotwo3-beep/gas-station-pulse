import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
    } else {
      setWallet(null);
      setLoading(false);
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching wallet:', error);
    } else if (data) {
      setWallet(data as Wallet);
    } else {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (!createError && newWallet) {
        setWallet(newWallet as Wallet);
      }
    }
    setLoading(false);
  };

  const addFunds = async (amount: number, paymentMethodId?: string) => {
    if (!user || !wallet) return { success: false, error: 'No wallet found' };

    // Call the database function
    const { data, error } = await supabase.rpc('add_wallet_funds', {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_method_id: paymentMethodId || null
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Create transaction record
    await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_type: 'top_up',
      service_type: 'ride',
      amount,
      currency: 'USD',
      status: 'completed',
      payment_method_id: paymentMethodId,
      description: `Wallet top-up - $${amount.toFixed(2)}`,
      completed_at: new Date().toISOString()
    });

    await fetchWallet();
    return { success: true };
  };

  const deductFunds = async (amount: number, description?: string, rideId?: string, orderId?: string) => {
    if (!user || !wallet) return { success: false, error: 'No wallet found' };

    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { data, error } = await supabase.rpc('deduct_wallet_funds', {
      p_user_id: user.id,
      p_amount: amount
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to deduct funds' };
    }

    // Create transaction record
    await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_type: 'payment',
      service_type: rideId ? 'ride' : orderId ? 'food_delivery' : 'ride',
      amount,
      currency: 'USD',
      status: 'completed',
      payment_method_type: 'wallet',
      ride_id: rideId,
      order_id: orderId,
      description: description || `Wallet payment - $${amount.toFixed(2)}`,
      completed_at: new Date().toISOString()
    });

    await fetchWallet();
    return { success: true };
  };

  const transferFunds = async (toUserId: string, amount: number, description?: string) => {
    if (!user || !wallet) return { success: false, error: 'No wallet found' };

    if (wallet.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { data, error } = await supabase.rpc('transfer_wallet_funds', {
      p_from_user_id: user.id,
      p_to_user_id: toUserId,
      p_amount: amount,
      p_description: description
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchWallet();
    return { success: true };
  };

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    loading,
    fetchWallet,
    addFunds,
    deductFunds,
    transferFunds
  };
};
