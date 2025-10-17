import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useActiveRide } from '@/hooks/useActiveRide';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation, MapPin, Clock, DollarSign, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { RideRatingDialog } from './RideRatingDialog';
import { RidePaymentDialog } from './RidePaymentDialog';
import { RideChatDialog } from './RideChatDialog';

export default function ActiveRideTracker() {
  const { user } = useAuth();
  const { activeRide, updateRideStatus, loading } = useActiveRide();
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (!activeRide) {
    return null;
  }

  const isDriver = activeRide.driver_id === user?.id;
  const statusBadgeVariant = 
    activeRide.status === 'accepted' ? 'success' : 
    activeRide.status === 'in_progress' ? 'warning' : 
    'secondary';

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    const success = await updateRideStatus(activeRide.id, newStatus, notes || undefined);
    setNotes('');
    setUpdating(false);
    if (success && newStatus === 'completed') {
      if (!isDriver) {
        setShowPayment(true);
      } else {
        setShowRating(true);
      }
    }
  };

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
        {/* Route Information */}
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

        {/* Ride Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {activeRide.fare_amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Fare</p>
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

        {/* Notes */}
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

        {/* Actions for Driver */}
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
                  disabled={updating}
                  className="flex-1"
                >
                  Start Ride
                </Button>
              )}
              {activeRide.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  variant="success"
                  className="flex-1"
                >
                  Complete Ride
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Chat Button */}
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

      {showRating && activeRide && (
        <RideRatingDialog
          open={showRating}
          onOpenChange={(open) => {
            setShowRating(open);
            if (!open && !isDriver) setShowPayment(true);
          }}
          rideId={activeRide.id}
          ratedUserId={isDriver ? activeRide.passenger_id! : activeRide.driver_id!}
          ratedUserName={isDriver ? 'Passenger' : 'Driver'}
          userType={isDriver ? 'passenger' : 'driver'}
        />
      )}

      {showPayment && activeRide && activeRide.fare_amount && (
        <RidePaymentDialog
          open={showPayment}
          onOpenChange={(open) => {
            setShowPayment(open);
            if (!open) setShowRating(true);
          }}
          rideId={activeRide.id}
          amount={activeRide.fare_amount}
        />
      )}

      {showChat && activeRide && (
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
