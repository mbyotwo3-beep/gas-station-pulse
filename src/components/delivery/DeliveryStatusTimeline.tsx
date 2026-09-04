import { Check, Clock, Package, Truck, Home, CircleDashed, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeliveryStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picking_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

interface Step {
  key: DeliveryStatus;
  label: string;
  Icon: typeof Clock;
}

const BASE_STEPS: Step[] = [
  { key: 'pending', label: 'Order placed', Icon: Clock },
  { key: 'accepted', label: 'Courier assigned', Icon: Check },
  { key: 'picking_up', label: 'Picking up', Icon: Package },
  { key: 'in_transit', label: 'On the way', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: Home },
];

/** Food orders pass through the kitchen before a courier collects them. */
const FOOD_STEPS: Step[] = [
  { key: 'pending', label: 'Order placed', Icon: Clock },
  { key: 'accepted', label: 'Accepted', Icon: Check },
  { key: 'preparing', label: 'Preparing', Icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Ready', Icon: Package },
  { key: 'in_transit', label: 'On the way', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: Home },
];

interface DeliveryStatusTimelineProps {
  status: string;
  serviceType?: string;
  className?: string;
}

export default function DeliveryStatusTimeline({
  status,
  serviceType,
  className,
}: DeliveryStatusTimelineProps) {
  if (status === 'cancelled') {
    return (
      <div className={cn('rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive', className)}>
        This order was cancelled.
      </div>
    );
  }
  const STEPS = serviceType === 'food_delivery' ? FOOD_STEPS : BASE_STEPS;
  const normalized = STEPS.some((s) => s.key === status)
    ? status
    : status === 'picking_up'
      ? 'ready_for_pickup'
      : status;
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.key === normalized));


  return (
    <ol className={cn('flex items-stretch gap-1', className)}>
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const Icon = active ? step.Icon : done ? Check : CircleDashed;
        return (
          <li key={step.key} className="flex-1 min-w-0">
            <div
              className={cn(
                'flex h-1.5 rounded-full mb-2 transition-colors',
                done || active ? 'bg-primary' : 'bg-muted',
              )}
            />
            <div className="flex items-start gap-1.5">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  active && 'bg-primary text-primary-foreground animate-pulse',
                  done && 'bg-primary text-primary-foreground',
                  !active && !done && 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-3 w-3" />
              </div>
              <span
                className={cn(
                  'text-[10px] leading-tight',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
