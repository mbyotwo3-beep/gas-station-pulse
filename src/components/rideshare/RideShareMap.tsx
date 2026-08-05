import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import MapLibreMap, { type MapLibreHandle } from '@/components/map/MapLibreMap';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  id: string;
  user_id: string;
  current_location: { lat: number; lng: number };
  vehicle_type: string;
  is_active: boolean;
  rating: number;
}

interface RideRequest {
  id: string;
  pickup_location: { lat: number; lng: number; address: string };
  destination_location: { lat: number; lng: number; address: string };
  passenger_count: number;
  max_fare?: number;
}

export interface RideShareMapProps {
  className?: string;
  focusPoint?: { lat: number; lng: number; label?: string } | null;
  onDriverSelect?: (driver: DriverLocation) => void;
  onRequestSelect?: (request: RideRequest) => void;
}

const VEHICLE_EMOJI: Record<string, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  van: '🚐',
  truck: '🚛',
};

function markerEl(content: string, color: string) {
  const el = document.createElement('div');
  el.textContent = content;
  el.style.fontSize = '18px';
  el.style.lineHeight = '28px';
  el.style.width = '28px';
  el.style.height = '28px';
  el.style.textAlign = 'center';
  el.style.borderRadius = '9999px';
  el.style.background = color;
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.35)';
  el.style.cursor = 'pointer';
  return el;
}

export default function RideShareMap({
  className,
  focusPoint,
  onDriverSelect,
  onRequestSelect,
}: RideShareMapProps) {
  const handleRef = useRef<MapLibreHandle | null>(null);
  const driverMarkersRef = useRef<maplibregl.Marker[]>([]);
  const requestMarkersRef = useRef<maplibregl.Marker[]>([]);
  const focusMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);

  const fetchActiveDrivers = async () => {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('is_active', true)
      .eq('is_suspended', false)
      .eq('verification_status', 'approved')
      .not('current_location', 'is', null);

    if (error) {
      console.error('Error fetching drivers:', error);
      return;
    }
    setDrivers(
      (data ?? []).map((item) => ({
        ...item,
        current_location: item.current_location as unknown as { lat: number; lng: number },
      })) as DriverLocation[],
    );
  };

  const fetchRideRequests = async () => {
    const { data, error } = await supabase.from('ride_requests').select('*').eq('status', 'active');
    if (error) {
      console.error('Error fetching ride requests:', error);
      return;
    }
    setRideRequests(
      (data ?? []).map((item) => ({
        ...item,
        pickup_location: item.pickup_location as unknown as RideRequest['pickup_location'],
        destination_location:
          item.destination_location as unknown as RideRequest['destination_location'],
      })) as RideRequest[],
    );
  };

  useEffect(() => {
    fetchActiveDrivers();
    fetchRideRequests();

    const driversSubscription = supabase
      .channel('driver_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_profiles' }, () =>
        fetchActiveDrivers(),
      )
      .subscribe();

    const requestsSubscription = supabase
      .channel('ride_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, () =>
        fetchRideRequests(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(driversSubscription);
      supabase.removeChannel(requestsSubscription);
    };
  }, []);

  // Driver markers
  useEffect(() => {
    const map = handleRef.current?.getMap();
    if (!map) return;

    driverMarkersRef.current.forEach((m) => m.remove());
    driverMarkersRef.current = drivers
      .filter((d) => d.current_location)
      .map((driver) => {
        const el = markerEl(VEHICLE_EMOJI[driver.vehicle_type] ?? '🚗', 'hsl(var(--background))');
        el.addEventListener('click', () => onDriverSelect?.(driver));
        return new maplibregl.Marker({ element: el })
          .setLngLat([driver.current_location.lng, driver.current_location.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 14 }).setHTML(
              `<strong>${driver.vehicle_type}</strong><br/>⭐ ${Number(driver.rating ?? 0).toFixed(1)}`,
            ),
          )
          .addTo(map);
      });
  }, [drivers, onDriverSelect]);

  // Ride request markers
  useEffect(() => {
    const map = handleRef.current?.getMap();
    if (!map) return;

    requestMarkersRef.current.forEach((m) => m.remove());
    requestMarkersRef.current = rideRequests.map((request) => {
      const el = markerEl('🙋', 'hsl(var(--warning))');
      el.addEventListener('click', () => onRequestSelect?.(request));
      return new maplibregl.Marker({ element: el })
        .setLngLat([request.pickup_location.lng, request.pickup_location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 14 }).setHTML(
            `<strong>Ride request</strong><br/>👥 ${request.passenger_count}<br/>${
              request.max_fare ? `💰 Max K${request.max_fare}` : '💰 Fare negotiable'
            }`,
          ),
        )
        .addTo(map);
    });
  }, [rideRequests, onRequestSelect]);

  // Focus point
  useEffect(() => {
    const map = handleRef.current?.getMap();
    if (!map || !focusPoint) return;

    focusMarkerRef.current?.remove();
    focusMarkerRef.current = new maplibregl.Marker({ color: '#111111' })
      .setLngLat([focusPoint.lng, focusPoint.lat])
      .setPopup(new maplibregl.Popup({ offset: 14 }).setText(focusPoint.label ?? 'Selected location'))
      .addTo(map);

    map.flyTo({ center: [focusPoint.lng, focusPoint.lat], zoom: 14 });
  }, [focusPoint]);

  return (
    <MapLibreMap ref={handleRef} className={className ?? 'h-[60vh]'}>
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span>🚗</span>
            <span>Verified drivers online</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🙋</span>
            <span>Ride requests</span>
          </div>
        </div>
      </div>
    </MapLibreMap>
  );
}
