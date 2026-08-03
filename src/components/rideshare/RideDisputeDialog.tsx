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

const CATEGORIES = [
  { value: 'fare', label: 'I was charged the wrong fare' },
  { value: 'route', label: 'The driver took a poor route' },
  { value: 'driver_conduct', label: 'Driver conduct' },
  { value: 'passenger_conduct', label: 'Passenger conduct' },
  { value: 'lost_item', label: 'I lost an item' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'other', label: 'Something else' },
];

interface RideDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
}

export default function RideDisputeDialog({ open, onOpenChange, rideId }: RideDisputeDialogProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !category || description.trim().length < 10) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from('ride_disputes').insert({
        ride_id: rideId,
        reporter_id: user.id,
        category,
        description: description.trim(),
        status: 'open',
      });
      if (error) throw error;
      toast({
        title: 'Issue reported',
        description: 'Our support team will review this ride and get back to you.',
      });
      onOpenChange(false);
      setCategory('');
      setDescription('');
    } catch (error: any) {
      toast({ title: 'Could not submit report', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>Tell us what went wrong with this trip.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={category} onValueChange={setCategory} className="space-y-2">
            {CATEGORIES.map((c) => (
              <div key={c.value} className="flex items-center gap-3 rounded-lg border p-3">
                <RadioGroupItem value={c.value} id={`dispute-${c.value}`} />
                <Label htmlFor={`dispute-${c.value}`} className="flex-1 cursor-pointer font-normal">
                  {c.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">What happened?</Label>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Describe the issue in a few sentences (minimum 10 characters)..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              className="flex-1"
              disabled={!category || description.trim().length < 10 || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
