import { useState } from 'react';
import { Button } from '@/components/ui/button';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import PinDropMap from './PinDropMap';
import { MapPin, Search } from 'lucide-react';

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  onLocationSelect: (loc: PickedLocation) => void;
  pinLabel?: string;
}

/**
 * Address search with a fallback "drop a precise pin" mode for the parts of
 * Lusaka that OpenStreetMap has not mapped in detail yet.
 */
export default function LocationPicker({ onLocationSelect, pinLabel }: LocationPickerProps) {
  const [mode, setMode] = useState<'search' | 'pin'>('search');
  const [picked, setPicked] = useState<PickedLocation | null>(null);

  const handlePin = (point: { lat: number; lng: number }) => {
    const loc = {
      ...point,
      address: `Dropped pin (${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`,
    };
    setPicked(loc);
    onLocationSelect(loc);
  };

  const handleSearch = (loc: { lat: number; lng: number; label?: string; address?: string }) => {
    const picked = {
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address ?? loc.label ?? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`,
    };
    setPicked(picked);
    onLocationSelect(picked);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'search' ? 'default' : 'outline'}
          onClick={() => setMode('search')}
        >
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'pin' ? 'default' : 'outline'}
          onClick={() => setMode('pin')}
        >
          <MapPin className="h-4 w-4 mr-1" />
          Drop precise pin
        </Button>
      </div>

      {mode === 'search' ? (
        <EnhancedLocationSearch onLocationSelect={handleSearch} />
      ) : (
        <PinDropMap onConfirm={handlePin} label={pinLabel} />
      )}

      {picked && <p className="text-xs text-muted-foreground">Selected: {picked.address}</p>}
    </div>
  );
}
