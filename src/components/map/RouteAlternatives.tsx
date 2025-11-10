import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route } from '@/hooks/useRouting';
import { Navigation, Clock, MapPin, TrendingUp, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteAlternativesProps {
  routes: Route[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getRouteIcon(type?: string) {
  if (type === 'fastest') return <Zap className="w-4 h-4" />;
  if (type === 'shortest') return <TrendingUp className="w-4 h-4" />;
  return <Navigation className="w-4 h-4" />;
}

function getRouteLabel(type?: string) {
  if (type === 'fastest') return 'Fastest';
  if (type === 'shortest') return 'Shortest';
  return 'Alternative';
}

function getRouteDescription(route: Route): string {
  const time = formatDuration(route.duration);
  const distance = formatDistance(route.distance);
  
  if (route.type === 'fastest') {
    return `${time} • ${distance} • Recommended route`;
  }
  if (route.type === 'shortest') {
    return `${time} • ${distance} • Fewer kilometers`;
  }
  return `${time} • ${distance}`;
}

export default function RouteAlternatives({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  onClose,
  onConfirm,
}: RouteAlternativesProps) {
  if (routes.length === 0) return null;

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-md border-border/50 shadow-lg">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Choose Your Route</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {routes.length} route{routes.length > 1 ? 's' : ''} available
        </p>
      </div>

      <div className="p-4 space-y-3">
        {routes.map((route, index) => (
          <button
            key={route.index ?? index}
            onClick={() => onSelectRoute(route.index ?? index)}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all",
              "hover:bg-muted/50",
              selectedRouteIndex === (route.index ?? index)
                ? "border-primary bg-primary/5"
                : "border-border/50"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                selectedRouteIndex === (route.index ?? index)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {getRouteIcon(route.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {getRouteLabel(route.type)}
                  </span>
                  {route.type === 'fastest' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium">{formatDuration(route.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{formatDistance(route.distance)}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {route.steps.length} steps • via main roads
                </p>
              </div>

              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                selectedRouteIndex === (route.index ?? index)
                  ? "border-primary bg-primary"
                  : "border-muted-foreground"
              )}>
                {selectedRouteIndex === (route.index ?? index) && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-border/50">
        <Button 
          onClick={onConfirm}
          className="w-full"
          size="lg"
        >
          Start Navigation
        </Button>
      </div>
    </Card>
  );
}
