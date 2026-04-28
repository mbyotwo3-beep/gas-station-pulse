import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
}

export function useGeolocation(enableHighAccuracy = true, autoRequest = false) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    accuracy: null
  });
  const hasAutoRequested = useRef(false);

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
      timeout: 15000,
      maximumAge: 0 // Always get fresh position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position,
          error: null,
          loading: false,
          accuracy: position.coords.accuracy
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

  // Auto-request location on mount if enabled
  useEffect(() => {
    if (autoRequest && !hasAutoRequested.current) {
      hasAutoRequested.current = true;
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return null;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 20000,
      maximumAge: 0 // Always get fresh position for tracking
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        setState(prev => {
          const incomingAcc = position.coords.accuracy;
          const prevAcc = prev.accuracy;
          const prevTs = prev.position?.timestamp ?? 0;
          const incomingTs = position.timestamp;

          // Uber-style filtering:
          // 1. Ignore impossibly bad first-fix samples (>2km) unless we have nothing.
          // 2. If we already have a tighter fix, keep it unless:
          //    - the new fix is tighter OR equal, OR
          //    - the previous fix is older than 8s (stale), OR
          //    - the new fix is only marginally worse (<1.5x) and recent.
          if (prevAcc !== null && prev.position) {
            const age = incomingTs - prevTs;
            const tighter = incomingAcc <= prevAcc;
            const stale = age > 8000;
            const marginallyWorse = incomingAcc <= prevAcc * 1.5;

            if (!tighter && !stale && !marginallyWorse) {
              // Reject this noisy sample — keep the better fix we already have.
              return prev;
            }
          } else if (incomingAcc > 2000) {
            // First fix is garbage — wait for a better one.
            return prev;
          }

          return {
            ...prev,
            position,
            accuracy: incomingAcc,
            error: null,
            loading: false,
          };
        });
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
      loading: false,
      accuracy: null
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