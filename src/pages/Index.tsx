import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import LeafletMap from "@/components/map/LeafletMap";
import RideShareMap from "@/components/rideshare/RideShareMap";
import StationList from "@/components/StationList";
import EnhancedLocationSearch from "@/components/map/EnhancedLocationSearch";
import ManagerLogin from "@/components/ManagerLogin";
import ThemeToggle from "@/components/ThemeToggle";
import DriverDashboard from "@/components/rideshare/DriverDashboard";
import PassengerDashboard from "@/components/rideshare/PassengerDashboard";
import BottomBar from "@/components/mobile/BottomBar";
import ProfileDialog from "@/components/ProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useStations } from "@/hooks/useStations";
import { useProfile } from "@/hooks/useProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
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
  LocateFixed
} from "lucide-react";
import type { Station } from "@/hooks/useStations";

export default function Index() {
  const { user, signOut } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { profile, toggleFavoriteStation, isFavorite } = useProfile();
  const { position, requestLocation, getLocationOrDefault } = useGeolocation();
  
  const [mode, setMode] = useState<'fuel' | 'rideshare'>('fuel');
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');

  // Initialize with default location (Lusaka)
  useEffect(() => {
    if (!selectedLocation) {
      setSelectedLocation(getLocationOrDefault());
    }
  }, [getLocationOrDefault, selectedLocation]);

  const filteredStations = stations.filter(station => {
    return true; // Simplified for mobile experience - could add filters later
  });

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setActiveTab('map');
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
                {selectedLocation?.label || 'Current Location'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
        {mode === 'rideshare' && user && (
          <div className="mt-3 flex bg-secondary rounded-2xl p-1">
            <button
              onClick={() => setRideShareMode('passenger')}
              className={`mobile-tab ${rideShareMode === 'passenger' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Need Ride
            </button>
            <button
              onClick={() => setRideShareMode('driver')}
              className={`mobile-tab ${rideShareMode === 'driver' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Drive
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {mode === 'fuel' ? (
          <>
            {stationsLoading ? (
              <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Loading stations...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Map/List Toggle */}
                <div className="absolute top-4 left-4 right-4 z-30 flex bg-background/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-border/30">
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`mobile-tab ${activeTab === 'map' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Map
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`mobile-tab ${activeTab === 'list' ? 'mobile-tab-active' : 'mobile-tab-inactive'}`}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    List
                  </button>
                </div>

                {/* Map View */}
                {activeTab === 'map' && (
                  <div className="h-[calc(100vh-200px)]">
                    <LeafletMap
                      stations={filteredStations}
                      onSelect={handleStationSelect}
                      focusPoint={selectedLocation}
                      className="h-full w-full"
                    />
                  </div>
                )}

                {/* List View */}
                {activeTab === 'list' && (
                  <div className="p-4 pt-20 h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Nearby Stations</h2>
                        <Button size="sm" variant="outline" className="h-9 px-3 rounded-xl">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                      <StationList
                        stations={filteredStations}
                        origin={selectedLocation}
                        selectedId={selectedStation?.id}
                        onSelect={handleStationSelect}
                        favorites={new Set(profile?.preferences?.favorite_stations || [])}
                        onToggleFavorite={toggleFavoriteStation}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="absolute bottom-4 left-4 right-4 z-30">
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
              </>
            )}
          </>
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
                    {rideShareMode === 'driver' ? (
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