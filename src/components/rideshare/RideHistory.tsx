import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface RideHistoryItem {
  id: string;
  driver_id: string | null;
  passenger_id: string | null;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  status: string;
  fare_amount?: number;
  estimated_distance?: number;
  created_at: string;
  completed_at?: string;
  driver_notes?: string;
  passenger_notes?: string;
}

export default function RideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRideHistory();
    }
  }, [user]);

  const fetchRideHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .or(`driver_id.eq.${user.id},passenger_id.eq.${user.id}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching ride history:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        pickup_location: item.pickup_location as { lat: number; lng: number; address: string },
        destination_location: item.destination_location as { lat: number; lng: number; address: string }
      }));
      setRides(typedData);
    }
    setLoading(false);
  };

  const asDriver = rides.filter(r => r.driver_id === user?.id);
  const asPassenger = rides.filter(r => r.passenger_id === user?.id);

  const RideCard = ({ ride }: { ride: RideHistoryItem }) => {
    const isDriver = ride.driver_id === user?.id;
    
    return (
      <Card className="surface-gradient">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {isDriver ? 'As Driver' : 'As Passenger'}
            </Badge>
            {ride.completed_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(ride.completed_at), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm truncate">{ride.pickup_location.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm truncate">{ride.destination_location.address}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            {ride.fare_amount && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-semibold">${ride.fare_amount}</span>
              </div>
            )}
            {ride.estimated_distance && (
              <div className="text-sm text-muted-foreground">
                {ride.estimated_distance.toFixed(1)} km
              </div>
            )}
          </div>

          {((isDriver && ride.driver_notes) || (!isDriver && ride.passenger_notes)) && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Notes:</p>
              <p className="text-sm">{isDriver ? ride.driver_notes : ride.passenger_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading ride history...</p>
        </CardContent>
      </Card>
    );
  }

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No completed rides yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ride History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({rides.length})</TabsTrigger>
            <TabsTrigger value="driver">As Driver ({asDriver.length})</TabsTrigger>
            <TabsTrigger value="passenger">As Passenger ({asPassenger.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {rides.map(ride => <RideCard key={ride.id} ride={ride} />)}
          </TabsContent>
          
          <TabsContent value="driver" className="space-y-4 mt-4">
            {asDriver.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No rides as driver yet</p>
            ) : (
              asDriver.map(ride => <RideCard key={ride.id} ride={ride} />)
            )}
          </TabsContent>
          
          <TabsContent value="passenger" className="space-y-4 mt-4">
            {asPassenger.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No rides as passenger yet</p>
            ) : (
              asPassenger.map(ride => <RideCard key={ride.id} ride={ride} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
