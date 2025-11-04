import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/hooks/useStations';
import { cn } from '@/lib/utils';
import { Route } from '@/hooks/useRouting';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
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

export interface LeafletMapProps {
  stations: Station[];
  onSelect?: (s: Station) => void;
  className?: string;
  focusPoint?: { lat: number; lng: number; label?: string } | null;
  route?: Route | null;
}

function colorFor(status: Station['status']) {
  if (status === 'available') return 'hsl(var(--success))';
  if (status === 'low') return 'hsl(var(--warning))';
  return 'hsl(var(--destructive))';
}

export default function LeafletMap({ stations, onSelect, className, focusPoint, route }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const pathLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
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
          fadeAnimation: false,
          className: 'map-tile-layer',
        }).addTo(map);

        // Initialize layers in correct z-order (bottom to top)
        const pathLayer = L.layerGroup().addTo(map);
        pathLayerRef.current = pathLayer;
        
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
    const pathLayer = pathLayerRef.current;
    if (!stationLayer || !pathLayer) return;

    // Clear existing station markers and paths
    stationLayer.clearLayers();
    pathLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    // Draw paths from focus point to all stations if focus point exists
    if (focusPoint) {
      stations.forEach((s) => {
        const distance = calculateDistance(focusPoint.lat, focusPoint.lng, s.lat, s.lng);
        
        // Only draw paths to nearby stations (within 10km)
        if (distance <= 10) {
          const isSelected = selectedStation?.id === s.id;
          
          L.polyline(
            [[focusPoint.lat, focusPoint.lng], [s.lat, s.lng]],
            {
              color: isSelected ? 'hsl(var(--primary))' : colorFor(s.status),
              weight: isSelected ? 3 : 1.5,
              opacity: isSelected ? 0.8 : 0.4,
              dashArray: isSelected ? undefined : '5, 10',
              className: 'station-path',
            }
          ).addTo(pathLayer);
        }
      });
    }

    stations.forEach((s) => {
      const isSelected = selectedStation?.id === s.id;
      
      // Calculate distance if focusPoint is available
      let distanceText = '';
      if (focusPoint) {
        const distance = calculateDistance(focusPoint.lat, focusPoint.lng, s.lat, s.lng);
        distanceText = `<br><span class="text-xs">${formatDistance(distance)} away</span>`;
      }
      
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: isSelected ? 14 : 10,
        color: colorFor(s.status),
        fillColor: colorFor(s.status),
        fillOpacity: isSelected ? 1 : 0.85,
        weight: isSelected ? 3 : 2,
        className: 'station-marker animate-scale-in',
        pane: 'markerPane', // Ensure markers are on top
      }).addTo(stationLayer);

      // Enhanced tooltip with status and distance
      const statusText = s.status === 'available' ? 'Available' : s.status === 'low' ? 'Low Supply' : 'Out of Fuel';
      marker.bindTooltip(
        `<div class="text-center">
          <strong>${s.name}</strong><br>
          <span class="text-xs" style="color: ${colorFor(s.status)}">${statusText}</span>${distanceText}
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
  }, [stations, onSelect, focusPoint, selectedStation]);

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
      pane: 'markerPane', // Ensure markers are on top
    }).addTo(map);

    marker.bindTooltip(`<strong>${focusPoint.label ?? 'Selected location'}</strong>`, { permanent: false, opacity: 1 });
    focusMarkerRef.current = marker;

    // Zoom in but don't reduce if user is already closer
    const targetZoom = 14;
    const currentZoom = map.getZoom();
    map.setView([focusPoint.lat, focusPoint.lng], Math.max(currentZoom, targetZoom), { animate: true });
  }, [focusPoint]);

  // Draw navigation route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!route) return;

    // Draw the route polyline
    const routeLine = L.polyline(route.coordinates, {
      color: 'hsl(var(--primary))',
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1,
      className: 'route-line',
    }).addTo(map);

    routeLayerRef.current = routeLine;

    // Fit map to show the entire route
    map.fitBounds(routeLine.getBounds().pad(0.1));
  }, [route]);

  return (
    <div className={cn("relative w-full", className)}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-mobile z-0" style={{ minHeight: '300px' }} />
      
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

      {/* Error display */}
      <div ref={errorRef} style={{ position: "absolute", top: 10, left: 10, color: "red", fontWeight: "bold", zIndex: 10000 }}></div>
    </div>
  );
}
