import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Route, Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FareEstimateProps {
  estimate: {
    distance: number;
    duration: number;
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    totalFare: number;
    currency: string;
  } | null;
  loading?: boolean;
}

export default function FareEstimateCard({ estimate, loading }: FareEstimateProps) {
  if (loading) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
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
                    This is an estimate based on distance and time. 
                    Final fare may vary due to traffic conditions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-2xl font-bold text-primary">
            ${estimate.totalFare.toFixed(2)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Distance:</span>
            <span className="font-medium">{estimate.distance} km</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Est. Time:</span>
            <span className="font-medium">{estimate.duration} min</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-primary/10">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Base fare: ${estimate.baseFare.toFixed(2)}</span>
            <span>Distance: ${estimate.distanceFare.toFixed(2)}</span>
            <span>Time: ${estimate.timeFare.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
