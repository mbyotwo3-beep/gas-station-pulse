import { useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapLibreMap, { type MapLibreHandle, LUSAKA_CENTER } from '@/components/map/MapLibreMap';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface PinDropMapProps {
  /** Initial pin, if any */
  value?: { lat: number; lng: number } | null;
  onConfirm: (point: { lat: number; lng: number }) => void;
  className?: string;
  label?: string;
}

/**
 * For places OpenStreetMap does not know yet (new developments on the edge of
 * Lusaka): tap the map to drop a precise pin instead of typing an address.
 */
export default function PinDropMap({ value, onConfirm, className, label }: PinDropMapProps) {
  const handleRef = useRef<MapLibreHandle | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(value ?? null);

  const placeMarker = (lngLat: { lng: number; lat: number }) => {
    const map = handleRef.current?.getMap();
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([lngLat.lng, lngLat.lat]);
    } else {
      markerRef.current = new maplibregl.Marker({ color: '#111111', draggable: true })
        .setLngLat([lngLat.lng, lngLat.lat])
        .addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLngLat();
        setPoint({ lat: p.lat, lng: p.lng });
      });
    }
    setPoint({ lat: lngLat.lat, lng: lngLat.lng });
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {label ?? 'Tap the map to drop a precise pin, then drag it to fine-tune.'}
      </p>
      <MapLibreMap
        ref={handleRef}
        className={className ?? 'h-[260px] border rounded-lg'}
        center={value ? [value.lng, value.lat] : LUSAKA_CENTER}
        zoom={value ? 16 : 12}
        onReady={() => value && placeMarker({ lng: value.lng, lat: value.lat })}
        onMapClick={placeMarker}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'No pin dropped yet'}
        </span>
        <Button size="sm" disabled={!point} onClick={() => point && onConfirm(point)}>
          <MapPin className="h-4 w-4 mr-2" />
          Use this pin
        </Button>
      </div>
    </div>
  );
}
