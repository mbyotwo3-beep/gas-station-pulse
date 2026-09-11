import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapLibreMap, { type MapLibreHandle } from '@/components/map/MapLibreMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface LatLng {
  lat: number;
  lng: number;
  address?: string;
}

interface ActiveDeliveryMapProps {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
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
  return el;
}

/** Map of the courier's current delivery: pickup, drop-off and their own live position. */
export default function ActiveDeliveryMap({ pickup, dropoff, className }: ActiveDeliveryMapProps) {
  const handleRef = useRef<MapLibreHandle | null>(null);
  const selfMarker = useRef<maplibregl.Marker | null>(null);
  const { position } = useGeolocation(true, true);

  const valid = (p?: LatLng | null): p is LatLng =>
    !!p && typeof p.lat === 'number' && typeof p.lng === 'number';

  const onReady = (map: maplibregl.Map) => {
    const bounds = new maplibregl.LngLatBounds();
    if (valid(pickup)) {
      new maplibregl.Marker({ element: dot('hsl(142, 76%, 36%)') })
        .setLngLat([pickup.lng, pickup.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(pickup.address || 'Pickup'))
        .addTo(map);
      bounds.extend([pickup.lng, pickup.lat]);
    }
    if (valid(dropoff)) {
      new maplibregl.Marker({ element: dot('hsl(0, 84%, 60%)') })
        .setLngLat([dropoff.lng, dropoff.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText(dropoff.address || 'Drop-off'))
        .addTo(map);
      bounds.extend([dropoff.lng, dropoff.lat]);
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
  };

  useEffect(() => {
    const map = handleRef.current?.getMap();
    if (!map || !position) return;
    const { latitude, longitude } = position.coords;
    if (selfMarker.current) {
      selfMarker.current.setLngLat([longitude, latitude]);
    } else {
      selfMarker.current = new maplibregl.Marker({ element: dot('hsl(221, 83%, 53%)', 20) })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setText('You'))
        .addTo(map);
    }
  }, [position]);

  const center: [number, number] | undefined = valid(pickup)
    ? [pickup.lng, pickup.lat]
    : valid(dropoff)
      ? [dropoff.lng, dropoff.lat]
      : undefined;

  return (
    <MapLibreMap
      ref={handleRef}
      className={cn('rounded-lg overflow-hidden border', className ?? 'h-[220px]')}
      center={center}
      zoom={13}
      onReady={onReady}
    />
  );
}
