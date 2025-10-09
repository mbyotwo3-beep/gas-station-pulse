import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Station } from "@/hooks/useStations";
import { Star, Navigation, Fuel } from "lucide-react";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
  return R * c;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function StationList({
  stations,
  origin,
  selectedId,
  onSelect,
  favorites,
  onToggleFavorite,
}: {
  stations: Station[];
  origin?: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect: (s: Station) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}) {
  const items = useMemo(() => {
    const withDist = stations.map((s) => ({
      station: s,
      distanceKm: origin ? haversineKm(origin, { lat: s.lat, lng: s.lng }) : null,
    }));
    withDist.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return a.station.name.localeCompare(b.station.name);
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return withDist;
  }, [stations, origin]);

  return (
    <Card className="mobile-card bg-gradient-surface">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Nearby stations</h2>
        {origin && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
            From your chosen point
          </div>
        )}
      </div>
      <ScrollArea className="max-h-[60vh] pr-2">
        <div className="space-y-3">
          {items.map(({ station, distanceKm }, index) => {
            const isActive = selectedId === station.id;
            const isFav = favorites.has(station.id);
            
            return (
              <div 
                key={station.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  onClick={() => onSelect(station)}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4 transition-mobile active:scale-98 cursor-pointer",
                    "hover-lift shadow-sm bg-card/50 backdrop-blur-sm",
                    isActive 
                      ? 'bg-accent/20 border-accent shadow-md' 
                      : 'hover:bg-muted/30 border-border/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status indicator */}
                    <div className="flex flex-col items-center gap-1 min-w-fit">
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        station.status === 'available' && "bg-success",
                        station.status === 'low' && "bg-warning", 
                        station.status === 'out' && "bg-destructive"
                      )} />
                      <Badge 
                        variant={station.status === 'available' ? 'success' : station.status === 'low' ? 'warning' : 'destructive'}
                        className="text-xs px-2 py-0.5"
                      >
                        <Fuel className="h-2.5 w-2.5 mr-1" />
                        {station.status === 'available' ? 'Available' : station.status === 'low' ? 'Low' : 'Out'}
                      </Badge>
                    </div>
                    
                    {/* Station info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight mb-1">{station.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{station.address}</div>
                      {distanceKm != null && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Navigation className="h-2.5 w-2.5" />
                          {formatDistance(distanceKm)} away
                        </div>
                      )}
                    </div>
                    
                    {/* Favorite button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 rounded-xl min-w-fit"
                      aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(station.id);
                      }}
                    >
                      <Star className={cn("h-3.5 w-3.5 transition-colors", 
                        isFav ? 'text-warning fill-current' : 'text-muted-foreground'
                      )} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
