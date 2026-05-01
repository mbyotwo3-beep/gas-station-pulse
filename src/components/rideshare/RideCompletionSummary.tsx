import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, MapPin, Navigation, Clock, Route, Loader2, Download } from 'lucide-react';
import type { FareBreakdown } from '@/hooks/useActiveRide';

interface RideCompletionSummaryProps {
  pickupAddress: string;
  destinationAddress: string;
  distanceKm: number;
  durationMin: number;
  fareBreakdown: FareBreakdown;
  isDriver: boolean;
  paid: boolean;
  submitting?: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryLabel: string;
  secondaryLabel?: string;
  onDownloadReceipt?: () => void;
  canDownloadReceipt?: boolean;
}

export default function RideCompletionSummary({
  pickupAddress,
  destinationAddress,
  distanceKm,
  durationMin,
  fareBreakdown,
  isDriver,
  paid,
  submitting,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
  secondaryLabel,
  onDownloadReceipt,
  canDownloadReceipt,
}: RideCompletionSummaryProps) {
  return (
    <Card className="surface-gradient border-2 border-success/30">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <CardTitle className="text-xl">
          {isDriver ? 'Ride Complete' : 'You\'ve Arrived'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isDriver
            ? 'Review the trip summary and wait for payment confirmation.'
            : 'Review your trip and complete payment.'}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Route */}
        <div className="space-y-3 rounded-lg border bg-card/50 p-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Pickup</p>
              <p className="text-muted-foreground">{pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Destination</p>
              <p className="text-muted-foreground">{destinationAddress}</p>
            </div>
          </div>
        </div>

        {/* Trip stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span className="text-xs">Distance</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{distanceKm.toFixed(1)} km</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{durationMin} min</p>
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="space-y-2 rounded-lg border bg-card/50 p-4">
          <p className="text-sm font-semibold">Fare breakdown</p>
          <div className="space-y-1.5 text-sm">
            <Row label="Base fare" value={fareBreakdown.base} />
            <Row label="Distance" value={fareBreakdown.distance} />
            <Row label="Time" value={fareBreakdown.time} />
            {fareBreakdown.surge && fareBreakdown.surge > 0 ? (
              <Row label="Surge" value={fareBreakdown.surge} />
            ) : null}
            {fareBreakdown.fees && fareBreakdown.fees > 0 ? (
              <Row label="Service fee" value={fareBreakdown.fees} />
            ) : null}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold text-primary">
              ${fareBreakdown.total.toFixed(2)}
            </span>
          </div>
          {paid && (
            <p className="text-xs text-success">✓ Payment received</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={onPrimaryAction}
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {primaryLabel}
          </Button>
          {secondaryLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              disabled={submitting}
              className="w-full"
            >
              {secondaryLabel}
            </Button>
          )}
          {canDownloadReceipt && onDownloadReceipt && (
            <Button
              variant="ghost"
              onClick={onDownloadReceipt}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download receipt (PDF)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">${value.toFixed(2)}</span>
    </div>
  );
}
