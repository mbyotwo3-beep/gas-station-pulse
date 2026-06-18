import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
}

const ACCEPT_ACCURACY_M = 500;
const DISCARD_ACCURACY_M = 2000;
const GPS_LOCK_TIMEOUT_MS = 30000;

export function useGeolocation(enableHighAccuracy = true, autoRequest = false) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    accuracy: null
  });
  const hasAutoRequested = useRef(false);
  const activeWatchId = useRef<number | null>(null);
  const activeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingWatchId = useRef<number | null>(null);

  const stopActiveWatch = useCallback(() => {
    if (activeWatchId.current !== null) {
      navigator.geolocation.clearWatch(activeWatchId.current);
      activeWatchId.current = null;
    }
    if (activeTimeout.current !== null) {
      clearTimeout(activeTimeout.current);
      activeTimeout.current = null;
    }
  }, []);

  const stopTrackingWatch = useCallback(() => {
    if (trackingWatchId.current !== null) {
      navigator.geolocation.clearWatch(trackingWatchId.current);
      trackingWatchId.current = null;
    }
  }, []);

  const applyTrustedPosition = useCallback((position: GeolocationPosition) => {
    const incomingAcc = position.coords.accuracy;

    setState(prev => {
      if (incomingAcc > DISCARD_ACCURACY_M && !prev.position) {
        return {
          ...prev,
          accuracy: incomingAcc,
          error: null,
        };
      }

      if (incomingAcc > ACCEPT_ACCURACY_M) {
        if (prev.position && prev.accuracy !== null && prev.accuracy <= ACCEPT_ACCURACY_M) {
          return prev;
        }

        const nextAccuracy = prev.accuracy === null ? incomingAcc : Math.min(prev.accuracy, incomingAcc);
        return {
          ...prev,
          accuracy: nextAccuracy,
          error: null,
        };
      }

      if (prev.accuracy !== null && prev.position) {
        const prevAcc = prev.accuracy;
        const age = position.timestamp - (prev.position.timestamp ?? 0);
        const bothUsable = prevAcc <= ACCEPT_ACCURACY_M && incomingAcc <= ACCEPT_ACCURACY_M;
        const tighter = incomingAcc <= prevAcc;
        const stale = age > 4000;
        const marginallyWorse = incomingAcc <= prevAcc * 1.5;

        // When both fixes are usable, always accept the newer one — real
        // movement can produce coordinate changes without accuracy changes,
        // and we don't want the UI to look "stuck" while the user moves.
        if (!bothUsable && !tighter && !stale && !marginallyWorse) {
          return prev;
        }
      }

      return {
        ...prev,
        position,
        accuracy: incomingAcc,
        error: null,
        loading: false,
      };
    });
  }, []);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) return null;

    stopTrackingWatch();

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 15000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      applyTrustedPosition,
      (error) => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
        }));
      },
      options
    );

    trackingWatchId.current = watchId;
    return watchId;
  }, [applyTrustedPosition, enableHighAccuracy, stopTrackingWatch]);

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

    stopActiveWatch();
    stopTrackingWatch();

    setState({ position: null, error: null, loading: true, accuracy: null });

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 15000,
      maximumAge: 0
    };

    let bestPosition: GeolocationPosition | null = null;
    let bestAccuracy = Infinity;
    let toastShown = false;
    let resolved = false;

    const finishWithTracking = () => {
      stopActiveWatch();
      watchLocation();
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const acc = position.coords.accuracy;

        if (acc > DISCARD_ACCURACY_M && bestAccuracy === Infinity) {
          setState(prev => ({ ...prev, accuracy: acc, error: null }));
          return;
        }

        if (acc >= bestAccuracy) return;
        bestAccuracy = acc;
        bestPosition = position;

        if (acc <= ACCEPT_ACCURACY_M) {
          resolved = true;
          applyTrustedPosition(position);
          finishWithTracking();
          if (!toastShown) {
            toastShown = true;
            toast({
              title: 'Location Found',
              description: `Accurate to ±${Math.round(acc)}m.`
            });
          }
        } else {
          setState(prev => ({
            ...prev,
            accuracy: acc,
            error: null,
            loading: true,
          }));
        }
      },
      (error) => {
        let message = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            stopActiveWatch();
            setState(prev => ({ ...prev, error, loading: false }));
            toast({ title: 'Location Error', description: message, variant: 'destructive' });
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Location information is unavailable; GPS is still retrying…');
            break;
          case error.TIMEOUT:
            console.warn('Geolocation watch timed out; GPS is still retrying…');
            break;
        }
      },
      options
    );

    activeWatchId.current = watchId;

    activeTimeout.current = setTimeout(() => {
      if (!resolved) {
        finishWithTracking();
        setState(prev => ({ ...prev, loading: false }));

        if (bestPosition && bestAccuracy <= ACCEPT_ACCURACY_M) {
          applyTrustedPosition(bestPosition);
          return;
        }

        if (!toastShown) {
          toastShown = true;
          toast({
            title: bestAccuracy === Infinity ? 'GPS lock failed' : 'GPS still warming up',
            description: bestAccuracy === Infinity
              ? 'Could not get an accurate GPS fix. Move outdoors or search your address manually.'
              : `Best fix so far: ±${Math.round(bestAccuracy)}m. Move outdoors or search your address manually.`,
            variant: 'destructive'
          });
        }
      }
    }, GPS_LOCK_TIMEOUT_MS);
  }, [applyTrustedPosition, enableHighAccuracy, stopActiveWatch, stopTrackingWatch, watchLocation]);

  useEffect(() => () => {
    stopActiveWatch();
    stopTrackingWatch();
  }, [stopActiveWatch, stopTrackingWatch]);

  useEffect(() => {
    if (autoRequest && !hasAutoRequested.current) {
      hasAutoRequested.current = true;
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  const clearLocation = useCallback(() => {
    stopActiveWatch();
    stopTrackingWatch();
    setState({
      position: null,
      error: null,
      loading: false,
      accuracy: null
    });
  }, [stopActiveWatch, stopTrackingWatch]);

  const getLocationOrDefault = useCallback(() => {
    if (state.position) {
      return {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude,
        label: 'Your Location'
      };
    }
    
    return {
      lat: -15.3875,
      lng: 28.3228,
      label: 'Lusaka, Zambia'
    };
  }, [state.position]);

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
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
