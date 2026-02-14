import { useEffect, useRef } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealtimeDriverLocation } from '@/hooks/useRealtimeDriverLocation';
import { cn } from '@/lib/utils';

interface DriverLocationMapProps {
  driverId: string;
  pickupLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  rideStatus: string;
  className?: string;
}

export default function DriverLocationMap({
  driverId,
  pickupLocation,
  destinationLocation,
  rideStatus,
  className
}: DriverLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);
  const driverMarkerRef = useRef<L.CircleMarker | null>(null);
  const pickupMarkerRef = useRef<L.CircleMarker | null>(null);
  const destMarkerRef = useRef<L.CircleMarker | null>(null);

  const { location: driverLocation, loading } = useRealtimeDriverLocation(driverId);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [pickupLocation.lat, pickupLocation.lng],
      zoom: 14,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
    }).addTo(mapRef.current);

    // Pickup marker (green)
    pickupMarkerRef.current = L.circleMarker(
      [pickupLocation.lat, pickupLocation.lng],
      { radius: 8, color: 'hsl(142, 76%, 36%)', fillColor: 'hsl(142, 76%, 36%)', fillOpacity: 0.9, weight: 2 }
    ).addTo(mapRef.current);
    pickupMarkerRef.current.bindTooltip('<strong>📍 Pickup</strong>', { permanent: false });

    // Destination marker (red)
    destMarkerRef.current = L.circleMarker(
      [destinationLocation.lat, destinationLocation.lng],
      { radius: 8, color: 'hsl(0, 84%, 60%)', fillColor: 'hsl(0, 84%, 60%)', fillOpacity: 0.9, weight: 2 }
    ).addTo(mapRef.current);
    destMarkerRef.current.bindTooltip('<strong>🎯 Destination</strong>', { permanent: false });

    // Fit bounds to show both points
    const bounds = L.latLngBounds(
      [pickupLocation.lat, pickupLocation.lng],
      [destinationLocation.lat, destinationLocation.lng]
    );
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update driver marker in real-time
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverLocation) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
    } else {
      driverMarkerRef.current = L.circleMarker(
        [driverLocation.lat, driverLocation.lng],
        { radius: 10, color: 'hsl(221, 83%, 53%)', fillColor: 'hsl(221, 83%, 53%)', fillOpacity: 0.9, weight: 3 }
      ).addTo(map);
      driverMarkerRef.current.bindTooltip('<strong>🚗 Your Driver</strong>', { permanent: true, opacity: 0.9 });
    }

    // Fit bounds to include driver
    const points: L.LatLngExpression[] = [
      [driverLocation.lat, driverLocation.lng],
      [pickupLocation.lat, pickupLocation.lng],
      [destinationLocation.lat, destinationLocation.lng],
    ];
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15, animate: true });
  }, [driverLocation]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden border", className ?? "h-[200px]")}>
      <div ref={containerRef} className="w-full h-full" />
      {loading && !driverLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground animate-pulse">Locating driver...</p>
        </div>
      )}
      {!loading && !driverLocation && (
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1">
          <p className="text-xs text-muted-foreground">Driver location unavailable</p>
        </div>
      )}
    </div>
  );
}
