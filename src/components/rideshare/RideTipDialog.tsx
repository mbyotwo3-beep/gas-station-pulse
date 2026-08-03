import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';
import { Heart, Loader2 } from 'lucide-react';

const PRESETS = [1, 2, 5];

interface RideTipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  onTipped?: (amount: number) => void;
}

export default function RideTipDialog({ open, onOpenChange, rideId, onTipped }: RideTipDialogProps) {
  const { balance, deductFunds } = useWallet();
  const [amount, setAmount] = useState<number>(2);
  const [custom, setCustom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = custom ? Number(custom) : amount;
  const valid = isFinite(finalAmount) && finalAmount > 0 && finalAmount <= balance;

  const handleTip = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      const result = await deductFunds(
        finalAmount,
        `Driver tip - $${finalAmount.toFixed(2)}`,
        rideId,
      );
      if (!result.success) throw new Error(result.error || 'Could not send tip');

      const { error } = await (supabase as any)
        .from('ride_payments')
        .update({ tip_amount: finalAmount })
        .eq('ride_id', rideId);
      if (error) console.error('Tip recorded in wallet but not on payment row:', error);

      toast({ title: 'Tip sent', description: `Your driver received $${finalAmount.toFixed(2)}. Thank you!` });
      onTipped?.(finalAmount);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Tip failed', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Add a tip
          </DialogTitle>
          <DialogDescription>
            100% of your tip goes to the driver. Paid from your wallet (balance ${balance.toFixed(2)}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p}
                type="button"
                variant={!custom && amount === p ? 'default' : 'outline'}
                onClick={() => {
                  setAmount(p);
                  setCustom('');
                }}
              >
                ${p.toFixed(2)}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-custom">Custom amount</Label>
            <Input
              id="tip-custom"
              type="number"
              min="0.5"
              step="0.5"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Enter an amount"
            />
          </div>

          {!valid && finalAmount > balance && (
            <p className="text-sm text-destructive">Not enough wallet balance for this tip.</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              No thanks
            </Button>
            <Button className="flex-1" disabled={!valid || submitting} onClick={handleTip}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tip ${isFinite(finalAmount) ? finalAmount.toFixed(2) : '0.00'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
