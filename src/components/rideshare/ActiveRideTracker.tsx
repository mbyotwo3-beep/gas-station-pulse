import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActiveRide, type FareBreakdown } from '@/hooks/useActiveRide';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation, MapPin, Clock, DollarSign, MessageCircle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RideRatingDialog } from './RideRatingDialog';
import { RidePaymentDialog } from './RidePaymentDialog';
import { RideChatDialog } from './RideChatDialog';
import DriverLocationMap from './DriverLocationMap';
import RideSafetyPanel from './RideSafetyPanel';
import RideVerificationOTP from './RideVerificationOTP';
import RideCompletionSummary from './RideCompletionSummary';

function buildFareBreakdown(opts: {
  distanceKm: number;
  durationMin: number;
  estimate?: number;
}): FareBreakdown {
  const base = 2.5;
  const distance = +(opts.distanceKm * 1.2).toFixed(2);
  const time = +(opts.durationMin * 0.25).toFixed(2);
  const computed = +(base + distance + time).toFixed(2);
  // Prefer the original estimate when reasonably aligned so passengers aren't surprised
  const total = opts.estimate && Math.abs(opts.estimate - computed) / computed < 0.25
    ? +opts.estimate.toFixed(2)
    : computed;
  // Rebalance: ensure base+distance+time == total
  const adjust = +(total - (base + distance + time)).toFixed(2);
  return {
    base,
    distance,
    time: +(time + adjust).toFixed(2),
    total,
  };
}

export default function ActiveRideTracker() {
  const { user } = useAuth();
  const { activeRide, updateRideStatus, finalizeRide, loading } = useActiveRide();
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rideVerified, setRideVerified] = useState(false);

  const isDriver = activeRide?.driver_id === user?.id;

  // Build a fare breakdown for summary — use stored breakdown once finalized
  const summaryBreakdown = useMemo<FareBreakdown | null>(() => {
    if (!activeRide) return null;
    if (activeRide.fare_breakdown && activeRide.final_fare) {
      return activeRide.fare_breakdown;
    }
    const distanceKm = activeRide.actual_distance ?? activeRide.estimated_distance ?? 0;
    const durationMin = activeRide.actual_duration ?? activeRide.estimated_duration ?? 0;
    return buildFareBreakdown({
      distanceKm,
      durationMin,
      estimate: activeRide.fare_amount,
    });
  }, [activeRide]);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (!activeRide) {
    return null;
  }

  const paid = activeRide.payment_status === 'completed';

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    const success = await updateRideStatus(activeRide.id, newStatus, notes || undefined);
    setNotes('');
    setUpdating(false);
    return success;
  };

  const handleDriverFinalize = async () => {
    if (!summaryBreakdown) return;
    setUpdating(true);
    const ok = await finalizeRide(activeRide.id, {
      actual_distance: activeRide.actual_distance ?? activeRide.estimated_distance ?? undefined,
      actual_duration: activeRide.actual_duration ?? activeRide.estimated_duration ?? undefined,
      final_fare: summaryBreakdown.total,
      fare_breakdown: summaryBreakdown,
    });
    setUpdating(false);
    if (ok) setShowRating(true);
  };

  const handlePassengerPayAndRate = () => {
    if (paid) {
      setShowRating(true);
    } else {
      setShowPayment(true);
    }
  };

  // === Arrival / completion summary screen ===
  if ((activeRide.status === 'arrived' || activeRide.status === 'completed') && summaryBreakdown) {
    const distanceKm = activeRide.actual_distance ?? activeRide.estimated_distance ?? 0;
    const durationMin = activeRide.actual_duration ?? activeRide.estimated_duration ?? 0;

    let primaryLabel = '';
    let onPrimary: () => void = () => {};
    if (isDriver) {
      if (activeRide.status === 'arrived') {
        primaryLabel = 'Finalize & Complete Ride';
        onPrimary = handleDriverFinalize;
      } else {
        primaryLabel = 'Rate Passenger';
        onPrimary = () => setShowRating(true);
      }
    } else {
      primaryLabel = paid ? 'Rate Your Driver' : `Pay $${summaryBreakdown.total.toFixed(2)}`;
      onPrimary = handlePassengerPayAndRate;
    }

    return (
      <>
        <RideCompletionSummary
          pickupAddress={activeRide.pickup_location.address}
          destinationAddress={activeRide.destination_location.address}
          distanceKm={distanceKm}
          durationMin={durationMin}
          fareBreakdown={summaryBreakdown}
          isDriver={!!isDriver}
          paid={paid}
          submitting={updating}
          onPrimaryAction={onPrimary}
          primaryLabel={primaryLabel}
          secondaryLabel="Message"
          onSecondaryAction={() => setShowChat(true)}
        />

        {showRating && (
          <RideRatingDialog
            open={showRating}
            onOpenChange={setShowRating}
            rideId={activeRide.id}
            ratedUserId={isDriver ? activeRide.passenger_id! : activeRide.driver_id!}
            ratedUserName={isDriver ? 'Passenger' : 'Driver'}
            userType={isDriver ? 'passenger' : 'driver'}
          />
        )}

        {showPayment && (
          <RidePaymentDialog
            open={showPayment}
            onOpenChange={setShowPayment}
            rideId={activeRide.id}
            amount={summaryBreakdown.total}
            onSuccess={() => {
              setShowPayment(false);
              setShowRating(true);
            }}
          />
        )}

        {showChat && (
          <RideChatDialog
            open={showChat}
            onOpenChange={setShowChat}
            rideId={activeRide.id}
            otherUserName={isDriver ? 'Passenger' : 'Driver'}
          />
        )}
      </>
    );
  }

  const statusBadgeVariant =
    activeRide.status === 'accepted' ? 'success' :
    activeRide.status === 'in_progress' ? 'warning' :
    'secondary';

  return (
    <Card className="surface-gradient border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {isDriver ? 'Current Ride' : 'Your Ride'}
          </CardTitle>
          <Badge variant={statusBadgeVariant}>
            {activeRide.status === 'accepted' ? 'Driver En Route' :
             activeRide.status === 'in_progress' ? 'In Progress' :
             activeRide.status.charAt(0).toUpperCase() + activeRide.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <RideSafetyPanel
          rideId={activeRide.id}
          isDriver={!!isDriver}
          pickupAddress={activeRide.pickup_location.address}
          destinationAddress={activeRide.destination_location.address}
          rideStatus={activeRide.status}
          driverId={activeRide.driver_id || undefined}
          passengerId={activeRide.passenger_id || undefined}
        />

        {activeRide.status === 'accepted' && !rideVerified && (
          <RideVerificationOTP
            rideId={activeRide.id}
            isDriver={!!isDriver}
            onVerified={() => setRideVerified(true)}
          />
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Pickup</p>
              <p className="text-sm text-muted-foreground">{activeRide.pickup_location.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Destination</p>
              <p className="text-sm text-muted-foreground">{activeRide.destination_location.address}</p>
            </div>
          </div>
        </div>

        {!isDriver && activeRide.driver_id && (
          <DriverLocationMap
            driverId={activeRide.driver_id}
            pickupLocation={activeRide.pickup_location}
            destinationLocation={activeRide.destination_location}
            rideStatus={activeRide.status}
            className="h-[200px]"
          />
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {activeRide.fare_amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Est. Fare</p>
                <p className="font-semibold">${activeRide.fare_amount}</p>
              </div>
            </div>
          )}
          {activeRide.estimated_duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Est. Time</p>
                <p className="font-semibold">{activeRide.estimated_duration} min</p>
              </div>
            </div>
          )}
        </div>

        {(activeRide.driver_notes || activeRide.passenger_notes) && (
          <div className="pt-4 border-t space-y-2">
            {activeRide.driver_notes && (
              <div>
                <p className="text-sm font-medium">Driver Notes:</p>
                <p className="text-sm text-muted-foreground">{activeRide.driver_notes}</p>
              </div>
            )}
            {activeRide.passenger_notes && (
              <div>
                <p className="text-sm font-medium">Passenger Notes:</p>
                <p className="text-sm text-muted-foreground">{activeRide.passenger_notes}</p>
              </div>
            )}
          </div>
        )}

        {isDriver && (
          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label>Add Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the ride..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              {activeRide.status === 'accepted' && (
                <Button
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={updating || !rideVerified}
                  className="flex-1"
                >
                  {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Start Ride
                </Button>
              )}
              {activeRide.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusUpdate('arrived')}
                  disabled={updating}
                  variant="success"
                  className="flex-1"
                >
                  {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  I've Arrived
                </Button>
              )}
            </div>
            {activeRide.status === 'accepted' && !rideVerified && (
              <p className="text-xs text-muted-foreground text-center">
                Verify the passenger's OTP to start the ride.
              </p>
            )}
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowChat(true)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat with {isDriver ? 'Passenger' : 'Driver'}
          </Button>
        </div>
      </CardContent>

      {showChat && (
        <RideChatDialog
          open={showChat}
          onOpenChange={setShowChat}
          rideId={activeRide.id}
          otherUserName={isDriver ? 'Passenger' : 'Driver'}
        />
      )}
    </Card>
  );
}
