import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export type TransportMode = 'driving' | 'cycling' | 'walking';

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
  };
}

export interface Route {
  coordinates: [number, number][];
  steps: RouteStep[];
  distance: number;
  duration: number;
  index?: number;
  type?: 'fastest' | 'shortest' | 'alternative';
  transportMode?: TransportMode;
}

// OSRM routing endpoints - primary and fallback
const OSRM_ENDPOINTS: Record<TransportMode, string[]> = {
  driving: [
    'https://router.project-osrm.org/route/v1/driving/',
    'https://routing.openstreetmap.de/routed-car/route/v1/driving/',
  ],
  cycling: [
    'https://routing.openstreetmap.de/routed-bike/route/v1/driving/',
  ],
  walking: [
    'https://routing.openstreetmap.de/routed-foot/route/v1/driving/',
  ],
};

async function fetchRouteFromOSRM(
  coordsString: string,
  endpoints: string[]
): Promise<any> {
  for (const baseUrl of endpoints) {
    try {
      const url = `${baseUrl}${coordsString}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      console.log('Fetching route from:', url);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.warn(`OSRM endpoint ${baseUrl} returned ${response.status}, trying next...`);
        continue;
      }
      
      const data = await response.json();
      if (data.code === 'Ok' && data.routes?.length > 0) {
        console.log(`Route found via ${baseUrl} with ${data.routes[0].geometry.coordinates.length} points`);
        return data;
      }
      console.warn(`OSRM endpoint ${baseUrl} returned no routes, trying next...`);
    } catch (err) {
      console.warn(`OSRM endpoint ${baseUrl} failed:`, err);
      continue;
    }
  }
  return null;
}

export function useRouting() {
  const [route, setRoute] = useState<Route | null>(null);
  const [routeAlternatives, setRouteAlternatives] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');

  const getRoute = useCallback(async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    waypoints?: { lat: number; lng: number }[],
    mode?: TransportMode
  ) => {
    const activeMode = mode || transportMode;
    setLoading(true);
    
    try {
      // Build coordinates string with waypoints
      const coordsString = [
        `${start.lng},${start.lat}`,
        ...(waypoints || []).map(wp => `${wp.lng},${wp.lat}`),
        `${end.lng},${end.lat}`
      ].join(';');
      
      const endpoints = OSRM_ENDPOINTS[activeMode];
      const data = await fetchRouteFromOSRM(coordsString, endpoints);

      if (!data) {
        throw new Error('All routing servers failed. Please try again.');
      }

      // Parse all available routes
      const allRoutes: Route[] = data.routes.map((routeData: any, index: number) => {
        const coordinates: [number, number][] = routeData.geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );
        
        console.log(`Route ${index} has ${coordinates.length} coordinate points`);
        
        const steps: RouteStep[] = [];
        routeData.legs.forEach((leg: any) => {
          leg.steps.forEach((step: any) => {
            steps.push({
              instruction: step.maneuver.instruction || getInstructionText(step.maneuver, activeMode),
              distance: step.distance,
              duration: step.duration,
              maneuver: {
                type: step.maneuver.type,
                modifier: step.maneuver.modifier,
              },
            });
          });
        });

        // Determine route type
        let type: 'fastest' | 'shortest' | 'alternative' = 'alternative';
        if (index === 0) {
          type = 'fastest';
        } else if (data.routes.length > 1) {
          const firstRoute = data.routes[0];
          if (routeData.distance < firstRoute.distance) {
            type = 'shortest';
          }
        }

        return {
          coordinates,
          steps,
          distance: routeData.distance,
          duration: routeData.duration,
          index,
          type,
          transportMode: activeMode,
        };
      });

      // Set the fastest route as the primary route
      setRoute(allRoutes[0]);
      setRouteAlternatives(allRoutes);
      toast.success(`Route found: ${(allRoutes[0].distance / 1000).toFixed(1)}km via ${activeMode}`);
      return allRoutes[0];
    } catch (error) {
      console.error('Routing error:', error);
      toast.error('Failed to get route directions. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [transportMode]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setRouteAlternatives([]);
  }, []);

  const selectRoute = useCallback((routeIndex: number) => {
    const selectedRoute = routeAlternatives.find(r => r.index === routeIndex);
    if (selectedRoute) {
      setRoute(selectedRoute);
    }
  }, [routeAlternatives]);

  const changeTransportMode = useCallback((mode: TransportMode) => {
    setTransportMode(mode);
  }, []);

  return {
    route,
    routeAlternatives,
    loading,
    transportMode,
    getRoute,
    clearRoute,
    selectRoute,
    changeTransportMode,
  };
}

function getInstructionText(maneuver: any, mode: TransportMode): string {
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  const modeVerb = mode === 'walking' ? 'Walk' : mode === 'cycling' ? 'Cycle' : 'Drive';

  if (type === 'depart') return `${modeVerb} ${modifier || 'straight'}`;
  if (type === 'arrive') return 'You have arrived at your destination';
  if (type === 'turn') {
    if (modifier === 'left') return 'Turn left';
    if (modifier === 'right') return 'Turn right';
    if (modifier === 'slight left') return 'Slight left';
    if (modifier === 'slight right') return 'Slight right';
    if (modifier === 'sharp left') return 'Sharp left';
    if (modifier === 'sharp right') return 'Sharp right';
  }
  if (type === 'continue') return 'Continue straight';
  if (type === 'roundabout') return 'Take the roundabout';
  if (type === 'rotary') return 'Take the rotary';

  return 'Continue';
}