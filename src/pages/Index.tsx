import { useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import LeafletMap, { type LeafletMapHandle } from "@/components/map/LeafletMap";
import RideShareMap from "@/components/rideshare/RideShareMap";
import StationList from "@/components/StationList";
import StationListSkeleton from "@/components/StationListSkeleton";
import StationMapSkeleton from "@/components/StationMapSkeleton";
import AdvancedFilters from "@/components/AdvancedFilters";
import EnhancedLocationSearch from "@/components/map/EnhancedLocationSearch";
import SavedLocationsBar from "@/components/map/SavedLocationsBar";
import ManagerLogin from "@/components/ManagerLogin";
import ThemeToggle from "@/components/ThemeToggle";
import DriverDashboard from "@/components/rideshare/DriverDashboard";
import PassengerDashboard from "@/components/rideshare/PassengerDashboard";
import AppBottomNav, { type AppTab } from "@/components/mobile/AppBottomNav";
import MapBottomSheet, { type SheetSnap } from "@/components/mobile/MapBottomSheet";
import ErrandsForm from "@/components/errands/ErrandsForm";
import ServiceSelector from "@/components/delivery/ServiceSelector";
import FoodDeliveryDashboard from "@/components/delivery/FoodDeliveryDashboard";
import PackageDeliveryForm from "@/components/delivery/PackageDeliveryForm";
import OrderTracker from "@/components/delivery/OrderTracker";
import DriverDeliveryDashboard from "@/components/delivery/DriverDeliveryDashboard";
import ProfileDialog from "@/components/ProfileDialog";
import StationReportDialog from "@/components/StationReportDialog";
import AddStationDialog from "@/components/AddStationDialog";
import StationDetails from "@/components/StationDetails";
import TurnByTurnDirections from "@/components/map/TurnByTurnDirections";
import WaypointsManager, { Waypoint } from "@/components/map/WaypointsManager";
import RouteAlternatives from "@/components/map/RouteAlternatives";
import SaveRouteDialog from "@/components/map/SaveRouteDialog";
import SavedRoutesList from "@/components/map/SavedRoutesList";
import RouteOptimizationSuggestions from "@/components/map/RouteOptimizationSuggestions";
import AdminPanel from "@/components/admin/AdminPanel";
import NotificationCenter from "@/components/common/NotificationCenter";
import AccuracySparkline, { type AccuracyPoint } from "@/components/common/AccuracySparkline";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useStations";
import { useProfile } from "@/hooks/useProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoles } from "@/hooks/useRoles";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useRouting, type TransportMode } from "@/hooks/useRouting";
import { TransportModeSelector } from "@/components/map/TransportModeSelector";
import { useVoiceNavigation } from "@/hooks/useVoiceNavigation";
import { useAutoRerouting } from "@/hooks/useAutoRerouting";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Fuel, 
  Car, 
  MapPin, 
  Menu, 
  Search, 
  User, 
  Settings,
  Navigation,
  Star,
  Filter,
  Plus,
  LocateFixed,
  AlertTriangle,
  Signal,
  Shield,
  Crown,
  X,
  BellOff,
  Bookmark,
  Lightbulb
} from "lucide-react";
import type { Station } from "@/hooks/useStations";

export default function Index() {
  const { user, signOut } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { profile, toggleFavoriteStation, isFavorite } = useProfile();
  const { position, accuracy, requestLocation, watchLocation } = useGeolocation(true, true);
  const { roles, hasRole, canManageStations, canDrive, canRequestRides } = useRoles();
  const { hasPermission, requestNotificationPermission } = useNotifications();
  useRealtimeNotifications(); // Enable realtime notifications
  const { route, routeAlternatives, loading: routeLoading, transportMode, getRoute, clearRoute, selectRoute, changeTransportMode } = useRouting();
  const { savedRoutes, loading: savedRoutesLoading, saveRoute, deleteRoute, updateRoute } = useSavedRoutes();
  const { suggestions, loading: optimizationLoading, analyzeRoutes, clearSuggestions } = useRouteOptimization();
  
  const [activeTab, setActiveTab] = useState<AppTab>('fuel');
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('half');
  const [adminOpen, setAdminOpen] = useState(false);
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedService, setSelectedService] = useState<'ride' | 'food_delivery' | 'package_delivery'>('ride');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [addingWaypoint, setAddingWaypoint] = useState(false);
  const [showRouteAlternatives, setShowRouteAlternatives] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [autoRerouteEnabled, setAutoRerouteEnabled] = useState(true);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [showOptimizationSuggestions, setShowOptimizationSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    status: ['available', 'low'] as Array<'available' | 'low' | 'out'>,
    maxDistance: 10,
    priceRange: [0, 200] as [number, number],
    amenities: [] as string[],
    brands: [] as string[],
    operatingHours: 'any' as 'any' | '24h' | 'open_now',
    sortBy: 'distance' as 'distance' | 'price' | 'rating' | 'updated'
  });

  const userLocation = position ? { lat: position.coords.latitude, lng: position.coords.longitude } : null;
  
  const { startNavigation, stopNavigation } = useVoiceNavigation(
    route,
    selectedLocation || userLocation,
    voiceEnabled
  );

  // Auto-rerouting when user deviates from route
  const handleAutoReroute = useCallback(async () => {
    if (!selectedStation || !userLocation) return;
    
    const waypointCoords = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    
    await getRoute(
      userLocation,
      {
        lat: selectedStation.lat,
        lng: selectedStation.lng,
      },
      waypointCoords
    );
  }, [selectedStation, userLocation, waypoints, getRoute]);

  const { isRerouting } = useAutoRerouting(
    route,
    userLocation,
    selectedStation ? { lat: selectedStation.lat, lng: selectedStation.lng } : null,
    {
      enabled: autoRerouteEnabled && !!route && !!selectedStation,
      deviationThreshold: 50, // 50 meters
      checkInterval: 5000, // Check every 5 seconds
      onReroute: handleAutoReroute,
    }
  );

  // Keep location empty until GPS or manual input is provided

  const filteredStations = stations.filter(station => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = station.name.toLowerCase().includes(query);
      const matchesAddress = station.address.toLowerCase().includes(query);
      const matchesBrand = station.brand?.toLowerCase().includes(query);
      if (!matchesName && !matchesAddress && !matchesBrand) return false;
    }

    // Filter by status
    if (!filters.status.includes(station.status)) return false;
    
    // Filter by brand
    if (filters.brands.length > 0 && station.brand && !filters.brands.includes(station.brand)) return false;
    
    // Filter by distance if location is available
    if (selectedLocation) {
      const distance = Math.sqrt(
        Math.pow(station.lat - selectedLocation.lat, 2) + 
        Math.pow(station.lng - selectedLocation.lng, 2)
      ) * 111; // Rough conversion to km
      if (distance > filters.maxDistance) return false;
    }
    
    return true;
  });

  const handleStationSelect = async (station: Station) => {
    setSelectedStation(station);
    setShowRouteAlternatives(false);

    if (!selectedLocation) {
      clearRoute();
      return;
    }

    const waypointCoords = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    await getRoute(
      selectedLocation,
      {
        lat: station.lat,
        lng: station.lng,
      },
      waypointCoords
    );
  };

  const handleGetDirections = async () => {
    if (!selectedStation || !selectedLocation) return;
    
    const waypointCoords = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    
    const routeResult = await getRoute(
      selectedLocation,
      {
        lat: selectedStation.lat,
        lng: selectedStation.lng,
      },
      waypointCoords
    );
    
    if (routeResult) {
      // Show route alternatives if multiple routes are available
      setSelectedRouteIndex(0);
      setShowRouteAlternatives(true);
    }
  };

  const handleConfirmRoute = () => {
    setShowRouteAlternatives(false);
    if (voiceEnabled) {
      startNavigation();
    }
  };

  const handleSelectRouteAlternative = (index: number) => {
    setSelectedRouteIndex(index);
    selectRoute(index);
  };

  const handleAddWaypoint = (waypoint: Omit<Waypoint, 'id'>) => {
    const newWaypoint = {
      ...waypoint,
      id: `waypoint-${Date.now()}-${Math.random()}`
    };
    setWaypoints([...waypoints, newWaypoint]);
    setAddingWaypoint(false);
    clearRoute(); // Clear route when waypoints change
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints(waypoints.filter(wp => wp.id !== id));
    clearRoute(); // Clear route when waypoints change
  };

  const handleReorderWaypoints = (newWaypoints: Waypoint[]) => {
    setWaypoints(newWaypoints);
    clearRoute(); // Clear route when waypoints change
  };

  const handleSelectWaypointLocation = () => {
    setAddingWaypoint(true);
    setShowWaypoints(false);
  };

  const handleSaveRoute = async (name: string) => {
    if (!selectedLocation || !selectedStation) return false;
    
    return await saveRoute(
      name,
      selectedLocation,
      {
        lat: selectedStation.lat,
        lng: selectedStation.lng,
        label: selectedStation.name
      },
      waypoints
    );
  };

  const handleLoadSavedRoute = async (savedRoute: any) => {
    // Set locations
    setSelectedLocation(savedRoute.start_location);
    
    // Find station if end location matches
    const matchingStation = stations.find(
      s => Math.abs(s.lat - savedRoute.end_location.lat) < 0.001 && 
           Math.abs(s.lng - savedRoute.end_location.lng) < 0.001
    );
    
    if (matchingStation) {
      setSelectedStation(matchingStation);
    }
    
    // Set waypoints
    setWaypoints(savedRoute.waypoints || []);
    
    // Close saved routes list
    setShowSavedRoutes(false);
    
    // Get route
    const waypointCoords = (savedRoute.waypoints || []).map((wp: any) => ({ 
      lat: wp.lat, 
      lng: wp.lng 
    }));
    
    await getRoute(
      savedRoute.start_location,
      savedRoute.end_location,
      waypointCoords
    );
    
    toast.success(`Loaded route: ${savedRoute.name}`);
  };

  const handleAnalyzeRoutes = async () => {
    if (savedRoutes.length === 0) {
      toast.error('No saved routes to analyze');
      return;
    }
    
    toast.info('Analyzing your saved routes...');
    await analyzeRoutes(savedRoutes);
    
    if (suggestions.length > 0) {
      setShowOptimizationSuggestions(true);
      setShowSavedRoutes(false);
    } else {
      toast.success('All your routes are already optimized!');
    }
  };

  const handleApplyOptimization = async (routeId: string) => {
    const savedRoute = savedRoutes.find(r => r.id === routeId);
    if (!savedRoute) return;
    
    await handleLoadSavedRoute(savedRoute);
    setShowOptimizationSuggestions(false);
    clearSuggestions();
  };

  const handleVoiceToggle = () => {
    if (voiceEnabled) {
      stopNavigation();
    } else if (route) {
      startNavigation();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleStationReported = () => {
    // The real-time subscription will automatically refetch stations
    setSelectedStation(null);
  };

  const handleLocationSelect = (location: { lat: number; lng: number; label?: string }) => {
    if (addingWaypoint) {
      handleAddWaypoint({
        lat: location.lat,
        lng: location.lng,
        label: location.label || 'Waypoint'
      });
    } else {
      setSelectedLocation(location);
      setLocationSource('manual');
      setShowSearch(false);
    }
  };

  const handleGetMyLocation = () => {
    setLocationSource('gps');
    requestLocation();
  };

  // Update selected location from geolocation unless user has manually pinned a location
  useEffect(() => {
    if (!position || locationSource === 'manual') return;

    setSelectedLocation((prev) => ({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      // Preserve a previously resolved place name until reverse geocode resolves the new one
      label: prev?.label && prev.label !== 'Your Location' ? prev.label : 'Your Location',
    }));
  }, [position, locationSource]);

  // Reverse geocode the GPS position into a human-readable place name (debounced)
  const lastGeocodedRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!position || locationSource === 'manual') return;
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Skip if we already geocoded a point within ~15m
    const last = lastGeocodedRef.current;
    if (last) {
      const dLat = (lat - last.lat) * 111000;
      const dLng = (lng - last.lng) * 111000 * Math.cos((lat * Math.PI) / 180);
      const moved = Math.sqrt(dLat * dLat + dLng * dLng);
      if (moved < 15) return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { signal: ctrl.signal, headers: { Accept: 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        const a = data.address ?? {};
        const place =
          data.name ||
          a.amenity ||
          a.shop ||
          a.building ||
          a.road ||
          a.neighbourhood ||
          a.suburb ||
          a.village ||
          a.town ||
          a.city ||
          'Your Location';
        const area = a.suburb || a.neighbourhood || a.city || a.town || a.village || '';
        const label = area && area !== place ? `${place}, ${area}` : place;

        lastGeocodedRef.current = { lat, lng };
        setSelectedLocation((prev) =>
          prev
            ? { ...prev, label }
            : { lat, lng, label }
        );
      } catch {
        /* ignore aborts/network errors */
      }
    }, 800);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [position, locationSource]);

  // Continuously watch GPS so accuracy updates live
  useEffect(() => {
    const watchId = watchLocation();
    return () => {
      if (watchId !== null && watchId !== undefined) {
        navigator.geolocation?.clearWatch(watchId);
      }
    };
  }, [watchLocation]);

  // Rolling 60s history of GPS accuracy values for sparkline
  const [accuracyHistory, setAccuracyHistory] = useState<AccuracyPoint[]>([]);
  useEffect(() => {
    if (locationSource !== 'gps' || accuracy === null) return;
    const now = Date.now();
    setAccuracyHistory(prev => {
      const next = [...prev, { t: now, v: accuracy }];
      const cutoff = now - 60_000;
      return next.filter(p => p.t >= cutoff);
    });
  }, [accuracy, locationSource]);

  // Tick to drop expired points even if GPS stops emitting
  useEffect(() => {
    const id = setInterval(() => {
      setAccuracyHistory(prev => {
        const cutoff = Date.now() - 60_000;
        const filtered = prev.filter(p => p.t >= cutoff);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Auto-prompt manual search ONCE when GPS accuracy is very poor (>500m)
  const lowAccuracyPromptedRef = useRef(false);
  const [accuracyBannerDismissed, setAccuracyBannerDismissed] = useState(false);
  useEffect(() => {
    if (locationSource !== 'gps' || accuracy === null) return;
    if (accuracy <= 500) {
      lowAccuracyPromptedRef.current = false;
      return;
    }
    if (lowAccuracyPromptedRef.current) return;
    lowAccuracyPromptedRef.current = true;
    setAccuracyBannerDismissed(false);
    toast.warning(
      `GPS is off by ±${Math.round(accuracy)}m. Search your address manually for a precise location.`,
      { duration: 6000 }
    );
  }, [accuracy, locationSource]);

  // Reset banner dismiss when accuracy improves back to good
  useEffect(() => {
    if (accuracy !== null && accuracy <= 50) setAccuracyBannerDismissed(false);
  }, [accuracy]);

  // Classify GPS fix quality for UI
  const gpsQuality = (() => {
    if (locationSource !== 'gps' || accuracy === null) {
      return null;
    }
    if (accuracy <= 20) return { tier: 'excellent' as const, label: 'Excellent', tone: 'success' as const, hint: 'GPS lock is sharp.' };
    if (accuracy <= 50) return { tier: 'good' as const, label: 'Good', tone: 'success' as const, hint: 'Solid GPS fix.' };
    if (accuracy <= 150) return { tier: 'fair' as const, label: 'Fair', tone: 'warning' as const, hint: 'Move outdoors or near a window for a better fix.' };
    if (accuracy <= 500) return { tier: 'poor' as const, label: 'Poor', tone: 'warning' as const, hint: 'Position may be off by a city block.' };
    return { tier: 'very-poor' as const, label: 'Very poor', tone: 'destructive' as const, hint: 'Search your address manually — GPS is unreliable here.' };
  })();

  const getRoleDisplayInfo = () => {
    if (hasRole('admin')) return { label: 'Admin', color: 'bg-red-500', icon: Crown };
    if (hasRole('manager')) return { label: 'Manager', color: 'bg-purple-500', icon: Shield };
    if (hasRole('driver')) return { label: 'Driver', color: 'bg-green-500', icon: Car };
    if (hasRole('passenger')) return { label: 'Passenger', color: 'bg-blue-500', icon: User };
    return { label: 'User', color: 'bg-gray-500', icon: Fuel };
  };

  const roleInfo = getRoleDisplayInfo();

  // ── Tab metadata for sheet header ──────────────────────────────────────────
  const tabMeta: Record<AppTab, { title: string; subtitle: string }> = {
    fuel: { title: 'Find Fuel', subtitle: 'Stations near you' },
    rides: { title: 'Get a Ride', subtitle: 'Around Zambia' },
    food: { title: 'Order Food', subtitle: 'Restaurants nearby' },
    packages: { title: 'Send a Package', subtitle: 'Same-day delivery' },
    errands: { title: 'Run an Errand', subtitle: 'A runner handles it' },
  };

  // Whether the active tab is map-centric (full-screen map behind sheet)
  const isMapTab = activeTab === 'fuel' || activeTab === 'rides';

  const mapHandleRef = useRef<LeafletMapHandle | null>(null);

  const handleRecenterFab = () => {
    setLocationSource('gps');
    if (position) {
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'Your Location',
      };
      setSelectedLocation(loc);
      // Zoom in close, like Google Maps "my location" button
      requestAnimationFrame(() => mapHandleRef.current?.recenter(18));
    } else {
      requestLocation();
      toast.info('Getting your location…');
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background relative overflow-hidden">
      <Toaster />

      {/* ── SLIM TOP BAR ────────────────────────────────────────────────── */}
      <header
        className="absolute top-0 inset-x-0 z-50 px-3 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        <div className="flex items-center gap-2">
          {/* Search pill — replaces the giant header search */}
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-background/95 backdrop-blur-md border shadow-md text-left text-sm text-muted-foreground hover:bg-background transition-colors"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedLocation?.label
                ? `📍 ${selectedLocation.label}`
                : `Where are you, ${tabMeta[activeTab].title.toLowerCase()}?`}
            </span>
            {locationSource === 'gps' && accuracy !== null && (
              <Badge
                variant={accuracy <= 30 ? 'default' : accuracy <= 100 ? 'secondary' : 'destructive'}
                className="ml-auto text-[10px] px-1.5 py-0 font-mono"
              >
                ±{Math.round(accuracy)}m
              </Badge>
            )}
          </button>

          {/* Right-side circular controls */}
          <div className="flex items-center gap-1.5">
            {user && <NotificationCenter />}
            <ThemeToggle />
            {user ? (
              <ProfileDialog />
            ) : (
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 rounded-full bg-background/95 backdrop-blur-md shadow-md"
                onClick={() => (window.location.href = '/auth')}
                title="Sign in"
              >
                <User className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Role badge + admin entry — small, secondary */}
        {user && (
          <div className="mt-2 flex items-center gap-2">
            <div className={cn(roleInfo.color, 'rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm')}>
              <roleInfo.icon className="h-3 w-3 text-white" />
              <span className="text-[10px] text-white font-medium">{roleInfo.label}</span>
            </div>
            {hasRole('admin') && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 rounded-full bg-background/95 backdrop-blur-md text-[10px]"
                onClick={() => setAdminOpen((v) => !v)}
              >
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Button>
            )}
            {!hasPermission && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 rounded-full bg-background/95 backdrop-blur-md text-[10px]"
                onClick={requestNotificationPermission}
                title="Enable notifications"
              >
                <BellOff className="h-3 w-3 mr-1" />
                Alerts
              </Button>
            )}
          </div>
        )}

        {/* GPS accuracy readout — always visible while GPS is active */}
        {gpsQuality && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm border backdrop-blur-md',
                gpsQuality.tone === 'success' && 'bg-success/15 text-success border-success/30',
                gpsQuality.tone === 'warning' && 'bg-warning/15 text-warning-foreground border-warning/40',
                gpsQuality.tone === 'destructive' && 'bg-destructive/15 text-destructive border-destructive/40'
              )}
              title={gpsQuality.hint}
              role="status"
              aria-live="polite"
            >
              <Signal className="h-3 w-3" />
              <span className="font-mono">±{Math.round(accuracy!)}m</span>
              <span className="opacity-70">·</span>
              <span>{gpsQuality.label}</span>
            </div>
          </div>
        )}

        {/* Persistent low-accuracy banner */}
        {gpsQuality && (gpsQuality.tier === 'poor' || gpsQuality.tier === 'very-poor') && !accuracyBannerDismissed && (
          <div
            className={cn(
              'mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 shadow-md backdrop-blur-md text-xs',
              gpsQuality.tier === 'very-poor'
                ? 'bg-destructive/10 border-destructive/40 text-destructive'
                : 'bg-warning/10 border-warning/40 text-warning-foreground'
            )}
            role="alert"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">
                Low GPS accuracy (±{Math.round(accuracy!)}m)
              </div>
              <div className="opacity-90 leading-snug">{gpsQuality.hint}</div>
              <button
                onClick={() => setShowSearch(true)}
                className="mt-1 underline underline-offset-2 font-medium"
              >
                Search address manually
              </button>
            </div>
            <button
              onClick={() => setAccuracyBannerDismissed(true)}
              aria-label="Dismiss"
              className="shrink-0 rounded p-0.5 hover:bg-background/40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* ── FULL-SCREEN MAP (for fuel + rides) ──────────────────────────── */}
      {isMapTab && (
        <div className="absolute inset-0">
          {activeTab === 'fuel' ? (
            stationsLoading ? (
              <StationMapSkeleton />
            ) : (
              <LeafletMap
                ref={mapHandleRef}
                stations={filteredStations}
                onSelect={handleStationSelect}
                focusPoint={selectedLocation}
                route={route}
                waypoints={waypoints}
                accuracyRadius={locationSource === 'gps' ? accuracy : null}
                isLiveLocation={locationSource === 'gps'}
                className="h-full"
              />
            )
          ) : (
            <RideShareMap focusPoint={selectedLocation} className="h-full w-full" />
          )}

          {/* Floating recenter FAB (above the sheet) */}
          <Button
            size="icon"
            variant="outline"
            className="absolute right-4 z-40 h-12 w-12 rounded-full bg-background/95 backdrop-blur-md shadow-lg"
            style={{ bottom: `calc(env(safe-area-inset-bottom) + 64px + 16px + 50dvh)` }}
            onClick={handleRecenterFab}
            title="Center on my location"
          >
            <LocateFixed className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* ── NON-MAP TABS: scrollable content area ───────────────────────── */}
      {!isMapTab && (
        <main
          className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-primary/5 via-background to-background"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 5rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
          }}
        >
          <div className="px-4 pb-6 max-w-2xl mx-auto">
            <div className="mb-5">
              <h1 className="text-2xl font-bold">{tabMeta[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground">{tabMeta[activeTab].subtitle}</p>
            </div>

            {!user ? (
              <Card className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Sign in to continue</h2>
                  <p className="text-sm text-muted-foreground">
                    {tabMeta[activeTab].title} requires an account.
                  </p>
                </div>
                <Button onClick={() => (window.location.href = '/auth')} className="w-full">
                  Get started
                </Button>
              </Card>
            ) : activeTab === 'food' ? (
              <FoodDeliveryDashboard />
            ) : activeTab === 'packages' ? (
              <PackageDeliveryForm />
            ) : activeTab === 'errands' ? (
              <ErrandsForm pickupLabel={selectedLocation?.label} />
            ) : null}

            {user && <div className="mt-6"><OrderTracker /></div>}
          </div>
        </main>
      )}

      {/* ── BOTTOM SHEET (fuel + rides) ─────────────────────────────────── */}
      {isMapTab && (
        <MapBottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          bottomInset={64}
          header={
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-base truncate">
                  {tabMeta[activeTab].title}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {activeTab === 'fuel'
                    ? `${filteredStations.length} stations near you`
                    : tabMeta[activeTab].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeTab === 'fuel' && (
                  <>
                    {canManageStations() && (
                      <AddStationDialog onStationAdded={handleStationReported} />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFilters(true)}
                      className="h-9 px-3"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {activeTab === 'rides' && canDrive() && (
                  <div className="flex bg-secondary rounded-full p-0.5">
                    <button
                      onClick={() => setRideShareMode('passenger')}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full font-medium transition-colors',
                        rideShareMode === 'passenger'
                          ? 'bg-background shadow text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      Ride
                    </button>
                    <button
                      onClick={() => setRideShareMode('driver')}
                      className={cn(
                        'px-3 py-1 text-xs rounded-full font-medium transition-colors',
                        rideShareMode === 'driver'
                          ? 'bg-background shadow text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      Drive
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
        >
          {activeTab === 'fuel' && (
            <div className="space-y-4">
              {/* Compact stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-success/10 p-3 text-center">
                  <div className="text-xl font-bold text-success">
                    {filteredStations.filter((s) => s.status === 'available').length}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">
                    Available
                  </div>
                </div>
                <div className="rounded-xl bg-warning/10 p-3 text-center">
                  <div className="text-xl font-bold text-warning">
                    {filteredStations.filter((s) => s.status === 'low').length}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">
                    Low
                  </div>
                </div>
                <div className="rounded-xl bg-destructive/10 p-3 text-center">
                  <div className="text-xl font-bold text-destructive">
                    {filteredStations.filter((s) => s.status === 'out').length}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium uppercase">
                    Out
                  </div>
                </div>
              </div>

              <TransportModeSelector
                value={transportMode}
                onChange={(m) => {
                  changeTransportMode(m);
                  if (route && selectedStation && selectedLocation) {
                    const wp = waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));
                    getRoute(
                      selectedLocation,
                      { lat: selectedStation.lat, lng: selectedStation.lng },
                      wp,
                      m
                    );
                  }
                }}
              />

              {/* Selected station summary */}
              {selectedStation && (
                <Card className="p-3 border-primary/40">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 animate-pulse',
                        selectedStation.status === 'available' && 'bg-success',
                        selectedStation.status === 'low' && 'bg-warning',
                        selectedStation.status === 'out' && 'bg-destructive'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {selectedStation.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {selectedStation.address}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedStation(null)}
                      className="w-7 h-7 -mt-1 -mr-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StationDetails
                      station={selectedStation}
                      userLocation={selectedLocation || undefined}
                      onClose={() => setSelectedStation(null)}
                    />
                    <Button
                      size="sm"
                      onClick={handleGetDirections}
                      disabled={routeLoading || !selectedLocation}
                      className="h-9"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      {routeLoading ? 'Loading…' : 'Route'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFavoriteStation(selectedStation.id)}
                      className="h-9"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          profile?.preferences?.favorite_stations?.includes(selectedStation.id)
                            ? 'text-warning fill-warning'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    {user && (
                      <Button
                        size="sm"
                        variant={showWaypoints ? 'secondary' : 'outline'}
                        onClick={() => setShowWaypoints(!showWaypoints)}
                        className="h-9"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        Stops{waypoints.length > 0 && ` (${waypoints.length})`}
                      </Button>
                    )}
                    {user && (
                      <Button
                        size="sm"
                        variant={showSavedRoutes ? 'secondary' : 'outline'}
                        onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                        className="h-9"
                      >
                        <Bookmark className="h-4 w-4 mr-1" />
                        Saved
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Active route — collapsible turn-by-turn */}
              {route && !showRouteAlternatives && (
                <TurnByTurnDirections
                  route={route}
                  onClose={() => {
                    clearRoute();
                    stopNavigation();
                    setVoiceEnabled(false);
                  }}
                  destinationName={selectedStation?.name || ''}
                  voiceEnabled={voiceEnabled}
                  onVoiceToggle={handleVoiceToggle}
                  waypoints={waypoints}
                  autoRerouteEnabled={autoRerouteEnabled}
                  onAutoRerouteToggle={() => setAutoRerouteEnabled(!autoRerouteEnabled)}
                  isRerouting={isRerouting}
                />
              )}

              {showRouteAlternatives && routeAlternatives.length > 0 && (
                <RouteAlternatives
                  routes={routeAlternatives}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={handleSelectRouteAlternative}
                  onClose={() => setShowRouteAlternatives(false)}
                  onConfirm={handleConfirmRoute}
                />
              )}

              {showWaypoints && selectedStation && (
                <WaypointsManager
                  waypoints={waypoints}
                  onAddWaypoint={handleAddWaypoint}
                  onRemoveWaypoint={handleRemoveWaypoint}
                  onReorderWaypoints={handleReorderWaypoints}
                  onSelectLocation={handleSelectWaypointLocation}
                />
              )}

              {showSavedRoutes && user && (
                <SavedRoutesList
                  routes={savedRoutes}
                  onLoadRoute={handleLoadSavedRoute}
                  onDeleteRoute={deleteRoute}
                  onUpdateRoute={updateRoute}
                  onClose={() => setShowSavedRoutes(false)}
                />
              )}

              {showOptimizationSuggestions && user && (
                <RouteOptimizationSuggestions
                  suggestions={suggestions}
                  onApplySuggestion={handleApplyOptimization}
                  onClose={() => {
                    setShowOptimizationSuggestions(false);
                    clearSuggestions();
                  }}
                />
              )}

              {route && selectedStation && user && !showRouteAlternatives && (
                <SaveRouteDialog
                  startLocation={selectedLocation}
                  endLocation={
                    selectedStation
                      ? {
                          lat: selectedStation.lat,
                          lng: selectedStation.lng,
                          label: selectedStation.name,
                        }
                      : null
                  }
                  waypoints={waypoints}
                  onSave={handleSaveRoute}
                />
              )}

              {/* Station list */}
              <div>
                <h3 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                  Nearby stations
                </h3>
                {filteredStations.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-sm font-medium mb-1">No stations match</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Try adjusting your filters or zoom out.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFilters({
                          status: ['available', 'low'],
                          maxDistance: 10,
                          priceRange: [0, 200],
                          amenities: [],
                          brands: [],
                          operatingHours: 'any',
                          sortBy: 'distance',
                        })
                      }
                    >
                      Reset filters
                    </Button>
                  </Card>
                ) : (
                  <StationList
                    stations={filteredStations}
                    origin={selectedLocation}
                    selectedId={selectedStation?.id}
                    onSelect={handleStationSelect}
                    favorites={new Set(profile?.preferences?.favorite_stations || [])}
                    onToggleFavorite={toggleFavoriteStation}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'rides' && (
            <div className="space-y-4">
              {!user ? (
                <Card className="p-6 text-center space-y-3">
                  <Car className="h-10 w-10 text-primary mx-auto" />
                  <h3 className="font-semibold">Sign in to ride</h3>
                  <Button onClick={() => (window.location.href = '/auth')} className="w-full">
                    Get started
                  </Button>
                </Card>
              ) : !canRequestRides() ? (
                <Card className="p-6 text-center space-y-3">
                  <Car className="h-10 w-10 text-warning mx-auto" />
                  <h3 className="font-semibold">Passenger role required</h3>
                  <p className="text-sm text-muted-foreground">
                    Add the passenger role from your profile to request rides.
                  </p>
                  <ProfileDialog />
                </Card>
              ) : (
                <>
                  <ServiceSelector
                    selectedService={selectedService}
                    onServiceChange={setSelectedService}
                  />
                  <OrderTracker />
                  {selectedService === 'ride' &&
                    (rideShareMode === 'driver' && canDrive() ? (
                      <DriverDashboard />
                    ) : (
                      <PassengerDashboard />
                    ))}
                  {selectedService === 'food_delivery' &&
                    (rideShareMode === 'driver' && canDrive() ? (
                      <DriverDeliveryDashboard />
                    ) : (
                      <FoodDeliveryDashboard />
                    ))}
                  {selectedService === 'package_delivery' &&
                    (rideShareMode === 'driver' && canDrive() ? (
                      <DriverDeliveryDashboard />
                    ) : (
                      <PackageDeliveryForm />
                    ))}
                </>
              )}
            </div>
          )}
        </MapBottomSheet>
      )}

      {/* ── SEARCH SHEET (full search overlay) ──────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md animate-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-4 pt-3 pb-4 border-b flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSearch(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold">Search</h2>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 80px)' }}>
            {activeTab === 'fuel' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations by name, brand, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            )}
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                Set your location
              </p>
              <EnhancedLocationSearch
                onSelectLocation={(loc) => {
                  handleLocationSelect(loc);
                  setShowSearch(false);
                }}
                placeholder="Type your address…"
              />
              <SavedLocationsBar
                currentLocation={selectedLocation}
                onSelectLocation={(loc) => {
                  handleLocationSelect(loc);
                  setShowSearch(false);
                }}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={handleRecenterFab}>
              <LocateFixed className="h-4 w-4 mr-2" />
              Use my GPS location
            </Button>
            {locationSource === 'gps' && accuracy !== null && accuracy > 100 && (
              <p className="text-xs text-destructive">
                ⚠️ GPS accuracy is low (±{Math.round(accuracy)}m). Type your address for a precise pin.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ADDING-WAYPOINT FULL-SCREEN PROMPT ──────────────────────────── */}
      {addingWaypoint && (
        <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md animate-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="px-4 pt-3 pb-4 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold">Add a stop</h2>
            <Button size="icon" variant="ghost" onClick={() => setAddingWaypoint(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Search for a location to add as a stop on your route.
            </p>
            <EnhancedLocationSearch onSelectLocation={handleLocationSelect} />
          </div>
        </div>
      )}

      {/* ── ADMIN OVERLAY ───────────────────────────────────────────────── */}
      {adminOpen && hasRole('admin') && (
        <div className="fixed inset-0 z-[70] bg-background overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="sticky top-0 z-10 px-4 py-3 border-b bg-background/95 backdrop-blur-md flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Admin
            </h2>
            <Button size="icon" variant="ghost" onClick={() => setAdminOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4 pb-24">
            <AdminPanel />
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={() => {}}
        onClearFilters={() =>
          setFilters({
            status: ['available', 'low'],
            maxDistance: 10,
            priceRange: [0, 200],
            amenities: [],
            brands: [],
            operatingHours: 'any',
            sortBy: 'distance',
          })
        }
      />

      {/* ── BOTTOM TAB NAV (always on top) ──────────────────────────────── */}
      <AppBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}