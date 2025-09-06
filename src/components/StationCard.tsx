import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Star, Clock, Navigation, MapPin, Fuel, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type FuelStatus = "available" | "low" | "out";

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: FuelStatus;
  note?: string;
  lastUpdated?: string;
}

function badgeVariant(status: FuelStatus) {
  switch (status) {
    case "available":
      return "success" as const;
    case "low":
      return "warning" as const;
    case "out":
      return "destructive" as const;
  }
}

function statusLabel(status: FuelStatus) {
  switch (status) {
    case "available":
      return "Fuel Available";
    case "low":
      return "Low Supply";
    case "out":
      return "Out of Fuel";
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
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

export const StationCard = ({ station, userLocation, isFavorite, onToggleFavorite }: { station: Station | null; userLocation?: { lat: number; lng: number }; isFavorite?: boolean; onToggleFavorite?: (id: string) => void }) => {
  const { user } = useAuth();
  if (!station) {
    return (
      <Card className="surface-gradient">
        <CardHeader>
          <CardTitle>Station details</CardTitle>
          <CardDescription>Select a marker on the map to view details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">No station selected.</div>
        </CardContent>
      </Card>
    );
  }

  const distance = userLocation ? formatDistance(haversineKm(userLocation, { lat: station.lat, lng: station.lng })) : null;
  const dest = `${station.lat},${station.lng}`;
  const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : undefined;
  const directionsUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

  const handleToggleFavorite = () => onToggleFavorite?.(station.id);

  const reportStatus = async (newStatus: FuelStatus) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to report station status.",
        action: <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>Sign In</Button>
      });
      return;
    }
    
    const { error } = await (supabase as any).from('station_reports').insert({
      station_id: station.id,
      station_name: station.name,
      status: newStatus,
    } as any);
    
    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "Status reported", description: `${statusLabel(newStatus)} submitted successfully.` });
    }
  };
  return (
    <Card className={cn(
      "mobile-card hover-lift overflow-hidden transition-mobile",
      "bg-gradient-surface border border-border/30 shadow-mobile"
    )}>
      {/* Enhanced Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                station.status === 'available' && "bg-success",
                station.status === 'low' && "bg-warning", 
                station.status === 'out' && "bg-destructive"
              )} />
              {station.name}
            </CardTitle>
            <CardDescription className="space-y-2 mt-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {station.address}
              </div>
              {station.note && (
                <div className="text-sm italic text-muted-foreground bg-muted/50 rounded-lg px-2 py-1">
                  "{station.note}"
                </div>
              )}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="w-10 h-10 rounded-xl"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            onClick={handleToggleFavorite}
          >
            <Star className={cn("h-4 w-4 transition-colors", 
              isFavorite ? 'text-warning fill-current' : 'text-muted-foreground'
            )} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Distance Row */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={badgeVariant(station.status)} 
            className="flex items-center gap-1 px-3 py-1"
          >
            <Fuel className="h-3 w-3" />
            {statusLabel(station.status)}
          </Badge>
          {distance && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Navigation className="h-3 w-3" />
              {distance} away
            </div>
          )}
        </div>

        {/* Last Updated */}
        {station.lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2 py-1">
            <Clock className="h-3 w-3" />
            Updated {new Date(station.lastUpdated).toLocaleString()}
          </div>
        )}

        {/* Primary Action */}
        <Button 
          asChild 
          className="w-full mobile-button h-12 rounded-2xl font-medium"
        >
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Get directions">
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </a>
        </Button>

        {/* Status Reporting */}
        {user && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Update station status
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => reportStatus("available")}
                className="rounded-xl text-xs"
              >
                Available
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => reportStatus("low")}
                className="rounded-xl text-xs"
              >
                Low
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => reportStatus("out")}
                className="rounded-xl text-xs"
              >
                Empty
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StationCard;
