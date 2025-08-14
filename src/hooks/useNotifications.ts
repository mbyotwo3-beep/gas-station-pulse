import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferences {
  favoriteStationUpdates: boolean;
  lowFuelAlerts: boolean;
  newStationsNearby: boolean;
}

interface UseNotificationsReturn {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  hasPermission: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    favoriteStationUpdates: true,
    lowFuelAlerts: true,
    newStationsNearby: false,
  });
  const [hasPermission, setHasPermission] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Load user preferences
  useEffect(() => {
    if (user) {
      const loadPreferences = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();
        
        if (data?.preferences) {
          const prefs = data.preferences as any;
          if (prefs?.notifications) {
            setPreferences(prev => ({
              ...prev,
              ...prefs.notifications
            }));
          }
        }
      };
      
      loadPreferences();
    }
  }, [user]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications."
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings."
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll now receive updates about your favorite stations."
      });
    }
    
    return granted;
  }, []);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!user) return;

    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);

    // Save to database
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: {
          notifications: updatedPrefs
        }
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Failed to save preferences",
        description: error.message
      });
    } else {
      toast({
        title: "Preferences saved",
        description: "Your notification settings have been updated."
      });
    }
  }, [user, preferences]);

  // Show notification
  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (hasPermission && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }, [hasPermission]);

  // Listen for station updates for favorites
  useEffect(() => {
    if (!user || !preferences.favoriteStationUpdates) return;

    const channel = supabase
      .channel('favorite-station-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'station_reports'
        },
        (payload) => {
          const report = payload.new as any;
          // Check if this is a favorite station (you'd need to check user's favorites)
          showNotification(
            `${report.station_name} Updated`,
            `Status changed to ${report.status}${report.note ? ': ' + report.note : ''}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, preferences.favoriteStationUpdates, showNotification]);

  return {
    preferences,
    updatePreferences,
    requestNotificationPermission,
    hasPermission
  };
}