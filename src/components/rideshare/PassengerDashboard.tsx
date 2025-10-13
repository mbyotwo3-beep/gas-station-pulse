import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Navigation, MapPin, Clock, DollarSign, User } from 'lucide-react';
import LocationSearch from '@/components/map/LocationSearch';
import ActiveRideTracker from './ActiveRideTracker';
import RideHistory from './RideHistory';

interface RideRequest {
  id: string;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  max_fare?: number;
  passenger_count: number;
  notes?: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface ActiveRide {
  id: string;
  driver_id: string;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  status: string;
  fare_amount?: number;
  created_at: string;
}

export default function PassengerDashboard() {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [maxFare, setMaxFare] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchActiveRequest();
      fetchActiveRide();
    }
  }, [user]);

  const fetchActiveRequest = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('passenger_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching ride request:', error);
    } else if (data) {
      const typedData = {
        ...data,
        pickup_location: data.pickup_location as { lat: number; lng: number; address: string },
        destination_location: data.destination_location as { lat: number; lng: number; address: string }
      };
      setActiveRequest(typedData);
    }
    setLoading(false);
  };

  const fetchActiveRide = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('passenger_id', user.id)
      .in('status', ['pending', 'accepted', 'in_progress'])
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active ride:', error);
    } else if (data) {
      const typedData = {
        ...data,
        pickup_location: data.pickup_location as { lat: number; lng: number; address: string },
        destination_location: data.destination_location as { lat: number; lng: number; address: string }
      };
      setActiveRide(typedData);
    }
  };

  const submitRideRequest = async () => {
    if (!user || !pickupLocation || !destinationLocation) {
      toast({ title: 'Error', description: 'Please select pickup and destination locations', variant: 'destructive' });
      return;
    }
    
    setSubmitting(true);
    const { error } = await supabase
      .from('ride_requests')
      .insert({
        passenger_id: user.id,
        pickup_location: pickupLocation,
        destination_location: destinationLocation,
        max_fare: maxFare ? parseFloat(maxFare) : null,
        passenger_count: passengerCount,
        notes: notes || null,
      });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ride request submitted!', description: 'Waiting for a driver to accept your request.' });
      fetchActiveRequest();
      // Reset form
      setPickupLocation(null);
      setDestinationLocation(null);
      setMaxFare('');
      setPassengerCount(1);
      setNotes('');
    }
    setSubmitting(false);
  };

  const cancelRideRequest = async () => {
    if (!activeRequest || !user) return;
    
    const { error } = await supabase
      .from('ride_requests')
      .update({ status: 'cancelled' })
      .eq('id', activeRequest.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ride request cancelled' });
      setActiveRequest(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  // Show active ride if exists
  if (activeRide) {
    return (
      <div className="space-y-6">
        <ActiveRideTracker />
        <RideHistory />
      </div>
    );
  }

  // Show active request if exists
  if (activeRequest) {
    return (
      <div className="space-y-6">
        <Card className="surface-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Waiting for Driver
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="warning">Looking for Driver</Badge>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Pickup:</span>
              <span className="text-sm">{activeRequest.pickup_location.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-destructive" />
              <span className="font-medium">Destination:</span>
              <span className="text-sm">{activeRequest.destination_location.address}</span>
            </div>
            {activeRequest.max_fare && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-medium">Max Fare: ${activeRequest.max_fare}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Passengers: {activeRequest.passenger_count}</span>
            </div>
            {activeRequest.notes && (
              <p className="text-sm text-muted-foreground">
                Note: {activeRequest.notes}
              </p>
            )}
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              onClick={cancelRideRequest}
              variant="destructive"
              className="w-full"
            >
              Cancel Request
            </Button>
          </div>
        </CardContent>
      </Card>
        <RideHistory />
      </div>
    );
  }

  // Show request ride form
  return (
    <div className="space-y-6">
      <Card className="surface-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Request a Ride
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pickup Location</Label>
            <LocationSearch 
              onSelectLocation={(location) => setPickupLocation({
                lat: location.lat,
                lng: location.lng,
                address: location.label || 'Selected location'
              })}
            />
            {pickupLocation && (
              <p className="text-sm text-muted-foreground">
                📍 {pickupLocation.address}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Destination</Label>
            <LocationSearch 
              onSelectLocation={(location) => setDestinationLocation({
                lat: location.lat,
                lng: location.lng,
                address: location.label || 'Selected location'
              })}
            />
            {destinationLocation && (
              <p className="text-sm text-muted-foreground">
                🎯 {destinationLocation.address}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maximum Fare (optional)</Label>
              <Input 
                type="number"
                value={maxFare}
                onChange={(e) => setMaxFare(e.target.value)}
                placeholder="25.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Passengers</Label>
              <Input 
                type="number"
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                min="1"
                max="8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or instructions..."
              rows={3}
            />
          </div>
        </div>
        
        <Button 
          onClick={submitRideRequest}
          disabled={submitting || !pickupLocation || !destinationLocation}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Requesting Ride...' : 'Request Ride'}
        </Button>
      </CardContent>
    </Card>
      <RideHistory />
    </div>
  );
}