import { useEffect, useRef } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/components/StationCard';

export interface LeafletMapProps {
  stations: Station[];
  onSelect?: (s: Station) => void;
}

function colorFor(status: Station['status']) {
  if (status === 'available') return 'hsl(var(--success))';
  if (status === 'low') return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

export default function LeafletMap({ stations, onSelect }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers layer if any
    map.eachLayer((layer) => {
      // keep tile layer
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    stations.forEach((s) => {
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 10,
        color: colorFor(s.status),
        fillColor: colorFor(s.status),
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map);

      marker.bindTooltip(`<strong>${s.name}</strong>`, { permanent: false, opacity: 1 });
      marker.on('click', () => onSelect?.(s));
      bounds.extend([s.lat, s.lng]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [stations, onSelect]);

  return <div ref={containerRef} className="w-full h-[60vh] rounded-lg elevated overflow-hidden" />;
}
