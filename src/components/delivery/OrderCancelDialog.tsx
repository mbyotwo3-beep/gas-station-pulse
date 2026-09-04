import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CUSTOMER_REASONS = [
  { value: 'changed_plans', label: 'My plans changed' },
  { value: 'wait_too_long', label: 'Waiting too long' },
  { value: 'wrong_details', label: 'I entered the wrong details' },
  { value: 'price_too_high', label: 'Price is too high' },
  { value: 'ordered_by_mistake', label: 'I ordered by mistake' },
  { value: 'other', label: 'Other' },
];

const COURIER_REASONS = [
  { value: 'customer_unreachable', label: 'Cannot reach the customer' },
  { value: 'pickup_unavailable', label: 'Pickup point is closed or unavailable' },
  { value: 'vehicle_issue', label: 'Vehicle problem' },
  { value: 'unsafe_situation', label: 'Unsafe situation' },
  { value: 'other', label: 'Other' },
];

interface OrderCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  isCourier?: boolean;
  onCancelled?: () => void;
}

export default function OrderCancelDialog({
  open,
  onOpenChange,
  orderId,
  isCourier = false,
  onCancelled,
}: OrderCancelDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = isCourier ? COURIER_REASONS : CUSTOMER_REASONS;

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (orderError) throw orderError;

      const label = reasons.find((r) => r.value === reason)?.label ?? reason;
      const { error: logError } = await supabase.from('order_cancellations').insert({
        order_id: orderId,
        cancelled_by: user.id,
        role: isCourier ? 'courier' : 'customer',
        reason: details.trim() ? `${label} — ${details.trim()}` : label,
      });
      if (logError) console.error('Could not log cancellation reason:', logError);

      toast({
        title: 'Order cancelled',
        description: 'We have recorded your reason. Thanks for letting us know.',
      });
      onCancelled?.();
      onOpenChange(false);
      setReason('');
      setDetails('');
    } catch (error: any) {
      toast({ title: 'Could not cancel order', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            Tell us why so we can improve. Frequent cancellations may affect your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {reasons.map((r) => (
              <div key={r.value} className="flex items-center gap-3 rounded-lg border p-3">
                <RadioGroupItem value={r.value} id={`order-cancel-${r.value}`} />
                <Label htmlFor={`order-cancel-${r.value}`} className="flex-1 cursor-pointer font-normal">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="order-cancel-details">Anything else? (optional)</Label>
            <Textarea
              id="order-cancel-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add more context..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
