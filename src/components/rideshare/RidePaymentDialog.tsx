import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface RidePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  amount: number;
}

export function RidePaymentDialog({
  open,
  onOpenChange,
  rideId,
  amount
}: RidePaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('ride_payments')
        .insert({
          ride_id: rideId,
          payer_id: user.id,
          amount,
          payment_method: paymentMethod,
          status: paymentMethod === 'cash' ? 'completed' : 'pending',
          completed_at: paymentMethod === 'cash' ? new Date().toISOString() : null
        });

      if (error) throw error;

      toast({
        title: 'Payment Processed',
        description: paymentMethod === 'cash' 
          ? 'Cash payment confirmed' 
          : 'Payment initiated successfully',
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
            <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <Label>Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="cash" id="cash" />
                <Banknote className="h-5 w-5" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">Cash</Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="h-5 w-5" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">Card</Label>
              </div>
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="wallet" id="wallet" />
                <Wallet className="h-5 w-5" />
                <Label htmlFor="wallet" className="flex-1 cursor-pointer">Digital Wallet</Label>
              </div>
            </RadioGroup>
          </div>

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
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
