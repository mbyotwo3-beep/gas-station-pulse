import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  preferences: {
    notifications: boolean;
    favorite_stations: string[];
  };
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Type cast the preferences from Json to our expected format
      if (data) {
        const typedProfile: UserProfile = {
          ...data,
          preferences: data.preferences as { notifications: boolean; favorite_stations: string[] }
        };
        setProfile(typedProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const toggleFavoriteStation = async (stationId: string) => {
    if (!profile) return;

    const currentFavorites = profile.preferences.favorite_stations || [];
    const isFavorite = currentFavorites.includes(stationId);
    
    const newFavorites = isFavorite
      ? currentFavorites.filter(id => id !== stationId)
      : [...currentFavorites, stationId];

    await updateProfile({
      preferences: {
        ...profile.preferences,
        favorite_stations: newFavorites
      }
    });
  };

  const isFavorite = (stationId: string): boolean => {
    return profile?.preferences.favorite_stations?.includes(stationId) || false;
  };

  useEffect(() => {
    fetchProfile();

    // Set up realtime subscription for profile changes
    if (user) {
      const channel = supabase
        .channel('profile-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          setProfile(payload.new as UserProfile);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    toggleFavoriteStation,
    isFavorite,
    refetch: fetchProfile
  };
}