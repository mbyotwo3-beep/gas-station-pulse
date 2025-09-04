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
import { Fuel, Car, MapPin, Search, Users, Zap, Shield, Star, ArrowRight } from "lucide-react";
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

  const toggleFavorite = (stationId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(stationId)) {
      newFavorites.delete(stationId);
    } else {
      newFavorites.add(stationId);
    }
    setFavorites(newFavorites);
  };

  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description: "Find nearby stations with real-time availability"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Real updates from our verified community"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance"
    },
    {
      icon: Shield,
      title: "Trusted & Secure",
      description: "Your data is protected with enterprise-grade security"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle relative overflow-hidden">
      <Toaster />
      
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iNyIgY3k9IjciIHI9IjciLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
        
        <div className="relative z-10 container-custom py-12 lg:py-20">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-12 lg:mb-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Fuel className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">
                {mode === 'fuel' ? 'FuelFinder' : 'RideShare'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {user ? (
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={signOut}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <ManagerLogin />
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/auth'}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center space-y-8 mb-12">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight">
                {mode === 'fuel' ? (
                  <>
                    Find Fuel <span className="text-gradient">Instantly</span>
                  </>
                ) : (
                  <>
                    Share the <span className="text-gradient">Journey</span>
                  </>
                )}
              </h1>
              <p className="text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                {mode === 'fuel' 
                  ? 'Discover nearby fuel stations with real-time availability, community-driven updates, and smart routing.'
                  : 'Connect with drivers and passengers for safe, convenient, and eco-friendly ride sharing experiences.'
                }
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <Tabs 
                value={mode} 
                onValueChange={(value) => setMode(value as 'fuel' | 'rideshare')} 
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                  <TabsTrigger 
                    value="fuel" 
                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-primary rounded-lg transition-all"
                  >
                    <Fuel className="h-4 w-4" />
                    <span>Find Fuel</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rideshare" 
                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-primary rounded-lg transition-all"
                  >
                    <Car className="h-4 w-4" />
                    <span>Ride Share</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search Section */}
            {mode === 'fuel' && (
              <div className="max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <EnhancedLocationSearch onSelectLocation={handleLocationSelect} />
                </div>
              </div>
            )}

            {/* Rideshare Mode Toggle */}
            {mode === 'rideshare' && user && (
              <div className="flex justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Tabs 
                  value={rideShareMode} 
                  onValueChange={(value) => setRideShareMode(value as 'passenger' | 'driver')} 
                  className="w-full max-w-md"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 p-1">
                    <TabsTrigger 
                      value="passenger"
                      className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-primary rounded-lg"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Need a Ride</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="driver"
                      className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-primary rounded-lg"
                    >
                      <Car className="h-4 w-4" />
                      <span>Be a Driver</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover-lift text-center"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 bg-background rounded-t-3xl -mt-6 min-h-[60vh] shadow-2xl">
        <div className="container-custom py-12">
          {mode === 'fuel' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="card-modern p-2 h-[60vh] lg:h-[70vh]">
                  <LeafletMap
                    stations={filteredStations}
                    onSelect={handleStationSelect}
                    focusPoint={selectedLocation}
                    className="h-full w-full rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="card-modern p-6">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-primary" />
                    Nearby Stations
                  </h2>
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
            </div>
          ) : (
            !user ? (
              <div className="text-center py-24">
                <div className="card-modern p-12 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Car className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Create an account to request rides, become a driver, and connect with your community.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = '/auth'}
                    className="w-full btn-primary group"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="card-modern p-2 h-[60vh] lg:h-[70vh]">
                    <RideShareMap
                      focusPoint={selectedLocation}
                      className="h-full w-full rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="card-modern p-6">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      {rideShareMode === 'driver' ? 'Driver Dashboard' : 'Find a Ride'}
                    </h2>
                    {rideShareMode === 'driver' ? (
                      <DriverDashboard />
                    ) : (
                      <PassengerDashboard />
                    )}
                  </div>
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