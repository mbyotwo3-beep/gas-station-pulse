import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, Fuel, MapPin, Crosshair } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Station } from "@/hooks/useStations";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2));
  return R * c;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface NearestStationsProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  accuracy: number | null;
  isLiveGps: boolean;
  selectedId?: string | null;
  onSelect: (s: Station) => void;
  limit?: number;
}

export default function NearestStations({
  stations,
  userLocation,
  accuracy,
  isLiveGps,
  selectedId,
  onSelect,
  limit = 3,
}: NearestStationsProps) {
  const nearest = useMemo(() => {
    if (!userLocation) return [];
    return stations
      .filter((s) => s.status === "available")
      .map((s) => ({ station: s, distanceKm: haversineKm(userLocation, { lat: s.lat, lng: s.lng }) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }, [stations, userLocation, limit]);

  if (!userLocation) {
    return (
      <Card className="p-4 border-dashed bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Enable location to see the nearest available stations.
        </div>
      </Card>
    );
  }

  if (nearest.length === 0) {
    return (
      <Card className="p-4 border-dashed bg-muted/30">
        <div className="text-sm text-muted-foreground">
          No available fuel stations found nearby right now.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase font-semibold text-muted-foreground tracking-wide flex items-center gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-primary" />
          Nearest available
        </h3>
        {isLiveGps && accuracy !== null && (
          <span className="text-[10px] text-muted-foreground">
            GPS ±{Math.round(accuracy)}m
          </span>
        )}
      </div>

      <div className="space-y-2">
        {nearest.map(({ station, distanceKm }, idx) => {
          const isActive = selectedId === station.id;
          const isClosest = idx === 0;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelect(station)}
              className={cn(
                "w-full text-left rounded-2xl border p-3 transition-mobile active:scale-[0.98]",
                "shadow-sm backdrop-blur-sm",
                isClosest
                  ? "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border-primary/40 ring-1 ring-primary/30"
                  : "bg-card/60 border-border/40 hover:bg-muted/40",
                isActive && "ring-2 ring-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shrink-0",
                    isClosest
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-foreground"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold leading-tight truncate">
                      {station.name}
                    </span>
                    {isClosest && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">
                        Closest
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {station.address}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mt-1">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Navigation className="h-3 w-3" />
                      {formatDistance(distanceKm)}
                    </span>
                    <span className="flex items-center gap-1 text-success">
                      <Fuel className="h-3 w-3" />
                      Available
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isClosest ? "default" : "outline"}
                  className="shrink-0 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(station);
                  }}
                >
                  Go
                </Button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
