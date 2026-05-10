import { useState, useEffect, useCallback } from 'react';
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

const CACHE_KEY = 'ff_stations_cache_v1';
const CACHE_META_KEY = 'ff_stations_cache_meta_v1';
const FETCH_TIMEOUT_MS = 12000;

interface CacheMeta {
  cachedAt: number;
  count: number;
}

function readCache(): { stations: Station[]; meta: CacheMeta | null } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const metaRaw = localStorage.getItem(CACHE_META_KEY);
    if (!raw) return { stations: [], meta: null };
    return {
      stations: JSON.parse(raw) as Station[],
      meta: metaRaw ? (JSON.parse(metaRaw) as CacheMeta) : null,
    };
  } catch {
    return { stations: [], meta: null };
  }
}

function writeCache(stations: Station[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stations));
    localStorage.setItem(
      CACHE_META_KEY,
      JSON.stringify({ cachedAt: Date.now(), count: stations.length } satisfies CacheMeta),
    );
  } catch (err) {
    console.warn('Failed to cache stations:', err);
  }
}

export function useStations() {
  // Hydrate immediately from cache so the app is useful offline / on slow networks
  const initial = readCache();
  const startsOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const [stations, setStations] = useState<Station[]>(initial.stations);
  const [loading, setLoading] = useState(initial.stations.length === 0);
  const [isStale, setIsStale] = useState(initial.stations.length > 0 && startsOffline);
  const [cacheMeta, setCacheMeta] = useState<CacheMeta | null>(initial.meta);

  const fetchStations = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const { data: stationsData, error: stationsError } = await supabase
        .from('stations')
        .select('*')
        .abortSignal(controller.signal);

      if (stationsError) throw stationsError;

      const { data: reports, error: reportsError } = await supabase
        .from('station_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      if (reportsError) throw reportsError;

      const statusMap = new Map<string, any>();
      reports?.forEach(report => {
        if (!statusMap.has(report.station_id)) {
          statusMap.set(report.station_id, report);
        }
      });

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
          operating_hours: station.operating_hours as Record<string, { open: string; close: string }> | undefined,
        };
      });

      setStations(stationData);
      setIsStale(false);
      writeCache(stationData);
      setCacheMeta({ cachedAt: Date.now(), count: stationData.length });
    } catch (error) {
      console.error('Error fetching stations:', error);
      const { stations: cached, meta } = readCache();
      if (cached.length > 0) {
        setStations(cached);
        setCacheMeta(meta);
        setIsStale(true);
        toast({
          title: 'Showing cached stations',
          description: meta
            ? `Last updated ${new Date(meta.cachedAt).toLocaleString()}. Connect to refresh.`
            : 'You appear to be offline. Showing the last saved list.',
        });
      } else {
        setStations([]);
        toast({
          title: 'Error loading stations',
          description: 'Failed to load fuel stations. Please check your connection.',
          variant: 'destructive',
        });
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();

    const stationsChannel = supabase
      .channel('station-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stations' }, () => {
        fetchStations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'station_reports' }, () => {
        fetchStations();
      })
      .subscribe();

    // When the browser comes back online, refresh
    const onOnline = () => fetchStations();
    window.addEventListener('online', onOnline);

    return () => {
      supabase.removeChannel(stationsChannel);
      window.removeEventListener('online', onOnline);
    };
  }, [fetchStations]);

  return { stations, loading, refetch: fetchStations, isStale, cacheMeta };
}
