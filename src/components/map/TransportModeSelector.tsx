import { Car, Bike, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TransportMode } from '@/hooks/useRouting';

interface TransportModeSelectorProps {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
  className?: string;
}

const modes: { value: TransportMode; icon: React.ReactNode; label: string }[] = [
  { value: 'driving', icon: <Car className="h-4 w-4" />, label: 'Drive' },
  { value: 'cycling', icon: <Bike className="h-4 w-4" />, label: 'Cycle' },
  { value: 'walking', icon: <Footprints className="h-4 w-4" />, label: 'Walk' },
];

export function TransportModeSelector({ value, onChange, className }: TransportModeSelectorProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-muted rounded-lg", className)}>
      {modes.map((mode) => (
        <Button
          key={mode.value}
          variant={value === mode.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(mode.value)}
          className={cn(
            "flex-1 gap-1.5",
            value === mode.value && "shadow-sm"
          )}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </Button>
      ))}
    </div>
  );
}