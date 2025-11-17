import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  driver_id: string;
  location: { lat: number; lng: number; timestamp: string } | null;
  is_active: boolean;
}

export function useRealtimeDriverLocation(driverId: string | null) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    // Fetch initial location
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('current_location, is_active')
        .eq('user_id', driverId)
        .single();

      if (data && data.current_location) {
        const loc = data.current_location as any;
        setLocation({ lat: loc.lat, lng: loc.lng });
      }
      setLoading(false);
    };

    fetchLocation();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_profiles',
          filter: `user_id=eq.${driverId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.current_location) {
            const loc = newData.current_location as any;
            setLocation({ lat: loc.lat, lng: loc.lng });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return { location, loading };
}