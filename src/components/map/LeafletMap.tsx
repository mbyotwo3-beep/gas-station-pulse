import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/hooks/useStations';
import { cn } from '@/lib/utils';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
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
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("LeafletMap: rendering and initializing");
    let map;
    try {
      if (containerRef.current && !mapRef.current) {
        map = L.map(containerRef.current, {
          center: [-15.3875, 28.3228], // Lusaka, Zambia
          zoom: 12,
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Initialize station layer
        const stationLayer = L.layerGroup().addTo(map);
        stationLayerRef.current = stationLayer;

        mapRef.current = map;
        console.log("LeafletMap: map initialized");
      }
    } catch (err) {
      console.error("LeafletMap: map initialization error", err);
      if (errorRef.current) {
        errorRef.current.textContent = "Map failed to initialize: " + err.message;
      }
    }
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const stationLayer = stationLayerRef.current;
    if (!stationLayer) return;

    // Clear existing station markers
    stationLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    stations.forEach((s) => {
      const isSelected = selectedStation?.id === s.id;
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: isSelected ? 14 : 10,
        color: colorFor(s.status),
        fillColor: colorFor(s.status),
        fillOpacity: isSelected ? 1 : 0.85,
        weight: isSelected ? 3 : 2,
        className: 'station-marker animate-scale-in',
      }).addTo(stationLayer);

      // Enhanced tooltip with status
      const statusText = s.status === 'available' ? 'Available' : s.status === 'low' ? 'Low Supply' : 'Out of Fuel';
      marker.bindTooltip(
        `<div class="text-center">
          <strong>${s.name}</strong><br>
          <span class="text-xs" style="color: ${colorFor(s.status)}">${statusText}</span>
        </div>`, 
        { permanent: false, opacity: 0.9 }
      );
      
      marker.on('click', () => {
        setSelectedStation(s);
        onSelect?.(s);
      });
      
      // Add hover effects
      marker.on('mouseover', () => {
        marker.setRadius(12);
        marker.setStyle({ weight: 3 });
      });
      
      marker.on('mouseout', () => {
        if (!isSelected) {
          marker.setRadius(10);
          marker.setStyle({ weight: 2 });
        }
      });
      
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

  return (
    <div className="relative">
      <div ref={containerRef} className={cn("w-full rounded-2xl overflow-hidden shadow-mobile", className ?? "h-[60vh]")} />
      
      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-border/30">
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

      {/* Error display */}
      <div ref={errorRef} style={{ position: "absolute", top: 10, left: 10, color: "red", fontWeight: "bold", zIndex: 10000 }}></div>
    </div>
  );
}
