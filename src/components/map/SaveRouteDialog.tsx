import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import type { Waypoint } from './WaypointsManager';

interface SaveRouteDialogProps {
  startLocation: { lat: number; lng: number; label?: string } | null;
  endLocation: { lat: number; lng: number; label?: string } | null;
  waypoints: Waypoint[];
  onSave: (name: string) => Promise<boolean>;
  disabled?: boolean;
}

export default function SaveRouteDialog({
  startLocation,
  endLocation,
  waypoints,
  onSave,
  disabled = false
}: SaveRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!routeName.trim()) {
      return;
    }

    setSaving(true);
    const success = await onSave(routeName.trim());
    setSaving(false);

    if (success) {
      setRouteName('');
      setOpen(false);
    }
  };

  const canSave = startLocation && endLocation && !disabled;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={!canSave}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Route
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Route</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="route-name">Route Name</Label>
            <Input
              id="route-name"
              placeholder="e.g., Home to Work"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[60px]">From:</span>
              <span>{startLocation?.label || 'Current location'}</span>
            </div>
            {waypoints.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-[60px]">Stops:</span>
                <span>{waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-[60px]">To:</span>
              <span>{endLocation?.label || 'Destination'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!routeName.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save Route'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
