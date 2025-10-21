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
import StationDetails from "@/components/StationDetails";
import AdminPanel from "@/components/admin/AdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useStations";
import { useProfile } from "@/hooks/useProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRoles } from "@/hooks/useRoles";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Crown,
  X,
  Bell,
  BellOff
} from "lucide-react";
import type { Station } from "@/hooks/useStations";

export default function Index() {
  const { user, signOut } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { profile, toggleFavoriteStation, isFavorite } = useProfile();
  const { position, requestLocation, getLocationOrDefault } = useGeolocation();
  const { roles, hasRole, canManageStations, canDrive, canRequestRides } = useRoles();
  const { hasPermission, requestNotificationPermission } = useNotifications();
  
  const [mode, setMode] = useState<'fuel' | 'rideshare' | 'admin'>('fuel');
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  };

  const handleStationReported = () => {
    // The real-time subscription will automatically refetch stations
    setSelectedStation(null);
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-10 h-10 rounded-xl"
                  onClick={requestNotificationPermission}
                  title={hasPermission ? "Notifications enabled" : "Enable notifications"}
                >
                  {hasPermission ? (
                    <Bell className="h-4 w-4 text-success" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
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
                  className="h-full"
                />
              )}
            </div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md sticky top-0 z-20 border-b border-border/50">
              <div>
                <h2 className="font-semibold text-base">Nearby Stations</h2>
                <p className="text-xs text-muted-foreground">From your chosen point</p>
              </div>
              <div className="flex gap-2">
                {canManageStations() && <AddStationDialog onStationAdded={handleStationReported} />}
                <Button size="sm" variant="outline" onClick={() => setShowFilters(true)} className="h-9 px-3">
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="text-xs">Filter</span>
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
            <div className="fixed bottom-20 left-4 right-4 z-30 pointer-events-none">
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
              <div className="fixed bottom-36 left-4 right-4 z-40 animate-slide-up">
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
          </div>
        ) : mode === 'admin' && hasRole('admin') ? (
          <div className="pb-24">
            <AdminPanel />
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