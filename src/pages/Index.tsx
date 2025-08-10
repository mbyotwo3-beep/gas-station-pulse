import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import LeafletMap from '@/components/map/LeafletMap';
import StationCard, { Station } from '@/components/StationCard';
import LocationSearch from '@/components/map/LocationSearch';
import { Button } from '@/components/ui/button';
import BottomBar from '@/components/mobile/BottomBar';
const sampleStations: Station[] = [
  { id: '1', name: 'Green Valley Fuel', address: '101 Main St, Denver, CO', lat: 39.7392, lng: -104.9903, status: 'available' },
  { id: '2', name: 'Sunset Gas', address: '55 Ocean Ave, Santa Monica, CA', lat: 34.0195, lng: -118.4912, status: 'low' },
  { id: '3', name: 'Desert Stop', address: 'Route 66, Flagstaff, AZ', lat: 35.1983, lng: -111.6513, status: 'out' },
];

const Index = () => {
  const [selected, setSelected] = useState<Station | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; label?: string } | null>(null);

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
          <div className="absolute inset-x-4 top-4 z-40">
            <LocationSearch onSelectLocation={(loc) => setFocusPoint(loc)} />
          </div>
          <LeafletMap className="h-[calc(100dvh-120px)] md:h-[60vh]" stations={sampleStations} onSelect={setSelected} focusPoint={focusPoint} />
          {selected ? (
            <div className="fixed inset-x-4 bottom-[calc(64px+16px)] z-40 md:static md:inset-auto md:bottom-auto md:mt-6">
              <StationCard station={selected} />
            </div>
          ) : (
            <div className="hidden md:block mt-6">
              <StationCard station={selected} />
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
