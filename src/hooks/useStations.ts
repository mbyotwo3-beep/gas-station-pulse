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

      // Use fetched data or fallback to default stations
      if (stationData.length > 0) {
        setStations(stationData);
      } else {
        // Default stations for Lusaka area
        const defaultStations: Station[] = [
          {
            id: 'lusaka-central',
            name: 'Shell Lusaka Central',
            address: 'Cairo Road, Lusaka',
            lat: -15.4067,
            lng: 28.2871,
            status: 'available',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lusaka-kabulonga',
            name: 'Total Kabulonga',
            address: 'Kabulonga Shopping Mall',
            lat: -15.3928,
            lng: 28.3152,
            status: 'low',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lusaka-woodlands',
            name: 'BP Woodlands',
            address: 'Great East Road, Woodlands',
            lat: -15.3654,
            lng: 28.3891,
            status: 'available',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lusaka-roma',
            name: 'Puma Roma',
            address: 'Roma Township, Lusaka',
            lat: -15.3598,
            lng: 28.2654,
            status: 'out',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lusaka-chelston',
            name: 'Shell Chelston',
            address: 'Chelston Shopping Centre',
            lat: -15.4234,
            lng: 28.3456,
            status: 'available',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'lusaka-chilanga',
            name: 'Total Chilanga',
            address: 'Chilanga Road',
            lat: -15.5123,
            lng: 28.2987,
            status: 'low',
            lastUpdated: new Date().toISOString()
          }
        ];
        setStations(defaultStations);
      }
      
    } catch (error) {
      console.error('Error fetching stations:', error);
      
      // Always show fallback stations when there's an error
      const fallbackStations: Station[] = [
        {
          id: 'lusaka-central',
          name: 'Shell Lusaka Central',
          address: 'Cairo Road, Lusaka',
          lat: -15.4067,
          lng: 28.2871,
          status: 'available',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lusaka-kabulonga',
          name: 'Total Kabulonga',
          address: 'Kabulonga Shopping Mall',
          lat: -15.3928,
          lng: 28.3152,
          status: 'low',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lusaka-woodlands',
          name: 'BP Woodlands',
          address: 'Great East Road, Woodlands',
          lat: -15.3654,
          lng: 28.3891,
          status: 'available',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lusaka-roma',
          name: 'Puma Roma',
          address: 'Roma Township, Lusaka',
          lat: -15.3598,
          lng: 28.2654,
          status: 'out',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lusaka-chelston',
          name: 'Shell Chelston',
          address: 'Chelston Shopping Centre',
          lat: -15.4234,
          lng: 28.3456,
          status: 'available',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'lusaka-chilanga',
          name: 'Total Chilanga',
          address: 'Chilanga Road',
          lat: -15.5123,
          lng: 28.2987,
          status: 'low',  
          lastUpdated: new Date().toISOString()
        }
      ];
      setStations(fallbackStations);
      
      toast({
        title: 'Using Demo Data',
        description: 'Showing sample stations around Lusaka',
        variant: 'default'
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