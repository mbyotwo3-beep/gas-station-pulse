import { useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
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
import ProfileDialog from "@/components/ProfileDialog";
import StationReportDialog from "@/components/StationReportDialog";
import AddStationDialog from "@/components/AddStationDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useStations";
import { useProfile } from "@/hooks/useProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  Crown
} from "lucide-react";
import type { Station } from "@/hooks/useStations";

export default function Index() {
  const { user, signOut } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { profile, toggleFavoriteStation, isFavorite } = useProfile();
  const { position, requestLocation, getLocationOrDefault } = useGeolocation();
  const { roles, hasRole, canManageStations, canDrive, canRequestRides } = useRoles();
  
  const [mode, setMode] = useState<'fuel' | 'rideshare'>('fuel');
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: ['available', 'low'] as Array<'available' | 'low' | 'out'>,
    maxDistance: 10,
    priceRange: [0, 200] as [number, number],
    amenities: [] as string[],
    brands: [] as string[],
    operatingHours: 'any' as 'any' | '24h' | 'open_now',
    sortBy: 'distance' as 'distance' | 'price' | 'rating' | 'updated'
  });

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
    // Filter by status
    if (!filters.status.includes(station.status)) return false;
    
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
  };

  const handleStationReported = () => {
    // Refetch stations when a new report is submitted
    if (typeof stations !== 'undefined') {
      // This will trigger the real-time subscription to refetch data
      window.location.reload();
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; label?: string }) => {
    setSelectedLocation(location);
    setShowSearch(false);
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

  // Add ref and debug state for map container
  const mapContainerRef = useRef(null);
  const [mapDebug, setMapDebug] = useState({ found: false, width: 0, height: 0, children: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const mapDiv = mapContainerRef.current?.querySelector?.('.leaflet-container');
      if (mapDiv) {
        const rect = mapDiv.getBoundingClientRect();
        setMapDebug({ found: true, width: rect.width, height: rect.height, children: mapDiv.children.length });
      } else {
        setMapDebug({ found: false, width: 0, height: 0, children: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
              <div className={`${roleInfo.color} rounded-lg px-2 py-1 flex items-center gap-1`}>
                <roleInfo.icon className="h-3 w-3 text-white" />
                <span className="text-xs text-white font-medium">{roleInfo.label}</span>
              </div>
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
          <div className="mt-4 animate-slide-up">
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
            <div ref={mapContainerRef} className="w-full" style={{ minHeight: '400px', maxHeight: '400px', border: '3px solid red', background: '#fff', position: 'relative' }}>
              <LeafletMap
                stations={filteredStations}
                onSelect={handleStationSelect}
                focusPoint={selectedLocation}
                className="h-full w-full"
              />
              <div style={{ position: 'absolute', top: 10, left: 10, color: 'red', fontWeight: 'bold', zIndex: 10000, background: '#fff', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {mapDebug.found
                  ? `leaflet-container: ${mapDebug.width.toFixed(0)}x${mapDebug.height.toFixed(0)}, children: ${mapDebug.children}`
                  : 'leaflet-container not found'}
                <br />If you see this message and no map, Leaflet is not rendering.
              </div>
            </div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-background sticky top-0 z-20">
              <h2 className="font-semibold text-lg">Nearby Stations</h2>
              <div className="flex gap-2">
                {canManageStations() && <AddStationDialog onStationAdded={handleStationReported} />}
                <Button size="sm" variant="ghost" onClick={() => setShowFilters(true)}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Station List */}
            <div className="flex-1 overflow-y-auto px-4 pb-24">
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
            {/* Station Status Summary */}
            <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
              <div className="bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-success">{filteredStations.filter(s => s.status === 'available').length}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-warning">{filteredStations.filter(s => s.status === 'low').length}</div>
                    <div className="text-xs text-muted-foreground">Low Stock</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-destructive">{filteredStations.filter(s => s.status === 'out').length}</div>
                    <div className="text-xs text-muted-foreground">Out of Stock</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Selected Station Dialog */}
            {selectedStation && (
              <div className="fixed bottom-36 left-0 right-0 px-4 z-40">
                <div className="bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full",
                      selectedStation.status === 'available' && "bg-success",
                      selectedStation.status === 'low' && "bg-warning", 
                      selectedStation.status === 'out' && "bg-destructive"
                    )} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{selectedStation.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedStation.address}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedStation(null)}
                      className="w-6 h-6 rounded-lg"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <StationReportDialog
                      station={selectedStation}
                      onReportSubmitted={handleStationReported}
                    >
                      <Button size="sm" className="flex-1">
                        Report Status
                      </Button>
                    </StationReportDialog>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toggleFavoriteStation(selectedStation.id);
                      }}
                      className="px-3"
                    >
                      <Star className={cn("h-4 w-4",
                        profile?.preferences?.favorite_stations?.includes(selectedStation.id)
                          ? 'text-warning fill-current'
                          : 'text-muted-foreground'
                      )} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Rideshare Content */}
            {!user ? (
              <div className="flex items-center justify-center h-[calc(100vh-200px)] p-8">
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
              <button
                onClick={() => window.location.href = '/auth'}
                className="mobile-button w-full max-w-xs mx-auto"
              >
                Get Started
              </button>
            </div>
              </div>
            ) : !canRequestRides() ? (
              <div className="flex items-center justify-center h-[calc(100vh-200px)] p-8">
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
              <div className="h-[calc(100vh-200px)]">
                {/* Rideshare Map */}
                <div className="h-1/2">
                  <RideShareMap
                    focusPoint={selectedLocation}
                    className="h-full w-full"
                  />
                </div>
                
                {/* Dashboard */}
                <div className="h-1/2 p-4 bg-background overflow-y-auto">
                  <div className="mobile-card">
                    {rideShareMode === 'driver' && canDrive() ? (
                      <DriverDashboard />
                    ) : (
                      <PassengerDashboard />
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
      <nav className="mobile-bottom-nav mobile-safe-bottom">
        <div className="flex justify-around items-center py-2">
          <button className="flex flex-col items-center space-y-1 p-2 rounded-xl active:scale-95 transition-mobile">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium text-primary">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 rounded-xl active:scale-95 transition-mobile">
            <Star className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Favorites</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 rounded-xl active:scale-95 transition-mobile">
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 rounded-xl active:scale-95 transition-mobile">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}