import { useState, useCallback } from 'react';
import type { SavedRoute } from './useSavedRoutes';
import type { Route, TransportMode } from './useRouting';

interface OptimizationSuggestion {
  routeId: string;
  routeName: string;
  currentEstimate: {
    distance: number;
    duration: number;
  };
  suggestedRoute: Omit<Route, 'transportMode'> & { transportMode?: TransportMode };
  savings: {
    distance: number;
    duration: number;
    percentage: number;
  };
}

const OSRM_PROFILES: Record<TransportMode, string> = {
  driving: 'driving',
  cycling: 'bike',
  walking: 'foot',
};

export function useRouteOptimization() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeRoutes = useCallback(async (routes: SavedRoute[], mode: TransportMode = 'driving') => {
    if (routes.length === 0) return;

    setLoading(true);
    const newSuggestions: OptimizationSuggestion[] = [];
    const profile = OSRM_PROFILES[mode];

    try {
      for (const route of routes) {
        // Build coordinates string for OSRM
        const waypoints = route.waypoints || [];
        const coordinates = [
          `${route.start_location.lng},${route.start_location.lat}`,
          ...waypoints.map(wp => `${wp.lng},${wp.lat}`),
          `${route.end_location.lng},${route.end_location.lat}`
        ].join(';');

        // Fetch alternative routes from OSRM with appropriate profile
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?alternatives=3&overview=full&geometries=geojson&steps=true`
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.routes && data.routes.length > 1) {
          // Current route is typically the first one
          const currentRoute = data.routes[0];
          
          // Find the best alternative that's significantly better
          for (let i = 1; i < data.routes.length; i++) {
            const alternative = data.routes[i];
            
            const distanceSavings = currentRoute.distance - alternative.distance;
            const durationSavings = currentRoute.duration - alternative.duration;
            const savingsPercentage = (durationSavings / currentRoute.duration) * 100;

            // Only suggest if savings are significant (>10% time or >15% distance)
            if (savingsPercentage > 10 || (distanceSavings / currentRoute.distance) * 100 > 15) {
              newSuggestions.push({
                routeId: route.id,
                routeName: route.name,
                currentEstimate: {
                  distance: currentRoute.distance,
                  duration: currentRoute.duration
                },
                suggestedRoute: {
                  coordinates: alternative.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
                  distance: alternative.distance,
                  duration: alternative.duration,
                  transportMode: mode,
                  steps: alternative.legs[0]?.steps.map((step: any) => ({
                    instruction: step.maneuver.type,
                    distance: step.distance,
                    duration: step.duration,
                    maneuver: {
                      type: step.maneuver.type,
                      modifier: step.maneuver.modifier
                    }
                  })) || []
                },
                savings: {
                  distance: distanceSavings,
                  duration: durationSavings,
                  percentage: savingsPercentage
                }
              });
              break; // Only show one suggestion per route
            }
          }
        }
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error analyzing routes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    analyzeRoutes,
    clearSuggestions
  };
}