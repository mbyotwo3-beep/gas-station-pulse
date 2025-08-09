import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export const StationCard = ({ station }: { station: Station | null }) => {
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

  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle>{station.name}</CardTitle>
        <CardDescription>{station.address}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant={badgeVariant(station.status)}>{statusLabel(station.status)}</Badge>
          <div className="text-sm text-muted-foreground">Updated just now</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StationCard;
