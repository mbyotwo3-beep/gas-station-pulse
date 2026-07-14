import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Wallet, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WalletTopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function WalletTopUpDialog({ open, onOpenChange }: WalletTopUpDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const handleDpoTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter an amount greater than 0', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    const redirectUrl = `${window.location.origin}/payments/dpo-return`;
    const { data, error } = await supabase.functions.invoke('dpo-create-token', {
      body: {
        amount: numAmount,
        currency: 'USD',
        description: 'Wallet top-up',
        redirectUrl,
        backUrl: redirectUrl,
      },
    });
    setProcessing(false);
    if (error || !data?.paymentUrl) {
      toast({
        title: 'Could not start payment',
        description: (error as Error)?.message || data?.error || 'Please try again later',
        variant: 'destructive',
      });
      return;
    }
    window.location.href = data.paymentUrl;
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

          <p className="text-xs text-muted-foreground">
            Wallet top-ups are processed securely by DPO Pay. You'll be redirected to
            complete the payment with a card or mobile money and returned here once
            confirmed.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={processing || !amount}
              onClick={handleDpoTopUp}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Pay ${amount || '0.00'} with DPO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
