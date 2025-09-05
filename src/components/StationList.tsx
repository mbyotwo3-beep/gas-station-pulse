import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Station } from "@/hooks/useStations";
import { Star } from "lucide-react";
import React, { useMemo } from "react";

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
    <Card className="surface-gradient p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Nearby stations</h2>
        {origin && <div className="text-xs text-muted-foreground">From your chosen point</div>}
      </div>
      <ScrollArea className="max-h-[40vh] md:max-h-[50vh] pr-2">
        <ul className="space-y-2">
          {items.map(({ station, distanceKm }) => {
            const isActive = selectedId === station.id;
            const isFav = favorites.has(station.id);
            return (
              <li key={station.id}>
                <button
                  onClick={() => onSelect(station)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                    isActive ? 'bg-accent border-accent-foreground/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={station.status === 'available' ? 'success' : station.status === 'low' ? 'warning' : 'destructive'}>
                      {station.status === 'available' ? 'Fuel Available' : station.status === 'low' ? 'Low Supply' : 'Out of Fuel'}
                    </Badge>
                    <div>
                      <div className="font-medium leading-tight">{station.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{station.address}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {distanceKm != null && (
                        <div className="text-xs text-muted-foreground">{formatDistance(distanceKm)} away</div>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(station.id);
                        }}
                      >
                        <Star className={"h-4 w-4 " + (isFav ? 'text-warning' : 'text-muted-foreground')} fill={isFav ? "currentColor" : "none"} />
                      </Button>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </Card>
  );
}
