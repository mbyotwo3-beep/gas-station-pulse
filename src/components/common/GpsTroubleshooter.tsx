import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, Satellite, RefreshCw, Smartphone, Wifi } from 'lucide-react';

interface GpsTroubleshooterProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  accuracy?: number | null;
  reason?: 'denied' | 'unavailable' | 'timeout' | 'low-accuracy' | null;
}

const REASON_COPY: Record<NonNullable<GpsTroubleshooterProps['reason']>, string> = {
  denied: "Location permission was denied. Re-enable it in your browser's site settings.",
  unavailable: "Your device couldn't determine a location right now.",
  timeout: 'GPS is taking longer than expected to lock on.',
  'low-accuracy': 'GPS is connected but the fix is imprecise.',
};

export default function GpsTroubleshooter({
  open,
  onClose,
  onRetry,
  accuracy,
  reason,
}: GpsTroubleshooterProps) {
  const steps = [
    {
      icon: MapPin,
      title: 'Allow location access',
      body: "Tap the lock icon in your browser's address bar and set Location to Allow for this site.",
    },
    {
      icon: Smartphone,
      title: 'Enable High Accuracy mode',
      body: 'In your phone Settings → Location, choose High accuracy (uses GPS, Wi-Fi and mobile networks).',
    },
    {
      icon: Satellite,
      title: 'Step outside',
      body: 'GPS signals are blocked indoors and by tall buildings. Move to an open area with a clear sky view.',
    },
    {
      icon: Wifi,
      title: 'Toggle Wi-Fi & Airplane mode',
      body: 'Briefly turn Airplane mode on then off — this forces a fresh fix and clears stale Wi-Fi-based estimates.',
    },
    {
      icon: RefreshCw,
      title: 'Retry',
      body: 'After the steps above, tap Retry. The first lock outdoors usually takes 10–30 seconds.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trouble locking on GPS</DialogTitle>
          <DialogDescription>
            {reason ? REASON_COPY[reason] : 'Try these steps to get an accurate fix.'}
            {typeof accuracy === 'number' && (
              <span className="block mt-1 text-xs">Current accuracy: ±{Math.round(accuracy)}m</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 mt-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span> {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Got it
          </Button>
          {onRetry && (
            <Button
              className="flex-1"
              onClick={() => {
                onRetry();
                onClose();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Retry GPS
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
