import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';

/** Free, unlimited OpenStreetMap vector tiles — no API key, no usage fees. */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
/** Lusaka, Zambia */
export const LUSAKA_CENTER: [number, number] = [28.2833, -15.4167];

export interface MapLibreHandle {
  getMap: () => maplibregl.Map | null;
}

interface MapLibreMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onReady?: (map: maplibregl.Map) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  children?: React.ReactNode;
}

const MapLibreMap = forwardRef<MapLibreHandle, MapLibreMapProps>(function MapLibreMap(
  {
    className,
    center = LUSAKA_CENTER,
    zoom = 12,
    interactive = true,
    onReady,
    onMapClick,
    children,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const clickRef = useRef(onMapClick);
  const readyRef = useRef(onReady);
  clickRef.current = onMapClick;
  readyRef.current = onReady;

  useImperativeHandle(ref, () => ({ getMap: () => mapRef.current }), []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center,
      zoom,
      interactive,
      attributionControl: false,
    });
    mapRef.current = map;

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    map.on('click', (e) => clickRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
    map.on('load', () => readyRef.current?.(map));

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      {children}
    </div>
  );
});

export default MapLibreMap;
