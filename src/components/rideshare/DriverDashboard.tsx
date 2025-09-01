import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Car, Star, Navigation, DollarSign } from 'lucide-react';

interface DriverProfile {
  id: string;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model?: string;
  license_plate?: string;
  is_active: boolean;
  rating: number;
  total_rides: number;
}

interface RideRequest {
  id: string;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  max_fare?: number;
  passenger_count: number;
  notes?: string;
  passenger_id: string;
  created_at: string;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);

  // Form state for creating driver profile
  const [vehicleType, setVehicleType] = useState('car');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  useEffect(() => {
    if (user) {
      fetchDriverProfile();
      fetchRideRequests();
    }
  }, [user]);

  const fetchDriverProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching driver profile:', error);
    } else if (data) {
      setDriverProfile(data);
    }
    setLoading(false);
  };

  const fetchRideRequests = async () => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching ride requests:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        pickup_location: item.pickup_location as { lat: number; lng: number; address: string },
        destination_location: item.destination_location as { lat: number; lng: number; address: string }
      }));
      setRideRequests(typedData);
    }
  };

  const createDriverProfile = async () => {
    if (!user) return;
    
    setCreatingProfile(true);
    const { error } = await supabase
      .from('driver_profiles')
      .insert({
        user_id: user.id,
        vehicle_type: vehicleType,
        vehicle_make: vehicleMake || null,
        vehicle_model: vehicleModel || null,
        license_plate: licensePlate || null,
        is_active: false,
      });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Driver profile created!' });
      fetchDriverProfile();
    }
    setCreatingProfile(false);
  };

  const toggleDriverStatus = async () => {
    if (!driverProfile || !user) return;
    
    const newStatus = !driverProfile.is_active;
    const { error } = await supabase
      .from('driver_profiles')
      .update({ is_active: newStatus })
      .eq('user_id', user.id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDriverProfile({ ...driverProfile, is_active: newStatus });
      toast({ 
        title: newStatus ? 'You\'re now online!' : 'You\'re now offline',
        description: newStatus ? 'You can receive ride requests' : 'You won\'t receive new ride requests'
      });
    }
  };

  const acceptRideRequest = async (request: RideRequest) => {
    if (!user || !driverProfile) return;
    
    const { error } = await supabase
      .from('rides')
      .insert({
        driver_id: user.id,
        passenger_id: request.passenger_id,
        pickup_location: request.pickup_location,
        destination_location: request.destination_location,
        status: 'accepted',
        fare_amount: request.max_fare,
      });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Update ride request status
      await supabase
        .from('ride_requests')
        .update({ status: 'matched' })
        .eq('id', request.id);
      
      toast({ title: 'Ride accepted!', description: 'Contact the passenger to coordinate pickup.' });
      fetchRideRequests();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!driverProfile) {
    return (
      <Card className="surface-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Become a Driver
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input 
                value={licensePlate} 
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="ABC-123"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Make</Label>
              <Input 
                value={vehicleMake} 
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <Input 
                value={vehicleModel} 
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Camry"
              />
            </div>
          </div>
          <Button 
            onClick={createDriverProfile} 
            disabled={creatingProfile}
            className="w-full"
          >
            {creatingProfile ? 'Creating Profile...' : 'Become a Driver'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver Status Card */}
      <Card className="surface-gradient">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Driver Dashboard
            </div>
            <Badge variant={driverProfile.is_active ? 'success' : 'secondary'}>
              {driverProfile.is_active ? 'Online' : 'Offline'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Go Online</p>
              <p className="text-sm text-muted-foreground">
                Start receiving ride requests
              </p>
            </div>
            <Switch 
              checked={driverProfile.is_active}
              onCheckedChange={toggleDriverStatus}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{driverProfile.total_rides}</div>
              <div className="text-sm text-muted-foreground">Total Rides</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-warning" fill="currentColor" />
                {driverProfile.rating.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{driverProfile.vehicle_type}</div>
              <div className="text-sm text-muted-foreground">Vehicle</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{driverProfile.license_plate || 'N/A'}</div>
              <div className="text-sm text-muted-foreground">License</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Ride Requests */}
      <Card className="surface-gradient">
        <CardHeader>
          <CardTitle>Available Ride Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {rideRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No ride requests available at the moment
            </p>
          ) : (
            <div className="space-y-4">
              {rideRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <span className="font-medium">Pickup:</span>
                        <span className="text-sm">{request.pickup_location.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Destination:</span>
                        <span className="text-sm">{request.destination_location.address}</span>
                      </div>
                      {request.max_fare && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="font-medium">Max Fare: ${request.max_fare}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Passengers: {request.passenger_count}</span>
                      </div>
                      {request.notes && (
                        <p className="text-sm text-muted-foreground">
                          Note: {request.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => acceptRideRequest(request)}
                      variant="success"
                      size="sm"
                    >
                      Accept Ride
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}