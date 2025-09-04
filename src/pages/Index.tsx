import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { Fuel, Car, MapPin } from "lucide-react";
import type { Station, FuelStatus } from "@/components/StationCard";

export default function Index() {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const [mode, setMode] = useState<'fuel' | 'rideshare'>('fuel');
  const [rideShareMode, setRideShareMode] = useState<'passenger' | 'driver'>('passenger');
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: [] as FuelStatus[],
    distance: 50,
    priceRange: [0, 100] as [number, number],
    amenities: [] as string[],
  });

  const filteredStations = stations.filter(station => {
    if (filters.status.length > 0 && !filters.status.includes(station.status)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (mode === 'fuel') {
      loadMockStations();
    }
  }, [mode]);

  const loadMockStations = () => {
    const mockStations: Station[] = [
      {
        id: "1",
        name: "Shell Gas Station",
        address: "123 Main St, New York, NY",
        lat: 40.7128,
        lng: -74.0060,
        status: "available",
      },
      {
        id: "2", 
        name: "BP Fuel Center",
        address: "456 Broadway, New York, NY",
        lat: 40.7589,
        lng: -73.9851,
        status: "low",
      }
    ];
    setStations(mockStations);
  };

  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
  };

  const handleLocationSelect = (location: { lat: number; lng: number; label?: string }) => {
    setSelectedLocation(location);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const toggleFavorite = (stationId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(stationId)) {
      newFavorites.delete(stationId);
    } else {
      newFavorites.add(stationId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-hero text-primary-foreground relative overflow-hidden">
      <Toaster />
      
      <section className="relative z-10">
        <div className="px-4 py-8 mx-auto max-w-7xl">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-2">
                {mode === 'fuel' ? 'FuelFinder' : 'RideShare'}
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                {mode === 'fuel' 
                  ? 'Find fuel stations with real-time availability'
                  : 'Connect drivers and passengers for eco-friendly rides'
                }
              </p>
            </div>
            <nav className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ManagerLogin />
                  <Button 
                    variant="secondary" 
                    onClick={() => window.location.href = '/auth'}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </nav>
          </header>

          <div className="mb-8 flex justify-center">
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'fuel' | 'rideshare')} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border-white/20">
                <TabsTrigger value="fuel" className="flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Find Fuel
                </TabsTrigger>
                <TabsTrigger value="rideshare" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Ride Share
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {mode === 'fuel' && (
            <div className="max-w-2xl mb-8">
              <div className="mb-4">
                <EnhancedLocationSearch onSelectLocation={handleLocationSelect} />
              </div>
            </div>
          )}

          {mode === 'rideshare' && user && (
            <div className="mb-8 flex justify-center">
              <Tabs value={rideShareMode} onValueChange={(value) => setRideShareMode(value as 'passenger' | 'driver')} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border-white/20">
                  <TabsTrigger value="passenger">
                    <MapPin className="h-4 w-4 mr-2" />
                    Need a Ride
                  </TabsTrigger>
                  <TabsTrigger value="driver">
                    <Car className="h-4 w-4 mr-2" />
                    Be a Driver
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      </section>

      <main className="relative z-10 bg-background text-foreground min-h-[60vh] rounded-t-[2rem] -mt-4">
        <div className="px-4 py-8 mx-auto max-w-7xl">
          {mode === 'fuel' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LeafletMap
                  stations={filteredStations}
                  onSelect={handleStationSelect}
                  focusPoint={selectedLocation}
                  className="h-[50vh] md:h-[60vh] lg:h-[70vh]"
                />
              </div>
              <div className="space-y-4">
                <StationList
                  stations={filteredStations}
                  origin={selectedLocation}
                  selectedId={selectedStation?.id}
                  onSelect={handleStationSelect}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            </div>
          ) : (
            !user ? (
              <div className="text-center py-12">
                <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-4">Sign In to Use Ride Share</h2>
                <p className="text-muted-foreground mb-6">
                  Create an account to request rides or become a driver
                </p>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign In / Sign Up
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RideShareMap
                    focusPoint={selectedLocation}
                    className="h-[50vh] md:h-[60vh] lg:h-[70vh]"
                  />
                </div>
                <div className="space-y-4">
                  {rideShareMode === 'driver' ? (
                    <DriverDashboard />
                  ) : (
                    <PassengerDashboard />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {isMobile && <BottomBar />}
    </div>
  );
}
