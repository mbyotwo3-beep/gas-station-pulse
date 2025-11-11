import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Trash2, Navigation, Edit2, X, Check } from 'lucide-react';
import type { SavedRoute } from '@/hooks/useSavedRoutes';

interface SavedRoutesListProps {
  routes: SavedRoute[];
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: string) => void;
  onUpdateRoute: (routeId: string, name: string) => void;
  onClose: () => void;
}

export default function SavedRoutesList({
  routes,
  onLoadRoute,
  onDeleteRoute,
  onUpdateRoute,
  onClose
}: SavedRoutesListProps) {
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (route: SavedRoute) => {
    setEditingId(route.id);
    setEditName(route.name);
  };

  const handleSaveEdit = (routeId: string) => {
    if (editName.trim()) {
      onUpdateRoute(routeId, editName.trim());
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <>
      <Card className="w-full max-w-md bg-background/95 backdrop-blur-md border-border/50 shadow-lg">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Saved Routes</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No saved routes yet. Save your frequently used routes for quick access.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors space-y-2"
                >
                  {editingId === route.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(route.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(route.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4 text-success" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{route.name}</h4>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(route)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteRouteId(route.id)}
                            className="h-7 w-7 p-0 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[45px]">From:</span>
                          <span className="line-clamp-1">{route.start_location.label || 'Start location'}</span>
                        </div>
                        {route.waypoints && route.waypoints.length > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium min-w-[45px]">Stops:</span>
                            <span>{route.waypoints.length} waypoint{route.waypoints.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[45px]">To:</span>
                          <span className="line-clamp-1">{route.end_location.label || 'Destination'}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onLoadRoute(route)}
                        className="w-full mt-2 h-8"
                      >
                        <Navigation className="w-3 h-3 mr-2" />
                        Load Route
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved route? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteRouteId) {
                  onDeleteRoute(deleteRouteId);
                  setDeleteRouteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
