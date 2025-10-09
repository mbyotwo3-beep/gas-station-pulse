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
  brand?: string;
  photos?: string[];
  fuel_prices?: Record<string, number>;
  fuel_types?: string[];
  amenities?: string[];
  operating_hours?: Record<string, { open: string; close: string }>;
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    try {
      // Fetch all stations from the stations table
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('*');

      if (stationsError) throw stationsError;

      // Get latest status reports for each station
      const { data: reports, error: reportsError } = await supabase
        .from('station_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Create a map of latest status for each station
      const statusMap = new Map<string, any>();
      reports?.forEach(report => {
        if (!statusMap.has(report.station_id)) {
          statusMap.set(report.station_id, report);
        }
      });

      // Combine station data with latest status
      const stationData: Station[] = (stationsData || []).map(station => {
        const latestReport = statusMap.get(station.id);
        return {
          id: station.id,
          name: station.name,
          address: station.address,
          lat: station.lat,
          lng: station.lng,
          status: latestReport?.status || 'available',
          lastUpdated: latestReport?.created_at || station.created_at,
          note: latestReport?.note,
          brand: station.brand,
          photos: station.photos,
          fuel_prices: station.fuel_prices as Record<string, number> | undefined,
          fuel_types: station.fuel_types,
          amenities: station.amenities,
          operating_hours: station.operating_hours as Record<string, { open: string; close: string }> | undefined
        };
      });

      setStations(stationData);
      
    } catch (error) {
      console.error('Error fetching stations:', error);
      setStations([]);
      
      toast({
        title: 'Error loading stations',
        description: 'Failed to load fuel stations. Please refresh the page.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();

    // Set up realtime subscription for both stations and reports
    const stationsChannel = supabase
      .channel('station-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stations'
      }, () => {
        console.log('Station updated');
        fetchStations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'station_reports'
      }, () => {
        console.log('Station report updated');
        fetchStations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stationsChannel);
    };
  }, []);

  return { stations, loading, refetch: fetchStations };
}