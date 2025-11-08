import { useEffect, useCallback, useRef } from 'react';
import { Route, RouteStep } from './useRouting';

export function useVoiceNavigation(
  route: Route | null,
  userLocation: { lat: number; lng: number } | null,
  enabled: boolean = false
) {
  const synth = useRef<SpeechSynthesis | null>(null);
  const currentStepIndexRef = useRef(0);
  const announcedStepsRef = useRef<Set<number>>(new Set());
  const lastAnnouncementRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synth.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth.current || !enabled) return;

    // Cancel any ongoing speech
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    synth.current.speak(utterance);
  }, [enabled]);

  const calculateDistance = (
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
  };

  const announceUpcomingStep = useCallback((step: RouteStep, distance: number) => {
    const now = Date.now();
    // Prevent announcing the same thing too frequently
    if (now - lastAnnouncementRef.current < 5000) return;
    
    lastAnnouncementRef.current = now;

    let announcement = '';
    
    if (distance < 50) {
      announcement = `${step.instruction}`;
    } else if (distance < 200) {
      announcement = `In 200 meters, ${step.instruction}`;
    } else if (distance < 500) {
      announcement = `In 500 meters, ${step.instruction}`;
    }

    if (announcement) {
      speak(announcement);
    }
  }, [speak]);

  useEffect(() => {
    if (!route || !userLocation || !enabled) {
      currentStepIndexRef.current = 0;
      announcedStepsRef.current.clear();
      return;
    }

    // Find the closest point on the route to the user
    let closestDistance = Infinity;
    let closestStepIndex = 0;

    route.steps.forEach((step, index) => {
      const stepCoords = route.coordinates[index];
      if (stepCoords) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          stepCoords[0],
          stepCoords[1]
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestStepIndex = index;
        }
      }
    });

    // Check if we've moved to a new step
    if (closestStepIndex !== currentStepIndexRef.current) {
      currentStepIndexRef.current = closestStepIndex;
      announcedStepsRef.current.clear();
    }

    // Look ahead for upcoming steps
    const lookAheadSteps = 2;
    for (let i = closestStepIndex; i < Math.min(closestStepIndex + lookAheadSteps, route.steps.length); i++) {
      const step = route.steps[i];
      const stepCoords = route.coordinates[i];
      
      if (stepCoords && !announcedStepsRef.current.has(i)) {
        const distanceToStep = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          stepCoords[0],
          stepCoords[1]
        );

        // Announce steps within 500 meters
        if (distanceToStep < 500) {
          announceUpcomingStep(step, distanceToStep);
          announcedStepsRef.current.add(i);
          break; // Only announce one step at a time
        }
      }
    }

    // Check if we've reached the destination
    const lastCoord = route.coordinates[route.coordinates.length - 1];
    if (lastCoord) {
      const distanceToEnd = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        lastCoord[0],
        lastCoord[1]
      );

      if (distanceToEnd < 50 && !announcedStepsRef.current.has(-1)) {
        speak('You have arrived at your destination');
        announcedStepsRef.current.add(-1);
      }
    }
  }, [route, userLocation, enabled, announceUpcomingStep, speak]);

  const startNavigation = useCallback(() => {
    if (!route) return;
    
    announcedStepsRef.current.clear();
    currentStepIndexRef.current = 0;
    
    speak('Navigation started');
  }, [route, speak]);

  const stopNavigation = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
    }
    announcedStepsRef.current.clear();
    currentStepIndexRef.current = 0;
  }, []);

  return {
    startNavigation,
    stopNavigation,
    speak,
  };
}
