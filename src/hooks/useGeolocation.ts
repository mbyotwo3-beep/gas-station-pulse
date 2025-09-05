import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser.') as any;
      setState(prev => ({ ...prev, error, loading: false }));
      toast({
        title: 'Location Not Supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive'
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position,
          error: null,
          loading: false
        });
        toast({
          title: 'Location Found',
          description: 'Successfully retrieved your location.'
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error,
          loading: false
        }));

        let message = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }

        toast({
          title: 'Location Error',
          description: message,
          variant: 'destructive'
        });
      },
      options
    );
  }, [enableHighAccuracy]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return null;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          position,
          error: null
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error
        }));
      },
      options
    );
  }, [enableHighAccuracy]);

  const clearLocation = useCallback(() => {
    setState({
      position: null,
      error: null,
      loading: false
    });
  }, []);

  // Default to Lusaka, Zambia if no location is available
  const getLocationOrDefault = useCallback(() => {
    if (state.position) {
      return {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude,
        label: 'Your Location'
      };
    }
    
    return {
      lat: -15.3875, // Lusaka coordinates
      lng: 28.3228,
      label: 'Lusaka, Zambia'
    };
  }, [state.position]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  return {
    ...state,
    requestLocation,
    watchLocation,
    clearLocation,
    getLocationOrDefault,
    calculateDistance
  };
}