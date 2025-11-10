import { useState, useCallback } from 'react';
import { toast } from 'sonner';

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
}

export function useRouting() {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);

  const getRoute = useCallback(async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    waypoints?: { lat: number; lng: number }[]
  ) => {
    setLoading(true);
    try {
      // Build coordinates string with waypoints
      const coordsString = [
        `${start.lng},${start.lat}`,
        ...(waypoints || []).map(wp => `${wp.lng},${wp.lat}`),
        `${end.lng},${end.lat}`
      ].join(';');
      
      // Using OSRM public API for routing with waypoints
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const routeData = data.routes[0];
      const coordinates: [number, number][] = routeData.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
      
      const steps: RouteStep[] = [];
      routeData.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          steps.push({
            instruction: step.maneuver.instruction || getInstructionText(step.maneuver),
            distance: step.distance,
            duration: step.duration,
            maneuver: {
              type: step.maneuver.type,
              modifier: step.maneuver.modifier,
            },
          });
        });
      });

      const routeInfo: Route = {
        coordinates,
        steps,
        distance: routeData.distance,
        duration: routeData.duration,
      };

      setRoute(routeInfo);
      return routeInfo;
    } catch (error) {
      console.error('Routing error:', error);
      toast.error('Failed to get route directions');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
  }, []);

  return {
    route,
    loading,
    getRoute,
    clearRoute,
  };
}

function getInstructionText(maneuver: any): string {
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  if (type === 'depart') return 'Head ' + (modifier || 'straight');
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
