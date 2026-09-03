import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station } from '@/hooks/useStations';
import { cn } from '@/lib/utils';
import { Route } from '@/hooks/useRouting';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { OPENFREEMAP_STYLE, LUSAKA_CENTER } from './MapLibreMap';

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Rough circle polygon for the GPS accuracy halo. */
function circlePolygon(lat: number, lng: number, radiusMeters: number, steps = 64) {
  const coords: [number, number][] = [];
  const latR = radiusMeters / 111320;
  const lngR = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + lngR * Math.cos(t), lat + latR * Math.sin(t)]);
  }
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
  };
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export interface StationMapProps {
  stations: Station[];
  onSelect?: (s: Station) => void;
  className?: string;
  focusPoint?: { lat: number; lng: number; label?: string } | null;
  route?: Route | null;
  waypoints?: Waypoint[];
  /** Radius in meters for the GPS accuracy circle around focusPoint. */
  accuracyRadius?: number | null;
  /** When true the focus point is a live GPS reading: directional arrow + follow mode. */
  isLiveLocation?: boolean;
}

export interface StationMapHandle {
  recenter: (zoom?: number) => void;
}

const SRC_STATIONS = 'stations-src';
const SRC_ROUTE = 'route-src';
const SRC_ACCURACY = 'accuracy-src';

function stationFeatures(stations: Station[], selectedId: string | null) {
  return {
    type: 'FeatureCollection' as const,
    features: stations.map((s) => ({
      type: 'Feature' as const,
      id: s.id,
      properties: {
        id: s.id,
        name: s.name,
        status: s.status,
        selected: s.id === selectedId ? 1 : 0,
      },
      geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
    })),
  };
}

function buildLiveMarkerEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'position:relative;width:36px;height:36px;pointer-events:none;';
  el.innerHTML = `
    <div data-arrow style="
      position:absolute;left:50%;top:50%;width:0;height:0;
      border-left:9px solid transparent;border-right:9px solid transparent;
      border-bottom:18px solid hsl(217 91% 60%);
      transform:translate(-50%,-130%) rotate(0deg);transform-origin:50% 130%;
      filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));
      transition:transform 250ms ease-out;display:none;"></div>
    <div style="
      position:absolute;left:50%;top:50%;width:18px;height:18px;border-radius:9999px;
      background:hsl(217 91% 60%);border:3px solid #fff;transform:translate(-50%,-50%);
      box-shadow:0 0 0 1px rgba(0,0,0,0.15),0 2px 6px rgba(0,0,0,0.35);"></div>`;
  return el;
}

/**
 * Fuel-station map on MapLibre GL + free OpenFreeMap vector tiles.
 * Keeps the previous behaviour: persistent selection highlight, follow mode that
 * disengages the moment the user pans, bold blue route with dark navy outline,
 * and no attribution controls.
 */
const StationMap = forwardRef<StationMapHandle, StationMapProps>(function StationMap(
  {
    stations,
    onSelect,
    className,
    focusPoint,
    route,
    waypoints = [],
    accuracyRadius = null,
    isLiveLocation = false,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const focusRef = useRef(focusPoint);
  focusRef.current = focusPoint;

  const focusMarkerRef = useRef<maplibregl.Marker | null>(null);
  const waypointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const headingRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const didInitialFitRef = useRef(false);

  const [followMode, setFollowMode] = useState(true);
  const followModeRef = useRef(followMode);
  followModeRef.current = followMode;
  const programmaticRef = useRef(false);

  // ── Init map ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: LUSAKA_CENTER,
      zoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const disengage = () => {
      if (programmaticRef.current) return;
      if (followModeRef.current) setFollowMode(false);
    };
    map.on('dragstart', disengage);
    map.on('wheel', disengage);

    map.on('load', () => {
      map.addSource(SRC_ACCURACY, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'accuracy-fill',
        type: 'fill',
        source: SRC_ACCURACY,
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 },
      });
      map.addLayer({
        id: 'accuracy-line',
        type: 'line',
        source: SRC_ACCURACY,
        paint: { 'line-color': '#2563eb', 'line-width': 1, 'line-opacity': 0.6 },
      });

      map.addSource(SRC_ROUTE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'route-outline',
        type: 'line',
        source: SRC_ROUTE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1a1a2e', 'line-width': 10, 'line-opacity': 0.7 },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: SRC_ROUTE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 6 },
      });

      map.addSource(SRC_STATIONS, {
        type: 'geojson',
        data: stationFeatures(stationsRef.current, selectedIdRef.current),
      });
      map.addLayer({
        id: 'station-circles',
        type: 'circle',
        source: SRC_STATIONS,
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], 1], 12, 8],
          'circle-color': [
            'match',
            ['get', 'status'],
            'available', '#16a34a',
            'low', '#f59e0b',
            '#dc2626',
          ],
          'circle-opacity': ['case', ['==', ['get', 'selected'], 1], 1, 0.85],
          'circle-stroke-width': ['case', ['==', ['get', 'selected'], 1], 4, 2],
          'circle-stroke-color': '#ffffff',
          'circle-radius-transition': { duration: 200, delay: 0 },
          'circle-color-transition': { duration: 300, delay: 0 },
        },
      });

      map.on('click', 'station-circles', (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        const station = stationsRef.current.find((s) => s.id === id);
        if (!station) return;
        setSelectedId(id);
        onSelectRef.current?.(station);
      });
      map.on('mouseenter', 'station-circles', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const id = e.features?.[0]?.properties?.id as string | undefined;
        const station = stationsRef.current.find((s) => s.id === id);
        if (!station) return;
        const statusText =
          station.status === 'available'
            ? 'Available'
            : station.status === 'low'
              ? 'Low Supply'
              : 'Out of Fuel';
        const fp = focusRef.current;
        const dist = fp
          ? `<br><span style="font-size:11px">${formatDistance(
              calculateDistance(fp.lat, fp.lng, station.lat, station.lng),
            )} away</span>`
          : '';
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 12 })
          .setLngLat([station.lng, station.lat])
          .setHTML(
            `<div style="text-align:center;font-size:12px"><strong>${station.name}</strong><br>${statusText}${dist}</div>`,
          )
          .addTo(map);
      });
      map.on('mouseleave', 'station-circles', () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
        popupRef.current = null;
      });

      setLoaded(true);
    });

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Device compass heading ─────────────────────────────────────────────
  useEffect(() => {
    if (!isLiveLocation) return;
    const handler = (e: DeviceOrientationEvent) => {
      const wch = (e as any).webkitCompassHeading;
      if (typeof wch === 'number' && !Number.isNaN(wch)) {
        headingRef.current = wch;
        return;
      }
      if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        headingRef.current = (360 - e.alpha) % 360;
      }
    };
    window.addEventListener('deviceorientationabsolute' as any, handler as any, true);
    window.addEventListener('deviceorientation', handler, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handler as any, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, [isLiveLocation]);

  // ── Stations data (in-place source update, no marker rebuild) ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const src = map.getSource(SRC_STATIONS) as maplibregl.GeoJSONSource | undefined;
    src?.setData(stationFeatures(stations, selectedId) as any);

    if (!didInitialFitRef.current && stations.length > 0 && !focusPoint) {
      const b = new maplibregl.LngLatBounds();
      stations.forEach((s) => b.extend([s.lng, s.lat]));
      programmaticRef.current = true;
      map.fitBounds(b, { padding: 60, animate: false });
      programmaticRef.current = false;
      didInitialFitRef.current = true;
    }
  }, [stations, selectedId, loaded, focusPoint]);

  // ── Focus marker + follow camera ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !focusPoint) return;

    if (isLiveLocation && lastPosRef.current && headingRef.current === null) {
      const meters =
        calculateDistance(
          lastPosRef.current.lat,
          lastPosRef.current.lng,
          focusPoint.lat,
          focusPoint.lng,
        ) * 1000;
      if (meters > 3) {
        headingRef.current = bearing(
          lastPosRef.current.lat,
          lastPosRef.current.lng,
          focusPoint.lat,
          focusPoint.lng,
        );
      }
    }
    if (isLiveLocation) lastPosRef.current = { lat: focusPoint.lat, lng: focusPoint.lng };

    if (!focusMarkerRef.current) {
      focusMarkerRef.current = new maplibregl.Marker({ element: buildLiveMarkerEl() })
        .setLngLat([focusPoint.lng, focusPoint.lat])
        .addTo(map);
    } else {
      focusMarkerRef.current.setLngLat([focusPoint.lng, focusPoint.lat]);
    }

    const arrow = focusMarkerRef.current
      .getElement()
      .querySelector('[data-arrow]') as HTMLElement | null;
    if (arrow) {
      if (isLiveLocation && headingRef.current !== null) {
        arrow.style.display = 'block';
        arrow.style.transform = `translate(-50%,-130%) rotate(${headingRef.current}deg)`;
      } else {
        arrow.style.display = 'none';
      }
    }

    if (isLiveLocation) {
      if (followModeRef.current) {
        programmaticRef.current = true;
        map.easeTo({
          center: [focusPoint.lng, focusPoint.lat],
          zoom: Math.max(map.getZoom(), 16),
          duration: 400,
        });
        setTimeout(() => {
          programmaticRef.current = false;
        }, 600);
      }
    } else {
      const key = `${focusPoint.lat.toFixed(6)},${focusPoint.lng.toFixed(6)}`;
      if ((map as any)._lastFocusKey !== key) {
        programmaticRef.current = true;
        map.easeTo({
          center: [focusPoint.lng, focusPoint.lat],
          zoom: Math.max(map.getZoom(), 14),
          duration: 500,
        });
        setTimeout(() => {
          programmaticRef.current = false;
        }, 700);
        (map as any)._lastFocusKey = key;
      }
    }
  }, [focusPoint, isLiveLocation, loaded]);

  // ── GPS accuracy circle ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const src = map.getSource(SRC_ACCURACY) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    if (!focusPoint || !accuracyRadius || accuracyRadius <= 0) {
      src.setData({ type: 'FeatureCollection', features: [] } as any);
      return;
    }
    src.setData({
      type: 'FeatureCollection',
      features: [circlePolygon(focusPoint.lat, focusPoint.lng, accuracyRadius)],
    } as any);
  }, [focusPoint, accuracyRadius, loaded]);

  // ── Route ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const src = map.getSource(SRC_ROUTE) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    if (!route || !route.coordinates?.length) {
      src.setData({ type: 'FeatureCollection', features: [] } as any);
      return;
    }
    // Route coordinates are [lat, lng] pairs; GeoJSON needs [lng, lat].
    const coords = route.coordinates.map((c: any) => [c[1], c[0]]) as [number, number][];
    src.setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    } as any);

    if (!(isLiveLocation && followModeRef.current)) {
      const b = new maplibregl.LngLatBounds();
      coords.forEach((c) => b.extend(c));
      programmaticRef.current = true;
      map.fitBounds(b, { padding: 60 });
      setTimeout(() => {
        programmaticRef.current = false;
      }, 800);
    }
  }, [route, isLiveLocation, loaded]);

  // ── Waypoints ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = waypoints.map((wp, i) => {
      const el = document.createElement('div');
      el.style.cssText =
        'width:24px;height:24px;border-radius:50%;background:hsl(var(--primary));color:hsl(var(--primary-foreground));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)';
      el.textContent = String(i + 1);
      el.title = `Stop ${i + 1}: ${wp.label}`;
      return new maplibregl.Marker({ element: el }).setLngLat([wp.lng, wp.lat]).addTo(map);
    });
  }, [waypoints, loaded]);

  const handleRecenter = (zoomOverride?: number) => {
    const map = mapRef.current;
    if (!map || !focusPoint) return;
    setFollowMode(true);
    programmaticRef.current = true;
    map.flyTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: zoomOverride ?? Math.max(map.getZoom(), 16),
      duration: 800,
    });
    setTimeout(() => {
      programmaticRef.current = false;
    }, 1000);
  };

  useImperativeHandle(ref, () => ({ recenter: (zoom?: number) => handleRecenter(zoom) }), [
    focusPoint,
  ]);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-mobile z-0"
        style={{ minHeight: '300px' }}
      />

      {isLiveLocation && focusPoint && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md backdrop-blur-md border transition-colors',
              followMode
                ? 'bg-primary text-primary-foreground border-primary/40'
                : 'bg-background/95 text-muted-foreground border-border',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                followMode ? 'bg-primary-foreground animate-pulse' : 'bg-muted-foreground',
              )}
            />
            {followMode ? 'Following' : 'Free look'}
          </div>
          <Button
            size="icon"
            onClick={() => handleRecenter()}
            aria-label={followMode ? 'Following your location' : 'Recenter on me'}
            title={followMode ? 'Following your location' : 'Recenter on me'}
            className={cn(
              'shadow-lg rounded-full h-12 w-12 backdrop-blur-md transition-colors',
              followMode
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30'
                : 'bg-background/95 text-foreground hover:bg-background border border-border',
            )}
          >
            <LocateFixed className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-border/30 z-10">
        <div className="text-xs font-medium mb-2">Station Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Low Supply</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Out of Fuel</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default StationMap;
