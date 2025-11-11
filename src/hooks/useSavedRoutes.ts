import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Waypoint } from '@/components/map/WaypointsManager';

export interface SavedRoute {
  id: string;
  user_id: string;
  name: string;
  start_location: {
    lat: number;
    lng: number;
    label?: string;
  };
  end_location: {
    lat: number;
    lng: number;
    label?: string;
  };
  waypoints: Waypoint[];
  created_at: string;
  updated_at: string;
}

export function useSavedRoutes() {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_routes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Type cast the JSONB fields
      const typedData = (data || []).map(route => ({
        ...route,
        start_location: route.start_location as unknown as SavedRoute['start_location'],
        end_location: route.end_location as unknown as SavedRoute['end_location'],
        waypoints: (route.waypoints as unknown as Waypoint[]) || []
      }));

      setSavedRoutes(typedData);
    } catch (error) {
      console.error('Error fetching saved routes:', error);
      toast.error('Failed to load saved routes');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRoute = useCallback(async (
    name: string,
    startLocation: { lat: number; lng: number; label?: string },
    endLocation: { lat: number; lng: number; label?: string },
    waypoints: Waypoint[] = []
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save routes');
        return false;
      }

      const { error } = await supabase
        .from('saved_routes')
        .insert([{
          user_id: user.id,
          name,
          start_location: startLocation as any,
          end_location: endLocation as any,
          waypoints: waypoints.map(wp => ({
            id: wp.id,
            lat: wp.lat,
            lng: wp.lng,
            label: wp.label
          })) as any
        }]);

      if (error) throw error;

      toast.success('Route saved successfully');
      await fetchSavedRoutes();
      return true;
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
      return false;
    }
  }, [fetchSavedRoutes]);

  const deleteRoute = useCallback(async (routeId: string) => {
    try {
      const { error } = await supabase
        .from('saved_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      toast.success('Route deleted');
      await fetchSavedRoutes();
      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
      return false;
    }
  }, [fetchSavedRoutes]);

  const updateRoute = useCallback(async (
    routeId: string,
    name: string
  ) => {
    try {
      const { error } = await supabase
        .from('saved_routes')
        .update({ name } as any)
        .eq('id', routeId);

      if (error) throw error;

      toast.success('Route updated');
      await fetchSavedRoutes();
      return true;
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
      return false;
    }
  }, [fetchSavedRoutes]);

  useEffect(() => {
    fetchSavedRoutes();
  }, [fetchSavedRoutes]);

  return {
    savedRoutes,
    loading,
    saveRoute,
    deleteRoute,
    updateRoute,
    refetch: fetchSavedRoutes,
  };
}
