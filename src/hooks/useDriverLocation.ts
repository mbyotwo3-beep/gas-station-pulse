import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useDriverLocation(isActive: boolean) {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user || !isActive) {
      // Stop tracking if inactive
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location tracking',
        variant: 'destructive'
      });
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Skip low-quality fixes — these are usually Wi-Fi/IP-based and can place
        // you in a completely different neighborhood (e.g. Helen Kaunda when you're not).
        if (accuracy && accuracy > 200) {
          console.warn(`Skipping driver location update: accuracy ±${Math.round(accuracy)}m`);
          return;
        }

        const { error } = await supabase
          .from('driver_profiles')
          .update({
            current_location: { lat: latitude, lng: longitude }
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating driver location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location error',
          description: 'Unable to get your current location',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // Never use cached position — always get a fresh GPS fix
        timeout: 15000
      }
    );

    // Cleanup on unmount or when dependencies change
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user, isActive]);
}
