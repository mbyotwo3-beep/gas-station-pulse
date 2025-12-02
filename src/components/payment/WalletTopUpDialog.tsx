import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Wallet, CreditCard } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import PaymentMethodSelector from './PaymentMethodSelector';

interface WalletTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function WalletTopUpDialog({ open, onOpenChange }: WalletTopUpDialogProps) {
  const { addFunds } = useWallet();
  const { paymentMethods, fetchPaymentMethods } = usePaymentMethods();
  const [amount, setAmount] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>();
  const [processing, setProcessing] = useState(false);

  // Filter out cash - can't top up with cash
  const validMethods = paymentMethods.filter(pm => pm.type !== 'cash');

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedMethodId) {
      toast({
        title: 'Select payment method',
        description: 'Please select a payment method to add funds',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    const result = await addFunds(numAmount, selectedMethodId);
    setProcessing(false);

    if (result.success) {
      toast({
        title: 'Funds added',
        description: `$${numAmount.toFixed(2)} has been added to your wallet`
      });
      setAmount('');
      onOpenChange(false);
    } else {
      toast({
        title: 'Top-up failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Add Funds to Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Select Amount</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="Enter custom amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            {validMethods.length > 0 ? (
              <PaymentMethodSelector
                paymentMethods={validMethods}
                selectedMethodId={selectedMethodId}
                onSelectMethod={setSelectedMethodId}
                onMethodAdded={fetchPaymentMethods}
                allowCash={false}
              />
            ) : (
              <div className="text-center py-4 border rounded-lg border-dashed">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add a payment method to top up your wallet
                </p>
              </div>
            )}
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
              onClick={handleTopUp}
              disabled={processing || !amount || !selectedMethodId}
              className="flex-1"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add ${amount || '0.00'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
