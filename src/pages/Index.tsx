import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import LeafletMap from '@/components/map/LeafletMap';
import StationCard, { Station } from '@/components/StationCard';
import LocationSearch from '@/components/map/LocationSearch';
import { Button } from '@/components/ui/button';
import BottomBar from '@/components/mobile/BottomBar';
import { toast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Fuel, PlugZap } from 'lucide-react';

const Index = () => {
  const [selected, setSelected] = useState<Station | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>(['fuel', 'ev']);

  // Set initial location to Lusaka, Zambia after mount so the map centers correctly
  useEffect(() => {
    setFocusPoint({ lat: -15.3875, lng: 28.3228, label: 'Lusaka, Zambia' });
  }, []);

  // Fetch nearby fuel and EV charging stations from OpenStreetMap when location changes
  useEffect(() => {
    if (!focusPoint) return;
    setSelected(null);
    const controller = new AbortController();

    const fetchStations = async () => {
      const radius = 8000; // meters
      const wantFuel = typeFilters.includes('fuel');
      const wantEV = typeFilters.includes('ev');
      if (!wantFuel && !wantEV) {
        setStations([]);
        return;
      }
      const parts: string[] = [];
      const base = (amenity: string) => `
  node["amenity"="${amenity}"](around:${radius},${focusPoint.lat},${focusPoint.lng});
  way["amenity"="${amenity}"](around:${radius},${focusPoint.lat},${focusPoint.lng});`;
      if (wantFuel) parts.push(base('fuel'));
      if (wantEV) parts.push(base('charging_station'));
      const query = `[out:json][timeout:25];\n(\n${parts.join('\n')}\n);\nout center tags;`;

      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: query,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Overpass error');
        const data = await res.json();
        const elements = Array.isArray(data?.elements) ? data.elements : [];
        const mapped: Station[] = elements
          .map((el: any) => {
            const lat = el.lat ?? el.center?.lat;
            const lng = el.lon ?? el.center?.lon;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;

            const amenity = el.tags?.amenity;
            const isEV = amenity === 'charging_station';
            const name =
              el.tags?.name ||
              (isEV ? 'Charging Station' : 'Fuel Station');
            const label = isEV ? `${name} (EV)` : name;

            const street = el.tags?.['addr:street'] ?? '';
            const housenumber = el.tags?.['addr:housenumber'] ?? '';
            const city = el.tags?.['addr:city'] ?? '';
            const addr = [street && `${street} ${housenumber}`.trim(), city].filter(Boolean).join(', ');

            return {
              id: `${el.type}-${el.id}`,
              name: label,
              address: addr || (isEV ? 'EV charging location' : 'Fuel station'),
              lat,
              lng,
              status: 'available' as const,
            } satisfies Station;
          })
          .filter(Boolean);
        setStations(mapped);
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          toast({ title: 'Could not load nearby stations', description: 'Please try again in a moment.' });
        }
      }
    };

    fetchStations();
    return () => controller.abort();
  }, [focusPoint, typeFilters]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b h-14">
        <div className="container h-full flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-lg">FuelFinder</Link>
          <h1 className="sr-only md:hidden">FuelFinder – Real-Time Fuel Availability</h1>
          <div className="hidden md:flex items-center gap-2">
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
              <Button variant="hero">Open Map</Button>
              <Button variant="outline">How it works</Button>
            </div>
          </div>
        </section>

        <section className="container p-0 md:py-10 relative">
          <div className="absolute inset-x-4 top-4 md:top-6 z-[1000]">
            <div className="space-y-2">
              <LocationSearch onSelectLocation={(loc) => setFocusPoint(loc)} />
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
          <LeafletMap className="h-[calc(100dvh-120px)] md:h-[60vh]" stations={stations} onSelect={setSelected} focusPoint={focusPoint} />
          {selected ? (
            <div className="fixed inset-x-4 bottom-[calc(64px+16px)] z-[1000] md:static md:inset-auto md:bottom-auto md:mt-6">
              <StationCard station={selected} userLocation={focusPoint ? { lat: focusPoint.lat, lng: focusPoint.lng } : undefined} />
            </div>
          ) : (
            <div className="hidden md:block mt-6">
              <StationCard station={selected} userLocation={focusPoint ? { lat: focusPoint.lat, lng: focusPoint.lng } : undefined} />
            </div>
          )}
        </section>
      </main>
      <BottomBar />
 
      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FuelFinder. Open-source.</div>
      </footer>
    </div>
  );
};

export default Index;
