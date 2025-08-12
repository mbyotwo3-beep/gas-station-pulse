import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export type FuelStatus = "available" | "low" | "out";

export interface Station {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: FuelStatus;
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
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast({ title: "Please sign in", description: "You need to log in to report station status." });
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
      toast({ title: "Status reported", description: `${statusLabel(newStatus)} submitted.` });
    }
  };
  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle>{station.name}</CardTitle>
        <CardDescription>{station.address}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={badgeVariant(station.status)}>{statusLabel(station.status)}</Badge>
          {distance && <div className="text-sm text-muted-foreground">{distance} away</div>}
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            onClick={handleToggleFavorite}
          >
            <Star className={"h-4 w-4 " + (isFavorite ? 'text-yellow-500' : 'text-muted-foreground')} fill={isFavorite ? 'currentColor' : 'none'} />
          </Button>
          <div>
            <Button asChild size="sm" variant="secondary">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Get directions">
                Directions
              </a>
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => reportStatus("available")}>Mark Available</Button>
          <Button size="sm" variant="outline" onClick={() => reportStatus("low")}>Mark Low</Button>
          <Button size="sm" variant="destructive" onClick={() => reportStatus("out")}>Mark Out</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StationCard;
