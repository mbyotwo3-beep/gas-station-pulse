import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Route } from './useRouting';

interface AutoReroutingOptions {
  enabled: boolean;
  deviationThreshold?: number; // meters
  checkInterval?: number; // milliseconds
  onReroute?: () => void;
}

export function useAutoRerouting(
  route: Route | null,
  currentPosition: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number } | null,
  options: AutoReroutingOptions
) {
  const [isRerouting, setIsRerouting] = useState(false);
  const lastRerouteTime = useRef<number>(0);
  const rerouteTimeout = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const deviationThreshold = options.deviationThreshold || 50; // 50 meters default
  const checkInterval = options.checkInterval || 5000; // 5 seconds default
  const minRerouteInterval = 30000; // Minimum 30 seconds between reroutes

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Find the closest point on the route to the current position
  const findClosestPointOnRoute = useCallback((
    currentPos: { lat: number; lng: number },
    routeCoords: [number, number][]
  ): { distance: number; index: number } => {
    let minDistance = Infinity;
    let closestIndex = 0;

    routeCoords.forEach((coord, index) => {
      const distance = calculateDistance(
        currentPos.lat,
        currentPos.lng,
        coord[0],
        coord[1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return { distance: minDistance, index: closestIndex };
  }, [calculateDistance]);

  // Check if user has deviated from the route
  const checkDeviation = useCallback(() => {
    if (!options.enabled || !route || !currentPosition || !destination) {
      return false;
    }

    // Don't reroute if already rerouting
    if (isRerouting) {
      return false;
    }

    // Check if enough time has passed since last reroute
    const now = Date.now();
    if (now - lastRerouteTime.current < minRerouteInterval) {
      return false;
    }

    // Check if user has reached destination (within 20 meters)
    const distanceToDestination = calculateDistance(
      currentPosition.lat,
      currentPosition.lng,
      destination.lat,
      destination.lng
    );

    if (distanceToDestination < 20) {
      return false; // Don't reroute if near destination
    }

    // Find closest point on route
    const { distance } = findClosestPointOnRoute(
      currentPosition,
      route.coordinates
    );

    // Check if deviation exceeds threshold
    return distance > deviationThreshold;
  }, [
    options.enabled,
    route,
    currentPosition,
    destination,
    isRerouting,
    deviationThreshold,
    calculateDistance,
    findClosestPointOnRoute,
  ]);

  // Trigger reroute
  const triggerReroute = useCallback(() => {
    if (isRerouting || !options.onReroute) return;

    setIsRerouting(true);
    lastRerouteTime.current = Date.now();

    toast.info('Route recalculating...', {
      description: 'You deviated from the planned route',
      duration: 3000,
    });

    // Clear any pending reroute
    if (rerouteTimeout.current) {
      clearTimeout(rerouteTimeout.current);
    }

    // Add a small delay to avoid rapid rerouting
    rerouteTimeout.current = setTimeout(() => {
      options.onReroute();
      setIsRerouting(false);
    }, 1000);
  }, [isRerouting, options]);

  // Periodic check for deviation
  useEffect(() => {
    if (!options.enabled || !route || !currentPosition) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Initial check
    if (checkDeviation()) {
      triggerReroute();
    }

    // Set up periodic checks
    checkIntervalRef.current = setInterval(() => {
      if (checkDeviation()) {
        triggerReroute();
      }
    }, checkInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [
    options.enabled,
    route,
    currentPosition,
    checkInterval,
    checkDeviation,
    triggerReroute,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rerouteTimeout.current) {
        clearTimeout(rerouteTimeout.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    isRerouting,
  };
}
