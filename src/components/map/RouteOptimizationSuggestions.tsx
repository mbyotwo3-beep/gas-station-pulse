import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Clock, Navigation2, TrendingDown, X } from 'lucide-react';
import type { SavedRoute } from '@/hooks/useSavedRoutes';

interface OptimizationSuggestion {
  routeId: string;
  routeName: string;
  currentEstimate: {
    distance: number;
    duration: number;
  };
  suggestedRoute: {
    distance: number;
    duration: number;
  };
  savings: {
    distance: number;
    duration: number;
    percentage: number;
  };
}

interface RouteOptimizationSuggestionsProps {
  suggestions: OptimizationSuggestion[];
  onApplySuggestion: (routeId: string) => void;
  onClose: () => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

export default function RouteOptimizationSuggestions({
  suggestions,
  onApplySuggestion,
  onClose
}: RouteOptimizationSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-md border-border/50 shadow-lg">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Route Optimization</h3>
            <Badge variant="secondary" className="ml-2">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[500px]">
        <div className="p-4 space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.routeId}
              className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{suggestion.routeName}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    We found a more efficient route for you
                  </p>
                </div>
                <Badge variant="default" className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {suggestion.savings.percentage.toFixed(0)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <div className="text-muted-foreground font-medium">Current Route</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDuration(suggestion.currentEstimate.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation2 className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDistance(suggestion.currentEstimate.distance)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-primary font-medium">Suggested Route</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="font-medium">
                        {formatDuration(suggestion.suggestedRoute.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation2 className="w-3 h-3 text-primary" />
                      <span className="font-medium">
                        {formatDistance(suggestion.suggestedRoute.distance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Potential Savings</span>
                  <div className="flex gap-3 font-medium text-primary">
                    <span>-{formatDuration(suggestion.savings.duration)}</span>
                    <span>-{formatDistance(suggestion.savings.distance)}</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => onApplySuggestion(suggestion.routeId)}
                className="w-full"
              >
                <Navigation2 className="w-3 h-3 mr-2" />
                Use Optimized Route
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
