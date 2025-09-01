import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import LeafletMap from "@/components/map/LeafletMap";
import RideShareMap from "@/components/rideshare/RideShareMap";
import StationList from "@/components/StationList";
import EnhancedLocationSearch from "@/components/map/EnhancedLocationSearch";
import AdvancedFilters from "@/components/AdvancedFilters";
import ManagerLogin from "@/components/ManagerLogin";
import ThemeToggle from "@/components/ThemeToggle";
import DriverDashboard from "@/components/rideshare/DriverDashboard";
import PassengerDashboard from "@/components/rideshare/PassengerDashboard";
import { BottomBar } from "@/components/mobile/BottomBar";
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
              <AdvancedFilters 
                onFiltersChange={handleFiltersChange}
                className="bg-white/10 backdrop-blur-sm border-white/20"
              />
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
  const { user, signOut } = useAuth();
  const { requestNotificationPermission } = useNotifications();
  const [selected, setSelected] = useState<Station | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>(['fuel', 'ev']);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    status: FuelStatus[];
    maxDistance: number;
    priceRange: [number, number];
    amenities: string[];
    brands: string[];
    operatingHours: 'any' | '24h' | 'open_now';
    sortBy: 'distance' | 'price' | 'rating' | 'updated';
  }>({
    status: ['available', 'low'],
    maxDistance: 10,
    priceRange: [0, 200],
    amenities: [],
    brands: [],
    operatingHours: 'any',
    sortBy: 'distance'
  });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('ff_favorites') || '[]')); } catch { return new Set(); }
  });

  // Touch gestures for mobile
  useTouchGestures(mapContainerRef, {
    onSwipeUp: () => setListOpen(true),
    onSwipeDown: () => setListOpen(false),
    onSwipeLeft: () => {
      if (selected) {
        const currentIndex = stations.findIndex(s => s.id === selected.id);
        const nextStation = stations[currentIndex + 1];
        if (nextStation) {
          setSelected(nextStation);
          setFocusPoint({ lat: nextStation.lat, lng: nextStation.lng, label: nextStation.name });
        }
      }
    },
    onSwipeRight: () => {
      if (selected) {
        const currentIndex = stations.findIndex(s => s.id === selected.id);
        const prevStation = stations[currentIndex - 1];
        if (prevStation) {
          setSelected(prevStation);
          setFocusPoint({ lat: prevStation.lat, lng: prevStation.lng, label: prevStation.name });
        }
      }
    }
  });

  useEffect(() => {
    localStorage.setItem('ff_favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  // Apply filters to stations
  useEffect(() => {
    let filtered = [...stations];

    // Filter by status
    if (filterOptions.status.length > 0) {
      filtered = filtered.filter(station => filterOptions.status.includes(station.status));
    }

    // Filter by distance
    if (userLocation && filterOptions.maxDistance > 0) {
      filtered = filtered.filter(station => {
        const distance = haversineKm(userLocation, { lat: station.lat, lng: station.lng });
        return distance <= filterOptions.maxDistance;
      });
    }

    // Sort stations
    if (userLocation && filterOptions.sortBy === 'distance') {
      filtered.sort((a, b) => {
        const distA = haversineKm(userLocation, { lat: a.lat, lng: a.lng });
        const distB = haversineKm(userLocation, { lat: b.lat, lng: b.lng });
        return distA - distB;
      });
    } else if (filterOptions.sortBy === 'updated') {
      filtered.sort((a, b) => {
        const timeA = (a as any).lastUpdated ? new Date((a as any).lastUpdated).getTime() : 0;
        const timeB = (b as any).lastUpdated ? new Date((b as any).lastUpdated).getTime() : 0;
        return timeB - timeA;
      });
    }

    setFilteredStations(filtered);
  }, [stations, filterOptions, userLocation]);

  const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  const toggleFavorite = (id: string) => setFavorites((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Enable notifications for signed-in users
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        requestNotificationPermission();
      }, 2000); // Show after 2 seconds to not be intrusive
      return () => clearTimeout(timer);
    }
  }, [user, requestNotificationPermission]);

  // Set initial location to Lusaka, Zambia after mount so the map centers correctly
  useEffect(() => {
    setFocusPoint({ lat: -15.3875, lng: 28.3228, label: 'Lusaka, Zambia' });
  }, []);

  // Fetch nearby fuel and EV charging stations from OpenStreetMap and merge with real-time reports
  useEffect(() => {
    if (!focusPoint) return;
    setSelected(null);
    const controller = new AbortController();

    const fetchStationsWithReports = async () => {
      const radius = 8000; // meters
      const wantFuel = typeFilters.includes('fuel');
      const wantEV = typeFilters.includes('ev');
      if (!wantFuel && !wantEV) {
        setStations([]);
        return;
      }

      try {
        // Fetch from OpenStreetMap
        const parts: string[] = [];
        const base = (amenity: string) => `
  node["amenity"="${amenity}"](around:${radius},${focusPoint.lat},${focusPoint.lng});
  way["amenity"="${amenity}"](around:${radius},${focusPoint.lat},${focusPoint.lng});`;
        if (wantFuel) parts.push(base('fuel'));
        if (wantEV) parts.push(base('charging_station'));
        const query = `[out:json][timeout:25];\n(\n${parts.join('\n')}\n);\nout center tags;`;

        const [osmResponse, reportsResponse] = await Promise.all([
          fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: query,
            signal: controller.signal,
          }),
          // Fetch recent station reports (last 24 hours)
          supabase
            .from('station_reports')
            .select('station_id, station_name, status, note, created_at')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
        ]);

        if (!osmResponse.ok) throw new Error('Overpass error');
        
        const osmData = await osmResponse.json();
        const elements = Array.isArray(osmData?.elements) ? osmData.elements : [];
        
        // Create a map of latest reports by station
        const latestReports = new Map();
        if (reportsResponse.data) {
          reportsResponse.data.forEach(report => {
            if (!latestReports.has(report.station_id)) {
              latestReports.set(report.station_id, report);
            }
          });
        }

        const mapped: Station[] = elements
          .map((el: any) => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            const amenity = el.tags?.amenity;
            const isEV = amenity === 'charging_station';
            const stationId = `${el.type}-${el.id}`;
            
            // Check for manager reports for this station
            const report = latestReports.get(stationId) || latestReports.get(el.tags?.name);
            
            const name = report?.station_name || el.tags?.name || (isEV ? 'Charging Station' : 'Fuel Station');
            const label = isEV ? `${name} (EV)` : name;

            const street = el.tags?.['addr:street'] ?? '';
            const housenumber = el.tags?.['addr:housenumber'] ?? '';
            const city = el.tags?.['addr:city'] ?? '';
            const addr = [street && `${street} ${housenumber}`.trim(), city].filter(Boolean).join(', ');

            return {
              id: stationId,
              name: label,
              address: addr || (isEV ? 'EV charging location' : 'Fuel station'),
              lat,
              lng,
              status: report?.status || 'available',
              note: report?.note || undefined,
              lastUpdated: report?.created_at || undefined,
            } satisfies Station & { note?: string; lastUpdated?: string };
          })
          .filter(Boolean);
          
        setStations(mapped);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          toast({ title: 'Could not load nearby stations', description: 'Please try again in a moment.' });
        }
      }
    };

    fetchStationsWithReports();
    return () => controller.abort();
  }, [focusPoint, typeFilters]);

  // Listen for real-time station report updates
  useEffect(() => {
    const channel = supabase
      .channel('station-reports-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'station_reports'
        },
        (payload) => {
          const newReport = payload.new as any;
          // Update existing stations with new status
          setStations(prev => prev.map(station => {
            if (station.id === newReport.station_id || station.name.includes(newReport.station_name)) {
              return {
                ...station,
                status: newReport.status,
                note: newReport.note,
                lastUpdated: newReport.created_at
              };
            }
            return station;
          }));
          
          toast({ 
            title: "Station updated", 
            description: `${newReport.station_name} status changed to ${newReport.status}` 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', description: 'Your browser does not support location access.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setFocusPoint({ ...coords, label: 'Your location' });
        toast({ title: 'Location set', description: 'Using your current location.' });
      },
      () => {
        toast({ title: 'Permission denied', description: 'We could not access your location.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-14">
        <div className="container h-full flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-lg">FuelFinder</Link>
          <h1 className="sr-only md:hidden">FuelFinder – Real-Time Fuel Availability</h1>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">
                  <User className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-hero hidden md:block">
          <div className="container py-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">FuelFinder – Real-Time Fuel Availability</h1>
            <p className="text-muted-foreground max-w-2xl">Find nearby stations with up-to-the-minute fuel status. Station managers update instantly so you never waste a trip.</p>
            <div className="mt-6 flex gap-3">
              {user ? (
                <Button variant="hero" onClick={() => {
                  const searchInput = document.querySelector('input[placeholder="Search for places..."]') as HTMLInputElement;
                  searchInput?.focus();
                }}>
                  Find Stations
                </Button>
              ) : (
                <Button asChild variant="hero">
                  <Link to="/auth">Sign In to Save Favorites</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/manager">Manager Login</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container p-0 md:py-10 relative" ref={mapContainerRef}>
          <div className="absolute inset-x-4 top-4 md:top-6 z-[1000]">
            <div className="space-y-2">
              <EnhancedLocationSearch onSelectLocation={(loc) => setFocusPoint(loc)} />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={handleUseMyLocation} aria-label="Use my current location">
                  <LocateFixed className="h-4 w-4 mr-1" /> Use my location
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setListOpen((v) => !v)} aria-label="Toggle stations list">
                  <List className="h-4 w-4 mr-1" /> {listOpen ? 'Hide list' : 'Show list'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowFilters(true)} aria-label="Open filters">
                  <Filter className="h-4 w-4 mr-1" /> Filters
                </Button>
                {user && (
                  <Button size="sm" variant="secondary" onClick={requestNotificationPermission} aria-label="Enable notifications">
                    <Bell className="h-4 w-4 mr-1" /> Alerts
                  </Button>
                )}
              </div>
              <div className="rounded-full bg-background/90 backdrop-blur border shadow-md w-fit px-2 py-1">
                <ToggleGroup
                  type="multiple"
                  value={typeFilters}
                  onValueChange={(v) => setTypeFilters(v.length ? v : ['fuel', 'ev'])}
                  className="gap-1"
                >
                  <ToggleGroupItem value="fuel" aria-label="Show fuel stations" className="px-3 py-1 rounded-full">
                    <span className="inline-flex items-center gap-1"><Fuel className="h-4 w-4" /> <span className="hidden sm:inline">Fuel</span></span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="ev" aria-label="Show EV charging stations" className="px-3 py-1 rounded-full">
                    <span className="inline-flex items-center gap-1"><PlugZap className="h-4 w-4" /> <span className="hidden sm:inline">EV</span></span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
          <LeafletMap className="h-[calc(100dvh-120px)] md:h-[60vh]" stations={filteredStations} onSelect={setSelected} focusPoint={focusPoint} />
          {listOpen && (
            <div className="mt-4">
              <StationList
                stations={filteredStations}
                origin={userLocation ?? (focusPoint ? { lat: focusPoint.lat, lng: focusPoint.lng } : undefined)}
                selectedId={selected?.id ?? null}
                onSelect={(s) => {
                  setSelected(s);
                  setFocusPoint({ lat: s.lat, lng: s.lng, label: s.name });
                }}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          )}
          {selected ? (
            <div className="fixed inset-x-4 bottom-[calc(64px+16px)] z-[1000] md:static md:inset-auto md:bottom-auto md:mt-6">
              <StationCard
                station={selected}
                userLocation={userLocation ?? (focusPoint ? { lat: focusPoint.lat, lng: focusPoint.lng } : undefined)}
                isFavorite={selected ? favorites.has(selected.id) : false}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          ) : (
            <div className="hidden md:block mt-6">
              <StationCard
                station={selected}
                userLocation={userLocation ?? (focusPoint ? { lat: focusPoint.lat, lng: focusPoint.lng } : undefined)}
                isFavorite={false}
                onToggleFavorite={undefined}
              />
            </div>
          )}
        </section>
      </main>
      
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filterOptions}
        onFiltersChange={(filters) => setFilterOptions(filters)}
        onApplyFilters={() => {}}
        onClearFilters={() => setFilterOptions({
          status: ['available', 'low'] as FuelStatus[],
          maxDistance: 10,
          priceRange: [0, 200],
          amenities: [],
          brands: [],
          operatingHours: 'any',
          sortBy: 'distance'
        })}
      />
      
      <BottomBar />
 
      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FuelFinder. Open-source.</div>
      </footer>
    </div>
  );
};

export default Index;
