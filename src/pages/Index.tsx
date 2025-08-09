import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import LeafletMap from '@/components/map/LeafletMap';
import StationCard, { Station } from '@/components/StationCard';
import ManagerLogin from '@/components/ManagerLogin';
import { Button } from '@/components/ui/button';

const sampleStations: Station[] = [
  { id: '1', name: 'Green Valley Fuel', address: '101 Main St, Denver, CO', lat: 39.7392, lng: -104.9903, status: 'available' },
  { id: '2', name: 'Sunset Gas', address: '55 Ocean Ave, Santa Monica, CA', lat: 34.0195, lng: -118.4912, status: 'low' },
  { id: '3', name: 'Desert Stop', address: 'Route 66, Flagstaff, AZ', lat: 35.1983, lng: -111.6513, status: 'out' },
];

const Index = () => {
  const [selected, setSelected] = useState<Station | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <a href="#" className="font-semibold tracking-tight text-lg">FuelFinder</a>
          <div className="flex items-center gap-2">
            <Button asChild variant="link"><a href="#about">About</a></Button>
            <ManagerLogin />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-hero">
          <div className="container py-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">FuelFinder – Real-Time Fuel Availability</h1>
            <p className="text-muted-foreground max-w-2xl">Find nearby stations with up-to-the-minute fuel status. Station managers update instantly so you never waste a trip.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="hero">Open Map</Button>
              <Button variant="outline">How it works</Button>
            </div>
          </div>
        </section>

        <section className="container py-10">
          <LeafletMap stations={sampleStations} onSelect={setSelected} />
          <div className="mt-6">
            <StationCard station={selected} />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground">&copy; {new Date().getFullYear()} FuelFinder. Open-source.</div>
      </footer>
    </div>
  );
};

export default Index;
