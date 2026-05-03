import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/hooks/useStations';
import { cn } from '@/lib/utils';
import { Route } from '@/hooks/useRouting';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// Bearing in degrees from point A to point B
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

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export interface LeafletMapProps {
  stations: Station[];
  onSelect?: (s: Station) => void;
  className?: string;
  focusPoint?: { lat: number; lng: number; label?: string } | null;
  route?: Route | null;
  waypoints?: Waypoint[];
  /** Radius in meters for GPS accuracy circle around focusPoint. */
  accuracyRadius?: number | null;
  /** When true, the focus point represents a live GPS reading and gets directional arrow + follow mode. */
  isLiveLocation?: boolean;
}

function colorFor(status: Station['status']) {
  if (status === 'available') return 'hsl(var(--success))';
  if (status === 'low') return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

// Build a divIcon with a directional arrow that rotates with heading
function buildLiveLocationIcon(heading: number | null): L.DivIcon {
  const rotation = heading ?? 0;
  const showArrow = heading !== null && !Number.isNaN(heading);
  return L.divIcon({
    className: 'live-location-icon',
    html: `
      <div style="position:relative;width:36px;height:36px;transform:translate(-50%,-50%);left:50%;top:50%;">
        ${showArrow ? `
          <div style="
            position:absolute;left:50%;top:50%;
            width:0;height:0;
            border-left:9px solid transparent;
            border-right:9px solid transparent;
            border-bottom:18px solid hsl(217 91% 60%);
            transform:translate(-50%,-130%) rotate(${rotation}deg);
            transform-origin:50% 130%;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
            transition: transform 250ms ease-out;
            pointer-events:none;
          "></div>` : ''}
        <div style="
          position:absolute;left:50%;top:50%;
          width:18px;height:18px;border-radius:9999px;
          background: hsl(217 91% 60%);
          border:3px solid #fff;
          transform:translate(-50%,-50%);
          box-shadow:0 0 0 1px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.35);
        "></div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export interface LeafletMapHandle {
  recenter: (zoom?: number) => void;
}

const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap({
  stations,
  onSelect,
  className,
  focusPoint,
  route,
  waypoints = [],
  accuracyRadius = null,
  isLiveLocation = false,
}, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const pathLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const waypointMarkersRef = useRef<L.CircleMarker[]>([]);
  const focusMarkerRef = useRef<L.Marker | L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => { selectedIdRef.current = selectedStation?.id ?? null; }, [selectedStation]);
  const stationMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const didInitialFitRef = useRef(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Follow-me mode: ON by default for live GPS, OFF as soon as the user pans/zooms.
  const [followMode, setFollowMode] = useState(true);
  const followModeRef = useRef(followMode);
  useEffect(() => { followModeRef.current = followMode; }, [followMode]);

  // Heading state: from device orientation if available, else derived from successive GPS points.
  const headingRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Smooth marker animation refs
  const animFrameRef = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    let map: LeafletMapType | undefined;
    try {
      if (containerRef.current && !mapRef.current) {
        map = L.map(containerRef.current, {
          center: [-15.3875, 28.3228],
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          fadeAnimation: false,
          className: 'map-tile-layer',
        }).addTo(map);

        pathLayerRef.current = L.layerGroup().addTo(map);
        stationLayerRef.current = L.layerGroup().addTo(map);

        // Disengage follow mode the moment the user interacts with the map.
        const disengageFollow = () => {
          if (followModeRef.current) setFollowMode(false);
        };
        map.on('dragstart', disengageFollow);
        map.on('zoomstart', (e: any) => {
          // Only disengage on user-initiated zoom (mouse wheel, +/- buttons, pinch).
          // Programmatic setView during follow uses animate:true but we guard via a flag.
          if ((map as any)._programmaticZoom) return;
          disengageFollow();
        });

        mapRef.current = map;
      }
    } catch (err: any) {
      console.error('LeafletMap init error', err);
      if (errorRef.current) errorRef.current.textContent = 'Map failed: ' + err.message;
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Device orientation -> heading (mobile compass)
  useEffect(() => {
    if (!isLiveLocation) return;
    const handler = (e: DeviceOrientationEvent) => {
      // iOS exposes webkitCompassHeading (true heading, 0=N clockwise)
      const wch = (e as any).webkitCompassHeading;
      if (typeof wch === 'number' && !Number.isNaN(wch)) {
        headingRef.current = wch;
        forceRender(n => n + 1);
        return;
      }
      // Standard alpha is 0..360 counter-clockwise from device frame; convert.
      if (typeof e.alpha === 'number' && !Number.isNaN(e.alpha)) {
        headingRef.current = (360 - e.alpha) % 360;
        forceRender(n => n + 1);
      }
    };
    window.addEventListener('deviceorientationabsolute' as any, handler as any, true);
    window.addEventListener('deviceorientation', handler, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handler as any, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, [isLiveLocation]);

  // Stations layer — incremental updates so markers don't flicker / get rebuilt every render.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const stationLayer = stationLayerRef.current;
    if (!stationLayer) return;

    const existing = stationMarkersRef.current;
    const nextIds = new Set(stations.map((s) => s.id));

    // Remove markers for stations no longer present
    existing.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        stationLayer.removeLayer(marker);
        existing.delete(id);
      }
    });

    const bounds = L.latLngBounds([]);

    stations.forEach((s) => {
      const isSelected = selectedStation?.id === s.id;
      const color = colorFor(s.status);
      let marker = existing.get(s.id);

      if (!marker) {
        marker = L.circleMarker([s.lat, s.lng], {
          radius: isSelected ? 14 : 10,
          color,
          fillColor: color,
          fillOpacity: isSelected ? 1 : 0.85,
          weight: isSelected ? 3 : 2,
          className: 'station-marker',
          pane: 'markerPane',
        }).addTo(stationLayer);

        marker.on('click', () => {
          setSelectedStation(s);
          onSelect?.(s);
        });
        marker.on('mouseover', () => { marker!.setRadius(12); marker!.setStyle({ weight: 3 }); });
        marker.on('mouseout', () => {
          const stillSelected = selectedStation?.id === s.id;
          if (!stillSelected) { marker!.setRadius(10); marker!.setStyle({ weight: 2 }); }
        });

        existing.set(s.id, marker);
      } else {
        // Only update what changed — no rebuild, no flicker.
        const ll = marker.getLatLng();
        if (ll.lat !== s.lat || ll.lng !== s.lng) marker.setLatLng([s.lat, s.lng]);
        marker.setStyle({ color, fillColor: color, fillOpacity: isSelected ? 1 : 0.85, weight: isSelected ? 3 : 2 });
        marker.setRadius(isSelected ? 14 : 10);
      }

      const statusText = s.status === 'available' ? 'Available' : s.status === 'low' ? 'Low Supply' : 'Out of Fuel';
      let distanceText = '';
      if (focusPoint) {
        const distance = calculateDistance(focusPoint.lat, focusPoint.lng, s.lat, s.lng);
        distanceText = `<br><span class="text-xs">${formatDistance(distance)} away</span>`;
      }
      marker.unbindTooltip();
      marker.bindTooltip(
        `<div class="text-center"><strong>${s.name}</strong><br><span class="text-xs" style="color:${color}">${statusText}</span>${distanceText}</div>`,
        { permanent: false, opacity: 0.9 }
      );

      bounds.extend([s.lat, s.lng]);
    });

    // Only auto-fit ONCE on first load. Never wrestle the user's camera afterwards.
    if (!didInitialFitRef.current && bounds.isValid() && !focusPoint && stations.length > 0) {
      map.fitBounds(bounds.pad(0.2));
      didInitialFitRef.current = true;
    }
  }, [stations, onSelect, focusPoint, selectedStation]);

  // Focus marker + follow logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusPoint) return;

    const target = L.latLng(focusPoint.lat, focusPoint.lng);

    // Derive heading from successive GPS positions if device orientation isn't providing it
    if (isLiveLocation && lastPosRef.current && headingRef.current === null) {
      const dist = calculateDistance(
        lastPosRef.current.lat, lastPosRef.current.lng,
        focusPoint.lat, focusPoint.lng
      ) * 1000; // meters
      if (dist > 3) {
        headingRef.current = bearing(
          lastPosRef.current.lat, lastPosRef.current.lng,
          focusPoint.lat, focusPoint.lng
        );
      }
    }
    if (isLiveLocation) lastPosRef.current = { lat: focusPoint.lat, lng: focusPoint.lng };

    // Build / update marker
    if (isLiveLocation) {
      const icon = buildLiveLocationIcon(headingRef.current);
      if (focusMarkerRef.current && (focusMarkerRef.current as any).setIcon) {
        const m = focusMarkerRef.current as L.Marker;
        // Smooth animate position
        const start = m.getLatLng();
        const startTime = performance.now();
        const dur = 400;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const step = (now: number) => {
          const t = Math.min(1, (now - startTime) / dur);
          const lat = start.lat + (target.lat - start.lat) * t;
          const lng = start.lng + (target.lng - start.lng) * t;
          m.setLatLng([lat, lng]);
          if (t < 1) animFrameRef.current = requestAnimationFrame(step);
        };
        animFrameRef.current = requestAnimationFrame(step);
        m.setIcon(icon);
      } else {
        if (focusMarkerRef.current) map.removeLayer(focusMarkerRef.current);
        const m = L.marker(target, { icon, pane: 'markerPane', interactive: false }).addTo(map);
        focusMarkerRef.current = m;
      }
    } else {
      // Manual pin: simple circle marker (no rotation)
      if (focusMarkerRef.current) {
        map.removeLayer(focusMarkerRef.current);
        focusMarkerRef.current = null;
      }
      const m = L.circleMarker(target, {
        radius: 12,
        color: 'hsl(var(--primary))',
        fillColor: 'hsl(var(--primary))',
        fillOpacity: 0.9,
        weight: 2,
        pane: 'markerPane',
      }).addTo(map);
      m.bindTooltip(`<strong>${focusPoint.label ?? 'Selected location'}</strong>`, { permanent: false, opacity: 1 });
      focusMarkerRef.current = m;
    }

    // Camera behavior:
    //  - Live GPS + follow mode: recenter at navigation zoom (17), no big zoom-out fights.
    //  - Manual pin: only zoom in if needed, never zoom out.
    //  - Live GPS + follow OFF: do nothing — respect the user's view.
    if (isLiveLocation) {
      if (followModeRef.current) {
        const navZoom = 17;
        (map as any)._programmaticZoom = true;
        map.setView(target, Math.max(map.getZoom(), navZoom), { animate: true, duration: 0.4 });
        setTimeout(() => { (map as any)._programmaticZoom = false; }, 600);
      }
    } else {
      // Manual pin: only recenter when the pin actually changes coords (not on every render).
      const prev = (map as any)._lastFocusKey as string | undefined;
      const key = `${focusPoint.lat.toFixed(6)},${focusPoint.lng.toFixed(6)}`;
      if (prev !== key) {
        const targetZoom = 14;
        map.setView(target, Math.max(map.getZoom(), targetZoom), { animate: true });
        (map as any)._lastFocusKey = key;
      }
    }
  }, [focusPoint, isLiveLocation, accuracyRadius]);

  // GPS accuracy circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    if (!focusPoint || !accuracyRadius || accuracyRadius <= 0) return;

    accuracyCircleRef.current = L.circle([focusPoint.lat, focusPoint.lng], {
      radius: accuracyRadius,
      color: 'hsl(var(--primary))',
      weight: 1,
      opacity: 0.6,
      fillColor: 'hsl(var(--primary))',
      fillOpacity: 0.12,
      className: 'gps-accuracy-circle',
      pane: 'overlayPane',
      interactive: false,
    }).addTo(map);
  }, [focusPoint, accuracyRadius]);

  // Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if ((map as any)._routeOutline) { map.removeLayer((map as any)._routeOutline); (map as any)._routeOutline = null; }

    if (!route) return;

    const outline = L.polyline(route.coordinates, {
      color: '#1a1a2e', weight: 10, opacity: 0.7,
      smoothFactor: 1, lineCap: 'round', lineJoin: 'round', pane: 'shadowPane',
    }).addTo(map);
    (map as any)._routeOutline = outline;

    const routeLine = L.polyline(route.coordinates, {
      color: '#2563eb', weight: 6, opacity: 1,
      smoothFactor: 1, lineCap: 'round', lineJoin: 'round',
      className: 'route-line', pane: 'overlayPane',
    }).addTo(map);
    routeLayerRef.current = routeLine;

    // Only fit-to-route when we're NOT in live-follow mode (otherwise it fights navigation).
    if (!(isLiveLocation && followModeRef.current)) {
      map.fitBounds(routeLine.getBounds().pad(0.1));
    }
  }, [route, isLiveLocation]);

  // Waypoints
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    waypointMarkersRef.current.forEach(m => map.removeLayer(m));
    waypointMarkersRef.current = [];

    waypoints.forEach((waypoint, index) => {
      const marker = L.circleMarker([waypoint.lat, waypoint.lng], {
        radius: 10, color: 'hsl(var(--primary))', fillColor: '#ffffff',
        fillOpacity: 1, weight: 3, pane: 'markerPane',
      }).addTo(map);

      const divIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;border-radius:50%;background:hsl(var(--primary));color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;">${index + 1}</div>`,
        className: 'waypoint-marker', iconSize: [24, 24], iconAnchor: [12, 12],
      });
      const labelMarker = L.marker([waypoint.lat, waypoint.lng], { icon: divIcon, pane: 'markerPane' }).addTo(map);
      labelMarker.bindTooltip(`<strong>Stop ${index + 1}</strong><br>${waypoint.label}`, { permanent: false, opacity: 0.9 });

      waypointMarkersRef.current.push(marker);
      waypointMarkersRef.current.push(labelMarker as any);
    });
  }, [waypoints]);

  const handleRecenter = (zoomOverride?: number) => {
    const map = mapRef.current;
    if (!map || !focusPoint) return;
    setFollowMode(true);
    (map as any)._programmaticZoom = true;
    const z = zoomOverride ?? Math.max(map.getZoom(), 17);
    map.flyTo([focusPoint.lat, focusPoint.lng], z, { animate: true, duration: 0.8 });
    setTimeout(() => { (map as any)._programmaticZoom = false; }, 1000);
  };

  useImperativeHandle(ref, () => ({
    recenter: (zoom?: number) => handleRecenter(zoom),
  }), [focusPoint]);


  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-mobile z-0"
        style={{ minHeight: '300px' }}
      />

      {/* Follow-mode status chip + Recenter button — only meaningful for live GPS */}
      {isLiveLocation && focusPoint && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md backdrop-blur-md border transition-colors",
              followMode
                ? "bg-primary text-primary-foreground border-primary/40"
                : "bg-background/95 text-muted-foreground border-border"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                followMode ? "bg-primary-foreground animate-pulse" : "bg-muted-foreground"
              )}
            />
            {followMode ? "Following" : "Free look"}
          </div>
          <Button
            size="icon"
            onClick={() => handleRecenter()}
            aria-label={followMode ? "Following your location" : "Recenter on me"}
            title={followMode ? "Following your location" : "Recenter on me"}
            className={cn(
              "shadow-lg rounded-full h-12 w-12 backdrop-blur-md transition-colors",
              followMode
                ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30"
                : "bg-background/95 text-foreground hover:bg-background border border-border"
            )}
          >
            <LocateFixed className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-border/30 z-10">
        <div className="text-xs font-medium mb-2">Station Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <span className="text-xs text-muted-foreground">Low Supply</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <span className="text-xs text-muted-foreground">Out of Fuel</span>
          </div>
        </div>
      </div>

      <div ref={errorRef} style={{ position: 'absolute', top: 10, left: 10, color: 'red', fontWeight: 'bold', zIndex: 10000 }} />
    </div>
  );
});

export default LeafletMap;
