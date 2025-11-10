import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Plus, X, GripVertical, Navigation } from 'lucide-react';
import { useState } from 'react';

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface WaypointsManagerProps {
  waypoints: Waypoint[];
  onAddWaypoint: (waypoint: Omit<Waypoint, 'id'>) => void;
  onRemoveWaypoint: (id: string) => void;
  onReorderWaypoints: (waypoints: Waypoint[]) => void;
  onSelectLocation: () => void;
  maxWaypoints?: number;
}

export default function WaypointsManager({
  waypoints,
  onAddWaypoint,
  onRemoveWaypoint,
  onReorderWaypoints,
  onSelectLocation,
  maxWaypoints = 5
}: WaypointsManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWaypoints = [...waypoints];
    const draggedItem = newWaypoints[draggedIndex];
    newWaypoints.splice(draggedIndex, 1);
    newWaypoints.splice(index, 0, draggedItem);
    
    onReorderWaypoints(newWaypoints);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card className="bg-background/95 backdrop-blur-md border-border/50 shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Waypoints</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onSelectLocation}
          disabled={waypoints.length >= maxWaypoints}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Stop
        </Button>
      </div>

      {waypoints.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No waypoints added</p>
          <p className="text-xs mt-1">Add stops along your route</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {waypoints.map((waypoint, index) => (
              <div
                key={waypoint.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-move group"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{waypoint.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveWaypoint(waypoint.id)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {waypoints.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {waypoints.length} of {maxWaypoints} waypoints • Drag to reorder
          </p>
        </div>
      )}
    </Card>
  );
}
