import { useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import LeafletMap from "@/components/map/LeafletMap";
import RideShareMap from "@/components/rideshare/RideShareMap";
import StationList from "@/components/StationList";
import StationListSkeleton from "@/components/StationListSkeleton";
import StationMapSkeleton from "@/components/StationMapSkeleton";
import AdvancedFilters from "@/components/AdvancedFilters";
import EnhancedLocationSearch from "@/components/map/EnhancedLocationSearch";
import ManagerLogin from "@/components/ManagerLogin";
import ThemeToggle from "@/components/ThemeToggle";
import DriverDashboard from "@/components/rideshare/DriverDashboard";
import PassengerDashboard from "@/components/rideshare/PassengerDashboard";
import BottomBar from "@/components/mobile/BottomBar";
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
  const { position, requestLocation, getLocationOrDefault } = useGeolocation();
  const { roles, hasRole, canManageStations, canDrive, canRequestRides } = useRoles();
  const { hasPermission, requestNotificationPermission } = useNotifications();
  useRealtimeNotifications(); // Enable realtime notifications
  const { route, routeAlternatives, loading: routeLoading, transportMode, getRoute, clearRoute, selectRoute, changeTransportMode } = useRouting();
  const { savedRoutes, loading: savedRoutesLoading, saveRoute, deleteRoute, updateRoute } = useSavedRoutes();
  const { suggestions, loading: optimizationLoading, analyzeRoutes, clearSuggestions } = useRouteOptimization();
  
  const [mode, setMode] = useState<'fuel' | 'rideshare' | 'admin'>('fuel');
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedService, setSelectedService] = useState<'ride' | 'food_delivery' | 'package_delivery'>('ride');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
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

  // Initialize with Lusaka as default location
  useEffect(() => {
    if (!selectedLocation) {
      setSelectedLocation({
        lat: -15.3875,
        lng: 28.3228,
        label: 'Lusaka, Zambia'
      });
    }
  }, [selectedLocation]);

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

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    clearRoute(); // Clear route when selecting a new station
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
      setShowSearch(false);
    }
  };

  const handleGetMyLocation = () => {
    requestLocation();
  };

  // Update selected location when geolocation changes
  useEffect(() => {
    if (position) {
      setSelectedLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        label: 'Your Location'
      });
    }
  }, [position]);

  const getRoleDisplayInfo = () => {
    if (hasRole('admin')) return { label: 'Admin', color: 'bg-red-500', icon: Crown };
    if (hasRole('manager')) return { label: 'Manager', color: 'bg-purple-500', icon: Shield };
    if (hasRole('driver')) return { label: 'Driver', color: 'bg-green-500', icon: Car };
    if (hasRole('passenger')) return { label: 'Passenger', color: 'bg-blue-500', icon: User };
    return { label: 'User', color: 'bg-gray-500', icon: Fuel };
  };

  const roleInfo = getRoleDisplayInfo();

  return (
    <div className="min-h-screen bg-background relative">
      <Toaster />
      
      {/* Mobile Header */}
      <header className="mobile-header mobile-safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
              {mode === 'fuel' ? (
                <Fuel className="h-5 w-5 text-primary-foreground" />
              ) : (
                <Car className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                {mode === 'fuel' ? 'FuelFinder' : 'RideShare'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedLocation?.label || 'Lusaka, Zambia'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {user && (
              <>
                <NotificationCenter />
                {!hasPermission && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-10 h-10 rounded-xl"
                    onClick={requestNotificationPermission}
                    title="Enable notifications"
                  >
                    <BellOff className="h-4 w-4" />
                  </Button>
                )}
                <div className={`${roleInfo.color} rounded-lg px-2 py-1 flex items-center gap-1`}>
                  <roleInfo.icon className="h-3 w-3 text-white" />
                  <span className="text-xs text-white font-medium">{roleInfo.label}</span>
                </div>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="w-10 h-10 rounded-xl"
              onClick={handleGetMyLocation}
              title="Get my location"
            >
              <LocateFixed className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-10 h-10 rounded-xl"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            {user ? (
              <ProfileDialog />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-10 rounded-xl"
                onClick={() => window.location.href = '/auth'}
              >
                <User className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-4 animate-slide-up space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations by name, brand, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <EnhancedLocationSearch onSelectLocation={handleLocationSelect} />
          </div>
        )}

        {/* Mode Toggle */}
        <div className="mt-4 flex bg-secondary rounded-2xl p-1">
          <button
            onClick={() => setMode('fuel')}
            className={`mobile-tab ${mode === 'fuel' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
          >
            <Fuel className="h-4 w-4 mr-2" />
            Fuel
          </button>
          <button
            onClick={() => setMode('rideshare')}
            className={`mobile-tab ${mode === 'rideshare' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
          >
            <Car className="h-4 w-4 mr-2" />
            Rides
          </button>
          {hasRole('admin') && (
            <button
              onClick={() => setMode('admin')}
              className={`mobile-tab ${mode === 'admin' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </button>
          )}
        </div>

        {/* Rideshare Sub-tabs */}
        {mode === 'rideshare' && user && canRequestRides() && (
          <div className="mt-3 flex bg-secondary rounded-2xl p-1">
            <button
              onClick={() => setRideShareMode('passenger')}
              className={`mobile-tab ${rideShareMode === 'passenger' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Need Ride
            </button>
            {canDrive() && (
              <button
                onClick={() => setRideShareMode('driver')}
                className={`mobile-tab ${rideShareMode === 'driver' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Drive
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {mode === 'fuel' ? (
          <div className="flex flex-col h-full w-full">
            {/* Map Section */}
            <div className="w-full h-[45vh] min-h-[300px] relative bg-muted/30">
              {stationsLoading ? (
                <StationMapSkeleton />
              ) : (
                <LeafletMap
                  stations={filteredStations}
                  onSelect={handleStationSelect}
                  focusPoint={selectedLocation}
                  route={route}
                  waypoints={waypoints}
                  className="h-full"
                />
              )}
            </div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md sticky top-0 z-20 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="font-semibold text-base">Nearby Stations</h2>
                  <p className="text-xs text-muted-foreground">From your chosen point</p>
                </div>
                <TransportModeSelector 
                  value={transportMode} 
                  onChange={(mode) => {
                    changeTransportMode(mode);
                    if (route && selectedStation && selectedLocation) {
                      // Re-fetch route with new transport mode
                      const waypointCoords = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
                      getRoute(selectedLocation, { lat: selectedStation.lat, lng: selectedStation.lng }, waypointCoords, mode);
                    }
                  }} 
                />
              </div>
              <div className="flex gap-2">
                {canManageStations() && <AddStationDialog onStationAdded={handleStationReported} />}
                <Button size="sm" variant="outline" onClick={() => setShowFilters(true)} className="h-9 px-3">
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="text-xs">Filter</span>
                </Button>
              </div>
            </div>
            {/* Station List - increased bottom padding to prevent overlap */}
            <div className="flex-1 overflow-y-auto px-4 pb-64">
              {filteredStations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <h2 className="text-lg font-semibold mb-2">No stations found</h2>
                  <p className="text-muted-foreground mb-2">Try resetting your filters or zooming out.</p>
                  <Button size="sm" variant="outline" onClick={() => setFilters({
                    status: ['available', 'low'],
                    maxDistance: 10,
                    priceRange: [0, 200],
                    amenities: [],
                    brands: [],
                    operatingHours: 'any',
                    sortBy: 'distance'
                  })}>Reset Filters</Button>
                </div>
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
            {/* Station Status Summary - adjusted positioning */}
            <div className="fixed bottom-24 left-4 right-4 z-10 pointer-events-none md:hidden">
              <div className="bg-background/98 backdrop-blur-xl rounded-2xl p-4 shadow-elegant border border-border/50 pointer-events-auto">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-success">{filteredStations.filter(s => s.status === 'available').length}</div>
                    <div className="text-xs text-muted-foreground font-medium">Available</div>
                  </div>
                  <div className="space-y-1 border-x border-border/50">
                    <div className="text-2xl font-bold text-warning">{filteredStations.filter(s => s.status === 'low').length}</div>
                    <div className="text-xs text-muted-foreground font-medium">Low Stock</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-destructive">{filteredStations.filter(s => s.status === 'out').length}</div>
                    <div className="text-xs text-muted-foreground font-medium">Out of Stock</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Selected Station Dialog */}
            {selectedStation && (
              <div className="fixed bottom-44 left-4 right-4 z-20 animate-slide-up md:hidden">
                <div className="bg-background/98 backdrop-blur-xl rounded-2xl p-4 shadow-elegant border border-primary/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1 flex-shrink-0 animate-pulse",
                      selectedStation.status === 'available' && "bg-success",
                      selectedStation.status === 'low' && "bg-warning", 
                      selectedStation.status === 'out' && "bg-destructive"
                    )} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{selectedStation.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{selectedStation.address}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedStation(null)}
                      className="w-8 h-8 rounded-full p-0 flex-shrink-0 hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <StationDetails 
                      station={selectedStation}
                      userLocation={selectedLocation || undefined}
                      onClose={() => setSelectedStation(null)}
                    />
                    <Button 
                      size="sm" 
                      variant={showWaypoints ? 'secondary' : 'outline'}
                      onClick={() => setShowWaypoints(!showWaypoints)}
                      className="h-9 px-3"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Stops{waypoints.length > 0 && ` (${waypoints.length})`}
                    </Button>
                    {user && (
                      <>
                        <Button 
                          size="sm" 
                          variant={showSavedRoutes ? 'secondary' : 'outline'}
                          onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                          className="h-9 px-3"
                        >
                          <Bookmark className="h-4 w-4 mr-1" />
                          Saved
                        </Button>
                        {savedRoutes.length > 0 && (
                          <Button 
                            size="sm" 
                            variant={showOptimizationSuggestions ? 'secondary' : 'outline'}
                            onClick={handleAnalyzeRoutes}
                            disabled={optimizationLoading}
                            className="h-9 px-3"
                          >
                            <Lightbulb className="h-4 w-4 mr-1" />
                            {optimizationLoading ? 'Analyzing...' : 'Optimize'}
                          </Button>
                        )}
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={handleGetDirections}
                      disabled={routeLoading || !selectedLocation}
                      className="h-9 px-3"
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      {routeLoading ? 'Loading...' : 'Route'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toggleFavoriteStation(selectedStation.id);
                      }}
                      className="px-3 hover:bg-warning/10"
                    >
                      <Star className={cn("h-4 w-4 transition-all",
                        profile?.preferences?.favorite_stations?.includes(selectedStation.id)
                          ? 'text-warning fill-warning'
                          : 'text-muted-foreground'
                      )} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Waypoints Manager */}
            {showWaypoints && selectedStation && (
              <div className="fixed bottom-44 left-4 right-4 z-20 animate-slide-up md:hidden">
                <WaypointsManager
                  waypoints={waypoints}
                  onAddWaypoint={handleAddWaypoint}
                  onRemoveWaypoint={handleRemoveWaypoint}
                  onReorderWaypoints={handleReorderWaypoints}
                  onSelectLocation={handleSelectWaypointLocation}
                />
              </div>
            )}

            {/* Adding Waypoint Prompt */}
            {addingWaypoint && (
              <div className="fixed top-20 left-4 right-4 z-30 animate-slide-up">
                <Card className="bg-background/95 backdrop-blur-md border-primary/50 shadow-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Select Waypoint Location</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAddingWaypoint(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Search for a location to add as a stop on your route
                  </p>
                  <EnhancedLocationSearch onSelectLocation={handleLocationSelect} />
                </Card>
              </div>
            )}
            
            {/* Route Alternatives */}
            {showRouteAlternatives && routeAlternatives.length > 0 && (
              <div className="fixed top-20 left-4 right-4 z-30 animate-slide-up md:left-auto md:right-4 md:w-96">
                <RouteAlternatives
                  routes={routeAlternatives}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectRoute={handleSelectRouteAlternative}
                  onClose={() => setShowRouteAlternatives(false)}
                  onConfirm={handleConfirmRoute}
                />
              </div>
            )}

            {/* Saved Routes List */}
            {showSavedRoutes && user && (
              <div className="fixed top-20 left-4 right-4 z-30 animate-slide-up md:left-auto md:right-4 md:w-96">
                <SavedRoutesList
                  routes={savedRoutes}
                  onLoadRoute={handleLoadSavedRoute}
                  onDeleteRoute={deleteRoute}
                  onUpdateRoute={updateRoute}
                  onClose={() => setShowSavedRoutes(false)}
                />
              </div>
            )}

            {/* Route Optimization Suggestions */}
            {showOptimizationSuggestions && user && (
              <div className="fixed top-20 left-4 right-4 z-30 animate-slide-up md:left-auto md:right-4 md:w-96">
                <RouteOptimizationSuggestions
                  suggestions={suggestions}
                  onApplySuggestion={handleApplyOptimization}
                  onClose={() => {
                    setShowOptimizationSuggestions(false);
                    clearSuggestions();
                  }}
                />
              </div>
            )}

            {/* Save Route Dialog - shown when route is active */}
            {route && selectedStation && user && !showRouteAlternatives && (
              <div className="fixed bottom-44 left-4 z-20 md:bottom-auto md:top-96 md:left-4">
                <SaveRouteDialog
                  startLocation={selectedLocation}
                  endLocation={selectedStation ? {
                    lat: selectedStation.lat,
                    lng: selectedStation.lng,
                    label: selectedStation.name
                  } : null}
                  waypoints={waypoints}
                  onSave={handleSaveRoute}
                />
              </div>
            )}

            {/* Turn by Turn Directions */}
            {route && !showRouteAlternatives && (
              <div className="fixed top-24 left-4 right-4 z-20 md:left-auto md:right-4 md:w-96">
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
              </div>
            )}
          </div>
        ) : mode === 'admin' && hasRole('admin') ? (
          <div className="pb-24 px-4 overflow-y-auto h-[calc(100vh-250px)]">
            <AdminPanel />
          </div>
        ) : (
          <>
            {/* Rideshare Content */}
            {!user ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-240px)] p-8">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Car className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
                <p className="text-muted-foreground mb-6">
                  Sign in to request rides or become a driver
                </p>
              </div>
              <Button
                onClick={() => window.location.href = '/auth'}
                className="w-full max-w-xs mx-auto"
                size="lg"
              >
                Get Started
              </Button>
            </div>
              </div>
            ) : !canRequestRides() ? (
              <div className="flex items-center justify-center min-h-[calc(100vh-240px)] p-8">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                    <Car className="h-12 w-12 text-warning" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Passenger Role Required</h2>
                    <p className="text-muted-foreground mb-6">
                      You need passenger privileges to access rideshare features. Add the passenger role from your profile.
                    </p>
                  </div>
                  <ProfileDialog />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[calc(100vh-240px)]">
                {/* Rideshare Map */}
                <div className="flex-1 min-h-[300px]">
                  <RideShareMap
                    focusPoint={selectedLocation}
                    className="h-full w-full"
                  />
                </div>
                
                {/* Dashboard */}
                <div className="flex-1 p-4 bg-background overflow-y-auto pb-24">
                  <div className="mobile-card space-y-4">
                    <ServiceSelector 
                      selectedService={selectedService}
                      onServiceChange={setSelectedService}
                    />
                    <OrderTracker />
                    {selectedService === 'ride' && (
                      rideShareMode === 'driver' && canDrive() ? (
                        <DriverDashboard />
                      ) : (
                        <PassengerDashboard />
                      )
                    )}
                    {selectedService === 'food_delivery' && (
                      rideShareMode === 'driver' && canDrive() ? (
                        <DriverDeliveryDashboard />
                      ) : (
                        <FoodDeliveryDashboard />
                      )
                    )}
                    {selectedService === 'package_delivery' && (
                      rideShareMode === 'driver' && canDrive() ? (
                        <DriverDeliveryDashboard />
                      ) : (
                        <PackageDeliveryForm />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      {mode === 'fuel' && (
        <button
          className="mobile-floating-button"
          onClick={() => setShowSearch(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={() => {}}
        onClearFilters={() => setFilters({
          status: ['available', 'low'],
          maxDistance: 10,
          priceRange: [0, 200],
          amenities: [],
          brands: [],
          operatingHours: 'any',
          sortBy: 'distance'
        })}
      />

      {/* Mobile Bottom Navigation */}
      <BottomBar />
    </div>
  );
}