import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ActiveRide {
  id: string;
  driver_id: string | null;
  passenger_id: string | null;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  status: string;
  fare_amount?: number;
  estimated_distance?: number;
  estimated_duration?: number;
  driver_notes?: string;
  passenger_notes?: string;
  created_at: string;
  updated_at: string;
}

export function useActiveRide() {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveRide = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .or(`driver_id.eq.${user.id},passenger_id.eq.${user.id}`)
      .in('status', ['pending', 'accepted', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active ride:', error);
    } else if (data) {
      setActiveRide({
        ...data,
        pickup_location: data.pickup_location as { lat: number; lng: number; address: string },
        destination_location: data.destination_location as { lat: number; lng: number; address: string }
      });
    } else {
      setActiveRide(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveRide();

    // Set up real-time subscription for ride updates
    const channel = supabase
      .channel('active-ride-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        console.log('Ride updated:', payload);
        fetchActiveRide();
        
        // Show notification for status changes
        if (payload.eventType === 'UPDATE') {
          const newData = payload.new as any;
          if (newData.status === 'accepted') {
            toast({
              title: 'Ride Accepted!',
              description: 'Your driver is on the way'
            });
          } else if (newData.status === 'in_progress') {
            toast({
              title: 'Ride Started',
              description: 'Enjoy your trip!'
            });
          } else if (newData.status === 'completed') {
            toast({
              title: 'Ride Completed',
              description: 'Thank you for riding with us!'
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateRideStatus = async (rideId: string, status: string, notes?: string) => {
    const isDriver = activeRide?.driver_id === user?.id;
    const updateData: any = { status };
    
    if (notes) {
      updateData[isDriver ? 'driver_notes' : 'passenger_notes'] = notes;
    }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('rides')
      .update(updateData)
      .eq('id', rideId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    fetchActiveRide();
    return true;
  };

  return {
    activeRide,
    loading,
    updateRideStatus,
    refetch: fetchActiveRide
  };
}
