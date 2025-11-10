import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Route } from '@/hooks/useRouting';
import { Waypoint } from '@/components/map/WaypointsManager';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp, TrendingUp, MapPin, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface TurnByTurnDirectionsProps {
  route: Route | null;
  onClose: () => void;
  destinationName?: string;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  waypoints?: Waypoint[];
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

function getManeuverIcon(type: string, modifier?: string) {
  if (type === 'depart') return <ArrowUp className="w-5 h-5" />;
  if (type === 'arrive') return <MapPin className="w-5 h-5" />;
  if (type === 'turn') {
    if (modifier?.includes('left')) return <ArrowLeft className="w-5 h-5" />;
    if (modifier?.includes('right')) return <ArrowRight className="w-5 h-5" />;
  }
  if (type === 'roundabout' || type === 'rotary') return <TrendingUp className="w-5 h-5 rotate-45" />;
  return <ArrowUp className="w-5 h-5" />;
}

export default function TurnByTurnDirections({ route, onClose, destinationName, voiceEnabled, onVoiceToggle, waypoints = [] }: TurnByTurnDirectionsProps) {
  if (!route) return null;

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-md border-border/50 shadow-lg">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Directions</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onVoiceToggle}
              className={voiceEnabled ? 'text-primary' : 'text-muted-foreground'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>
        
        {destinationName && (
          <p className="text-sm text-muted-foreground mb-2">To {destinationName}</p>
        )}
        
        {waypoints.length > 0 && (
          <div className="mb-2 p-2 rounded-lg bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">Stops along the way:</p>
            <div className="space-y-1">
              {waypoints.map((waypoint, index) => (
                <div key={waypoint.id} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="truncate">{waypoint.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Distance: </span>
            <span className="font-medium">{formatDistance(route.distance)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Time: </span>
            <span className="font-medium">{formatDuration(route.duration)}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          {route.steps.map((step, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1 text-primary">
                {getManeuverIcon(step.maneuver.type, step.maneuver.modifier)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">{step.instruction}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(step.distance)}
                  {step.duration > 0 && ` • ${formatDuration(step.duration)}`}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-xs font-medium text-muted-foreground mt-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
