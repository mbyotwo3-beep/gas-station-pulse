import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DollarSign, Loader2 } from 'lucide-react';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useWallet } from '@/hooks/useWallet';

interface RidePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  amount: number;
  onSuccess?: () => void;
}

export function RidePaymentDialog({
  open,
  onOpenChange,
  rideId,
  amount,
  onSuccess
}: RidePaymentDialogProps) {
  const { user } = useAuth();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const { balance, deductFunds } = useWallet();
  const [selectedMethodId, setSelectedMethodId] = useState<string>();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      // Default to wallet if sufficient balance
      if (balance >= amount) {
        setSelectedMethodId('wallet');
      } else if (paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find(pm => pm.is_default);
        setSelectedMethodId(defaultMethod?.id || paymentMethods[0]?.id);
      }
    }
  }, [open, paymentMethods, balance, amount]);

  const handlePayment = async () => {
    if (!user || !selectedMethodId) return;

    setProcessing(true);
    try {
      // Handle wallet payment
      if (selectedMethodId === 'wallet') {
        const result = await deductFunds(amount, `Ride payment - $${amount.toFixed(2)}`, rideId);
        if (!result.success) {
          throw new Error(result.error || 'Insufficient wallet balance');
        }

        // Create ride payment record
        const { error: paymentError } = await supabase
          .from('ride_payments')
          .insert({
            ride_id: rideId,
            payer_id: user.id,
            amount,
            payment_method: 'wallet',
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        if (paymentError) throw paymentError;

        // Update ride payment status
        await supabase
          .from('rides')
          .update({ payment_status: 'completed' })
          .eq('id', rideId);

        toast({
          title: 'Payment successful',
          description: `Paid $${amount.toFixed(2)} from wallet`,
        });
      } else {
        // Handle other payment methods
        const selectedMethod = paymentMethods.find(pm => pm.id === selectedMethodId);
        if (!selectedMethod) throw new Error('Payment method not found');

        // Create payment record
        const { error: paymentError } = await supabase
          .from('ride_payments')
          .insert({
            ride_id: rideId,
            payer_id: user.id,
            amount,
            payment_method: selectedMethod.type,
            status: 'completed',
            completed_at: new Date().toISOString()
          });

        if (paymentError) throw paymentError;

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            transaction_type: 'payment',
            service_type: 'ride',
            amount,
            currency: 'USD',
            status: 'completed',
            payment_method_id: selectedMethodId,
            payment_method_type: selectedMethod.type,
            ride_id: rideId,
            description: `Payment for ride - $${amount.toFixed(2)}`,
            completed_at: new Date().toISOString()
          });

        if (transactionError) throw transactionError;

        // Update ride payment status
        await supabase
          .from('rides')
          .update({ payment_status: 'completed' })
          .eq('id', rideId);

        toast({
          title: 'Payment successful',
          description: `Paid $${amount.toFixed(2)} via ${selectedMethod.type.replace('_', ' ')}`,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Payment failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const canPayWithWallet = balance >= amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>

          <PaymentMethodSelector
            paymentMethods={paymentMethods}
            selectedMethodId={selectedMethodId}
            onSelectMethod={setSelectedMethodId}
            onMethodAdded={fetchPaymentMethods}
            allowCash={true}
            showWalletOption={true}
            walletBalance={balance}
          />

          {selectedMethodId === 'wallet' && !canPayWithWallet && (
            <p className="text-sm text-destructive">
              Insufficient wallet balance. Please add funds or select another method.
            </p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing || !selectedMethodId || (selectedMethodId === 'wallet' && !canPayWithWallet)}
              className="flex-1"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pay ${amount.toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
