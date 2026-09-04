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

const RIDER_REASONS = [
  { value: 'driver_too_far', label: 'Driver is too far away' },
  { value: 'wait_too_long', label: 'Waiting too long' },
  { value: 'changed_plans', label: 'My plans changed' },
  { value: 'wrong_pickup', label: 'Wrong pickup location' },
  { value: 'price_too_high', label: 'Price is too high' },
  { value: 'other', label: 'Other' },
];

const DRIVER_REASONS = [
  { value: 'passenger_no_show', label: 'Passenger did not show up' },
  { value: 'passenger_unreachable', label: 'Cannot reach the passenger' },
  { value: 'vehicle_issue', label: 'Vehicle problem' },
  { value: 'unsafe_situation', label: 'Unsafe situation' },
  { value: 'wrong_pickup', label: 'Pickup location is inaccessible' },
  { value: 'other', label: 'Other' },
];

interface RideCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  isDriver: boolean;
  onCancelled?: () => void;
}

export default function RideCancelDialog({
  open,
  onOpenChange,
  rideId,
  isDriver,
  onCancelled,
}: RideCancelDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = isDriver ? DRIVER_REASONS : RIDER_REASONS;

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      const { error: rideError } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId);
      if (rideError) throw rideError;

      const { error: logError } = await (supabase as any)
        .from('ride_cancellations')
        .insert({
          ride_id: rideId,
          cancelled_by: user.id,
          role: isDriver ? 'driver' : 'passenger',
          reason: details.trim() ? `${reason} — ${details.trim()}` : reason,
        });
      if (logError) console.error('Could not log cancellation reason:', logError);

      toast({
        title: 'Ride cancelled',
        description: 'We have recorded your reason. Thanks for letting us know.',
      });
      onCancelled?.();
      onOpenChange(false);
      setReason('');
      setDetails('');
    } catch (error: any) {
      toast({ title: 'Could not cancel ride', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this ride?</DialogTitle>
          <DialogDescription>
            Tell us why so we can improve matching. Frequent cancellations may affect your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {reasons.map((r) => (
              <div key={r.value} className="flex items-center gap-3 rounded-lg border p-3">
                <RadioGroupItem value={r.value} id={`cancel-${r.value}`} />
                <Label htmlFor={`cancel-${r.value}`} className="flex-1 cursor-pointer font-normal">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="cancel-details">Anything else? (optional)</Label>
            <Textarea
              id="cancel-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Add more context..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Keep ride
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel ride
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
