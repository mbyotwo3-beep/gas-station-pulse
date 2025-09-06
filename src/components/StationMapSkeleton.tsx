import { Skeleton } from "@/components/ui/skeleton";

export default function StationMapSkeleton() {
  return (
    <div className="h-full w-full relative bg-muted/30 rounded-lg overflow-hidden">
      {/* Map placeholder */}
      <Skeleton className="h-full w-full" />
      
      {/* Floating skeleton elements to simulate map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      
      {/* Simulated map markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 200 - 100}px`,
                top: `${Math.random() * 200 - 100}px`,
                animationDelay: `${i * 200}ms`
              }}
            >
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}