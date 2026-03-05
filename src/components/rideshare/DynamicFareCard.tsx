import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, Route, Clock, Info, TrendingUp, 
  Cloud, Fuel, TrafficCone 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DynamicFareEstimate {
  distance: number;
  duration: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  weatherFare: number;
  fuelAdjustment: number;
  trafficFare: number;
  totalFare: number;
  currency: string;
  surgeMultiplier: number;
  weatherCondition: string;
  trafficLevel: string;
  fuelPricePerLiter: number;
}

interface DynamicFareCardProps {
  estimate: DynamicFareEstimate | null;
  loading?: boolean;
}

export default function DynamicFareCard({ estimate, loading }: DynamicFareCardProps) {
  if (loading) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) return null;

  const hasSurge = estimate.surgeMultiplier > 1;
  const hasWeatherImpact = estimate.weatherFare > 0;
  const hasTrafficImpact = estimate.trafficFare > 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="font-semibold">Estimated Fare</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Dynamic pricing based on distance, time, demand, weather, traffic, and fuel costs.
                    Final fare may vary.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold text-primary">
            ${estimate.totalFare.toFixed(2)}
          </div>
        </div>

        {/* Conditions Badges */}
        <div className="flex flex-wrap gap-1.5">
          {hasSurge && (
            <Badge variant="destructive" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              {estimate.surgeMultiplier}x Surge
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs gap-1">
            {estimate.weatherCondition}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            {estimate.trafficLevel}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Fuel className="h-3 w-3" />
            ${estimate.fuelPricePerLiter}/L
          </Badge>
        </div>

        {/* Distance & Time */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Distance:</span>
            <span className="font-medium">{estimate.distance} km</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{estimate.duration} min</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="pt-3 border-t border-primary/10 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Fare Breakdown</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base fare</span>
              <span>${estimate.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span>${estimate.distanceFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>${estimate.timeFare.toFixed(2)}</span>
            </div>
            {estimate.surgeFare > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Surge ({estimate.surgeMultiplier}x)</span>
                <span>+${estimate.surgeFare.toFixed(2)}</span>
              </div>
            )}
            {estimate.weatherFare > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Weather</span>
                <span>+${estimate.weatherFare.toFixed(2)}</span>
              </div>
            )}
            {estimate.trafficFare > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Traffic</span>
                <span>+${estimate.trafficFare.toFixed(2)}</span>
              </div>
            )}
            {estimate.fuelAdjustment > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Fuel surcharge</span>
                <span>+${estimate.fuelAdjustment.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
