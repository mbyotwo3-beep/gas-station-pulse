import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapLibreMap, { type MapLibreHandle } from '@/components/map/MapLibreMap';
import { useRealtimeDriverLocation } from '@/hooks/useRealtimeDriverLocation';
import { cn } from '@/lib/utils';

interface DriverLocationMapProps {
  driverId: string;
  pickupLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  rideStatus: string;
  className?: string;
}

function dot(color: string, size = 16) {
  const el = document.createElement('div');
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '9999px';
  el.style.background = color;
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.4)';
  el.style.transition = 'transform .3s ease';
  return el;
}

export default function DriverLocationMap({
  driverId,
  pickupLocation,
  destinationLocation,
  className,
}: DriverLocationMapProps) {
  const handleRef = useRef<MapLibreHandle | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { location: driverLocation, loading } = useRealtimeDriverLocation(driverId);

  const onReady = (map: maplibregl.Map) => {
    new maplibregl.Marker({ element: dot('hsl(142, 76%, 36%)') })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .setPopup(new maplibregl.Popup({ offset: 12 }).setText('Pickup'))
      .addTo(map);

    new maplibregl.Marker({ element: dot('hsl(0, 84%, 60%)') })
      .setLngLat([destinationLocation.lng, destinationLocation.lat])
      .setPopup(new maplibregl.Popup({ offset: 12 }).setText('Destination'))
      .addTo(map);

    map.fitBounds(
      new maplibregl.LngLatBounds(
        [pickupLocation.lng, pickupLocation.lat],
        [destinationLocation.lng, destinationLocation.lat],
      ),
      { padding: 50, duration: 0 },
    );
  };

  useEffect(() => {
    const map = handleRef.current?.getMap();
    if (!map || !driverLocation) return;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    } else {
      driverMarkerRef.current = new maplibregl.Marker({ element: dot('hsl(221, 83%, 53%)', 20) })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText('Your driver'))
        .addTo(map);
    }

    const bounds = new maplibregl.LngLatBounds(
      [driverLocation.lng, driverLocation.lat],
      [driverLocation.lng, driverLocation.lat],
    );
    bounds.extend([pickupLocation.lng, pickupLocation.lat]);
    bounds.extend([destinationLocation.lng, destinationLocation.lat]);
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }, [driverLocation, pickupLocation, destinationLocation]);

  return (
    <MapLibreMap
      ref={handleRef}
      className={cn('rounded-lg overflow-hidden border', className ?? 'h-[200px]')}
      center={[pickupLocation.lng, pickupLocation.lat]}
      zoom={14}
      onReady={onReady}
    >
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
    </MapLibreMap>
  );
}
