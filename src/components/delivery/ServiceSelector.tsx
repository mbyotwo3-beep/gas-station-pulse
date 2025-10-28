import { Card } from '@/components/ui/card';
import { Car, Package, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  selectedService: 'ride' | 'food_delivery' | 'package_delivery';
  onServiceChange: (service: 'ride' | 'food_delivery' | 'package_delivery') => void;
}

export default function ServiceSelector({ selectedService, onServiceChange }: ServiceSelectorProps) {
  const services = [
    {
      id: 'ride' as const,
      name: 'Ride',
      icon: Car,
      description: 'Get a ride to your destination'
    },
    {
      id: 'food_delivery' as const,
      name: 'Food',
      icon: UtensilsCrossed,
      description: 'Order food from restaurants'
    },
    {
      id: 'package_delivery' as const,
      name: 'Package',
      icon: Package,
      description: 'Send packages anywhere'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {services.map((service) => {
        const Icon = service.icon;
        const isSelected = selectedService === service.id;
        
        return (
          <Card
            key={service.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-lg",
              isSelected 
                ? "border-primary bg-primary/5 shadow-md" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onServiceChange(service.id)}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <Icon className={cn(
                "h-8 w-8",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <p className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {service.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {service.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
