import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'available' | 'low' | 'out';
  lastUpdated?: string;
  note?: string;
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    try {
      // Get all station reports and group by station_id to get the latest status
      const { data: reports, error } = await supabase
        .from('station_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group reports by station_id and take the latest one for each station
      const stationMap = new Map<string, any>();
      
      reports?.forEach(report => {
        if (!stationMap.has(report.station_id)) {
          stationMap.set(report.station_id, report);
        }
      });

      // Convert to Station format with Lusaka coordinates as default
      const stationData: Station[] = Array.from(stationMap.values()).map((report, index) => ({
        id: report.station_id,
        name: report.station_name || `Station ${report.station_id}`,
        address: `Lusaka Station ${index + 1}`, // Default addresses in Lusaka
        // Scatter stations around Lusaka (-15.3875, 28.3228)
        lat: -15.3875 + (Math.random() - 0.5) * 0.1, // ±0.05 degrees around Lusaka
        lng: 28.3228 + (Math.random() - 0.5) * 0.1,
        status: report.status as 'available' | 'low' | 'out',
        lastUpdated: report.created_at,
        note: report.note
      }));

      // Add some default stations if no reports exist
      if (stationData.length === 0) {
        const defaultStations: Station[] = [
          {
            id: 'lusaka-central',
            name: 'Shell Lusaka Central',
            address: 'Cairo Road, Lusaka',
            lat: -15.3875,
            lng: 28.3228,
            status: 'available'
          },
          {
            id: 'lusaka-east',
            name: 'BP Kamwala',
            address: 'Kamwala Shopping Centre',
            lat: -15.4067,
            lng: 28.3400,
            status: 'low'
          },
          {
            id: 'lusaka-north',
            name: 'Total Northmead',
            address: 'Northmead Shopping Mall',
            lat: -15.3650,
            lng: 28.3350,
            status: 'available'
          }
        ];
        setStations(defaultStations);
      } else {
        setStations(stationData);
      }
      
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load station data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();

    // Set up realtime subscription for station reports
    const channel = supabase
      .channel('station-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'station_reports'
      }, (payload) => {
        console.log('Station update:', payload);
        fetchStations(); // Refetch when data changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stations, loading, refetch: fetchStations };
}