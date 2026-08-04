import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  lat: number;
  lng: number;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavedLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLocations(((data || []) as any[]).map((r) => ({
        ...r,
        label: r.name,
        icon: r.type ?? 'map-pin',
        updated_at: r.created_at,
      })) as SavedLocation[]);
    } catch (err) {
      console.error('Error fetching saved locations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const saveLocation = async (label: string, icon: string, lat: number, lng: number, address?: string) => {
    if (!user) {
      toast.error('Please sign in to save locations');
      return false;
    }

    try {
      await supabase
        .from('saved_locations')
        .delete()
        .eq('user_id', user.id)
        .eq('name', label);

      const { error } = await supabase
        .from('saved_locations')
        .insert({ user_id: user.id, name: label, type: icon, lat, lng, address: address || null });

      if (error) throw error;
      toast.success(`"${label}" saved!`);
      await fetchLocations();
      return true;
    } catch (err: any) {
      console.error('Error saving location:', err);
      toast.error('Failed to save location');
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLocations(prev => prev.filter(l => l.id !== id));
      toast.success('Location removed');
    } catch (err) {
      console.error('Error deleting location:', err);
      toast.error('Failed to remove location');
    }
  };

  return { locations, loading, saveLocation, deleteLocation, refetch: fetchLocations };
}
