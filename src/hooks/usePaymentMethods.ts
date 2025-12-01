import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'digital_wallet' | 'cash';
  provider?: string;
  last_four?: string;
  cardholder_name?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_active: boolean;
  wallet_id?: string;
}

export const usePaymentMethods = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
    } else {
      const typedData = (data || []) as PaymentMethod[];
      setPaymentMethods(typedData);
      const defaultPM = typedData.find(pm => pm.is_default);
      setDefaultMethod(defaultPM || null);
    }
    setLoading(false);
  };

  const addPaymentMethod = async (methodData: Partial<PaymentMethod>) => {
    if (!user) return { error: 'User not authenticated' as any };

    const insertData: any = { ...methodData, user_id: user.id };
    const { data, error } = await supabase
      .from('payment_methods')
      .insert(insertData)
      .select()
      .single();

    if (!error) {
      await fetchPaymentMethods();
    }

    return { data, error };
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    const { data, error } = await supabase
      .from('payment_methods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      await fetchPaymentMethods();
    }

    return { data, error };
  };

  const deletePaymentMethod = async (id: string) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      await fetchPaymentMethods();
    }

    return { error };
  };

  const setDefaultPaymentMethod = async (id: string) => {
    return await updatePaymentMethod(id, { is_default: true });
  };

  return {
    paymentMethods,
    defaultMethod,
    loading,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
  };
};
