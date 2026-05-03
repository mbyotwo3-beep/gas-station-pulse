import { useEffect, useRef, useState } from 'react';
import type { Station } from '@/hooks/useStations';

/**
 * Live discovery of filling stations from OpenStreetMap (Overpass API, free).
 *
 * Scans around one or more centers (e.g. the user's GPS position and/or the currently
 * focused map point) within `radiusKm` and returns Station-shaped results so they can
 * be merged with the DB stations and rendered on the map.
 */
export interface OsmCenter {
  lat: number;
  lng: number;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery(centers: OsmCenter[], radiusM: number): string {
  const parts = centers
    .map(
      (c) =>
        `node["amenity"="fuel"](around:${radiusM},${c.lat},${c.lng});` +
        `way["amenity"="fuel"](around:${radiusM},${c.lat},${c.lng});`
    )
    .join('');
  return `[out:json][timeout:25];(${parts});out center tags;`;
}

function elementToStation(el: OverpassElement): Station | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;
  const tags = el.tags ?? {};
  const brand = tags.brand || tags['brand:en'] || tags.operator;
  const name =
    tags.name || tags['name:en'] || brand ? `${brand ?? 'Filling Station'}` : 'Filling Station';
  const address =
    tags['addr:full'] ||
    [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ') ||
    'Address unavailable';
  return {
    id: `osm-${el.type}-${el.id}`,
    name: tags.name || name,
    address,
    lat,
    lng,
    status: 'available',
    brand: brand || undefined,
  };
}

async function fetchOverpass(query: string, signal: AbortSignal): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal,
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch (err) {
      if ((err as any)?.name === 'AbortError') throw err;
      // try next mirror
    }
  }
  return [];
}

export function useOsmStations(centers: (OsmCenter | null | undefined)[], radiusKm = 10) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  // Stable key so we don't refetch on every render
  const valid = centers.filter(Boolean) as OsmCenter[];
  const key = valid
    .map((c) => `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`)
    .sort()
    .join('|') + `@${radiusKm}`;

  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    if (!valid.length) {
      setStations([]);
      return;
    }
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = buildQuery(valid, Math.round(radiusKm * 1000));
        const elements = await fetchOverpass(query, controller.signal);
        const mapped = elements
          .map(elementToStation)
          .filter((s): s is Station => s !== null);

        // Dedupe by id (Overpass can return duplicates across area scans)
        const byId = new Map<string, Station>();
        mapped.forEach((s) => byId.set(s.id, s));
        setStations(Array.from(byId.values()));
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.warn('OSM station fetch failed', err);
        }
      } finally {
        setLoading(false);
      }
    }, 500); // debounce

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, radiusKm]);

  return { osmStations: stations, osmLoading: loading };
}

/**
 * Merge DB stations with OSM-discovered stations.
 * DB stations always win; OSM stations within ~75m of any DB station are dropped
 * to avoid showing two pins for the same physical location.
 */
export function mergeStations(db: Station[], osm: Station[]): Station[] {
  if (!osm.length) return db;
  const tooClose = (a: Station, b: Station) => {
    const dLat = (a.lat - b.lat) * 111_000;
    const dLng = (a.lng - b.lng) * 111_000 * Math.cos((a.lat * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng) < 75;
  };
  const filtered = osm.filter((o) => !db.some((d) => tooClose(o, d)));
  return [...db, ...filtered];
}
