import { useEffect, useRef } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/components/StationCard';
import { cn } from '@/lib/utils';
export interface LeafletMapProps {
  stations: Station[];
  onSelect?: (s: Station) => void;
  className?: string;
  focusPoint?: { lat: number; lng: number; label?: string } | null;
}

function colorFor(status: Station['status']) {
  if (status === 'available') return 'hsl(var(--success))';
  if (status === 'low') return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

export default function LeafletMap({ stations, onSelect, className, focusPoint }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const focusMarkerRef = useRef<L.CircleMarker | null>(null);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [-15.3875, 28.3228], // Lusaka, Zambia
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // layer for station markers
    stationLayerRef.current = L.layerGroup().addTo(mapRef.current);
  }, []);

useEffect(() => {
  const map = mapRef.current;
  const stationLayer = stationLayerRef.current;
  if (!map || !stationLayer) return;

  // Clear existing station markers
  stationLayer.clearLayers();

  const bounds = L.latLngBounds([]);

  stations.forEach((s) => {
    const marker = L.circleMarker([s.lat, s.lng], {
      radius: 10,
      color: colorFor(s.status),
      fillColor: colorFor(s.status),
      fillOpacity: 0.85,
      weight: 2,
    }).addTo(stationLayer);

    marker.bindTooltip(`<strong>${s.name}</strong>`, { permanent: false, opacity: 1 });
    marker.on('click', () => onSelect?.(s));
    bounds.extend([s.lat, s.lng]);
  });

  if (bounds.isValid() && !focusPoint) {
    map.fitBounds(bounds.pad(0.2));
  }
}, [stations, onSelect, focusPoint]);

useEffect(() => {
  const map = mapRef.current;
  if (!map || !focusPoint) return;

  // Remove previous focus marker
  if (focusMarkerRef.current) {
    map.removeLayer(focusMarkerRef.current);
    focusMarkerRef.current = null;
  }

  const marker = L.circleMarker([focusPoint.lat, focusPoint.lng], {
    radius: 12,
    color: 'hsl(var(--primary))',
    fillColor: 'hsl(var(--primary))',
    fillOpacity: 0.9,
    weight: 2,
  }).addTo(map);

  marker.bindTooltip(`<strong>${focusPoint.label ?? 'Selected location'}</strong>`, { permanent: false, opacity: 1 });
  focusMarkerRef.current = marker;

  // Zoom in but don't reduce if user is already closer
  const targetZoom = 14;
  const currentZoom = map.getZoom();
  map.setView([focusPoint.lat, focusPoint.lng], Math.max(currentZoom, targetZoom), { animate: true });
}, [focusPoint]);

  return <div ref={containerRef} className={cn("w-full rounded-lg elevated overflow-hidden", className ?? "h-[60vh]")} />;
}
