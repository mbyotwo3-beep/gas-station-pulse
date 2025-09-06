import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StationListSkeleton() {
  return (
    <Card className="mobile-card">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border p-3 animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}