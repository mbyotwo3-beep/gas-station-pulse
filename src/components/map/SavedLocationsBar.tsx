import { useState } from 'react';
import { Home, Briefcase, MapPin, Plus, X, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSavedLocations, type SavedLocation } from '@/hooks/useSavedLocations';
import { useAuth } from '@/contexts/AuthContext';

interface SavedLocationsBarProps {
  currentLocation: { lat: number; lng: number; label?: string } | null;
  onSelectLocation: (location: { lat: number; lng: number; label: string }) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  home: Home,
  work: Briefcase,
  star: Star,
  pin: MapPin,
};

const ICON_OPTIONS = [
  { value: 'home', label: 'Home', Icon: Home },
  { value: 'work', label: 'Work', Icon: Briefcase },
  { value: 'star', label: 'Favorite', Icon: Star },
  { value: 'pin', label: 'Other', Icon: MapPin },
];

export default function SavedLocationsBar({ currentLocation, onSelectLocation }: SavedLocationsBarProps) {
  const { user } = useAuth();
  const { locations, loading, saveLocation, deleteLocation } = useSavedLocations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('home');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveCurrent = async () => {
    if (!currentLocation || !newLabel.trim()) return;
    setSaving(true);
    const success = await saveLocation(
      newLabel.trim(),
      newIcon,
      currentLocation.lat,
      currentLocation.lng,
      currentLocation.label
    );
    setSaving(false);
    if (success) {
      setDialogOpen(false);
      setNewLabel('');
      setNewIcon('home');
    }
  };

  const handleSelect = (loc: SavedLocation) => {
    onSelectLocation({ lat: loc.lat, lng: loc.lng, label: `${loc.label}${loc.address ? ` — ${loc.address}` : ''}` });
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide">
      {locations.map((loc) => {
        const IconComp = ICON_MAP[loc.icon] || MapPin;
        return (
          <div key={loc.id} className="group relative flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5 rounded-full border-border/60 hover:bg-accent"
              onClick={() => handleSelect(loc)}
            >
              <IconComp className="h-3 w-3" />
              {loc.label}
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
              className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1 rounded-full border-dashed border-border/60 text-muted-foreground hover:text-foreground"
            disabled={!currentLocation}
            title={currentLocation ? 'Save current location' : 'Set a location first'}
          >
            <Plus className="h-3 w-3" />
            Save
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Current location</Label>
              <p className="text-sm mt-0.5">
                {currentLocation?.label || `${currentLocation?.lat.toFixed(4)}, ${currentLocation?.lng.toFixed(4)}`}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-label">Name</Label>
              <Input
                id="loc-label"
                placeholder="e.g. Home, Office, Gym..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex gap-2">
                {ICON_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setNewIcon(value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      newIcon === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveCurrent}
              disabled={!newLabel.trim() || saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
