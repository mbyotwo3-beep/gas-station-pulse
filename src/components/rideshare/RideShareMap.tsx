import { useEffect, useRef, useState } from 'react';
import L, { Map as LeafletMapType } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
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

export default function RideShareMap({ 
  className, 
  focusPoint, 
  onDriverSelect, 
  onRequestSelect 
}: RideShareMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMapType | null>(null);
  const driversLayerRef = useRef<L.LayerGroup | null>(null);
  const requestsLayerRef = useRef<L.LayerGroup | null>(null);
  const focusMarkerRef = useRef<L.CircleMarker | null>(null);
  
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [-15.3875, 28.3228], // Lusaka, Zambia
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // Layer for driver markers
    driversLayerRef.current = L.layerGroup().addTo(mapRef.current);
    
    // Layer for ride request markers
    requestsLayerRef.current = L.layerGroup().addTo(mapRef.current);

    // Fetch initial data
    fetchActiveDrivers();
    fetchRideRequests();

    // Set up real-time subscriptions
    const driversSubscription = supabase
      .channel('driver_locations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_profiles'
      }, () => {
        fetchActiveDrivers();
      })
      .subscribe();

    const requestsSubscription = supabase
      .channel('ride_requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_requests'
      }, () => {
        fetchRideRequests();
      })
      .subscribe();

    return () => {
      mapRef.current?.remove();
      supabase.removeChannel(driversSubscription);
      supabase.removeChannel(requestsSubscription);
    };
  }, []);

  const fetchActiveDrivers = async () => {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('is_active', true)
      .not('current_location', 'is', null);

    if (error) {
      console.error('Error fetching drivers:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        current_location: item.current_location as { lat: number; lng: number }
      }));
      setDrivers(typedData);
    }
  };

  const fetchRideRequests = async () => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching ride requests:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        pickup_location: item.pickup_location as { lat: number; lng: number; address: string },
        destination_location: item.destination_location as { lat: number; lng: number; address: string }
      }));
      setRideRequests(typedData);
    }
  };

  // Update driver markers
  useEffect(() => {
    const driversLayer = driversLayerRef.current;
    const map = mapRef.current;
    if (!driversLayer || !map) return;

    driversLayer.clearLayers();

    drivers.forEach((driver) => {
      if (!driver.current_location) return;

      const { lat, lng } = driver.current_location;
      
      // Different colors for different vehicle types
      const getDriverColor = (vehicleType: string) => {
        switch (vehicleType) {
          case 'car': return 'hsl(var(--primary))';
          case 'motorcycle': return 'hsl(var(--warning))';
          case 'van': return 'hsl(var(--success))';
          case 'truck': return 'hsl(var(--destructive))';
          default: return 'hsl(var(--primary))';
        }
      };

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: getDriverColor(driver.vehicle_type),
        fillColor: getDriverColor(driver.vehicle_type),
        fillOpacity: 0.8,
        weight: 2,
      }).addTo(driversLayer);

      const vehicleEmoji = {
        car: '🚗',
        motorcycle: '🏍️',
        van: '🚐',
        truck: '🚛'
      }[driver.vehicle_type] || '🚗';

      marker.bindTooltip(
        `<div style="text-align: center;">
          <div style="font-size: 16px;">${vehicleEmoji}</div>
          <strong>${driver.vehicle_type.charAt(0).toUpperCase() + driver.vehicle_type.slice(1)}</strong><br>
          ⭐ ${driver.rating.toFixed(1)} rating
        </div>`,
        { permanent: false, opacity: 1 }
      );

      marker.on('click', () => onDriverSelect?.(driver));
    });
  }, [drivers, onDriverSelect]);

  // Update ride request markers
  useEffect(() => {
    const requestsLayer = requestsLayerRef.current;
    const map = mapRef.current;
    if (!requestsLayer || !map) return;

    requestsLayer.clearLayers();

    rideRequests.forEach((request) => {
      const { lat, lng } = request.pickup_location;
      
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: 'hsl(var(--warning))',
        fillColor: 'hsl(var(--warning))',
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(requestsLayer);

      marker.bindTooltip(
        `<div>
          <strong>🙋 Ride Request</strong><br>
          👥 ${request.passenger_count} passenger${request.passenger_count > 1 ? 's' : ''}<br>
          ${request.max_fare ? `💰 Max: $${request.max_fare}` : '💰 Fare negotiable'}<br>
          📍 ${request.pickup_location.address.substring(0, 50)}...
        </div>`,
        { permanent: false, opacity: 1 }
      );

      marker.on('click', () => onRequestSelect?.(request));
    });
  }, [rideRequests, onRequestSelect]);

  // Handle focus point
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

    marker.bindTooltip(
      `<strong>${focusPoint.label ?? 'Selected location'}</strong>`,
      { permanent: false, opacity: 1 }
    );
    
    focusMarkerRef.current = marker;

    // Center map on focus point
    map.setView([focusPoint.lat, focusPoint.lng], 14, { animate: true });
  }, [focusPoint]);

  return (
    <div className={cn("relative", className ?? "h-[60vh]")}>
      <div ref={containerRef} className="w-full h-full rounded-lg elevated overflow-hidden" />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="text-sm font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>🚗 Available Drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span>🙋 Ride Requests</span>
          </div>
        </div>
      </div>
    </div>
  );
}