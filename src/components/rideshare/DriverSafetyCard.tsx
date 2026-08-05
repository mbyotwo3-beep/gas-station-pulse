import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, Star, Car } from 'lucide-react';

interface Props {
  driverId: string;
}

/**
 * Shown to the passenger before pickup so they can confirm the car and the
 * person are the vetted ones the platform assigned.
 */
export default function DriverSafetyCard({ driverId }: Props) {
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(
    null,
  );
  const [driver, setDriver] = useState<{
    vehicle_type: string;
    vehicle_make: string | null;
    vehicle_model: string | null;
    license_plate: string | null;
    rating: number | null;
    total_rides: number | null;
    verification_status: string | null;
  } | null>(null);

  useEffect(() => {
    if (!driverId) return;
    (async () => {
      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.rpc('get_safe_profile', { _user_id: driverId }),
        supabase.rpc('get_safe_driver_profile', { _user_id: driverId }),
      ]);
      const prow = Array.isArray(p) ? p[0] : p;
      const drow = Array.isArray(d) ? d[0] : d;
      if (prow) setProfile(prow as typeof profile);
      if (drow) setDriver(drow as typeof driver);
    })();
  }, [driverId]);

  if (!driver) return null;

  const vehicle = [driver.vehicle_make, driver.vehicle_model].filter(Boolean).join(' ');

  return (
    <Card className="border-primary/30">
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt="Driver photo" />
          <AvatarFallback>{profile?.display_name?.[0]?.toUpperCase() ?? 'D'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{profile?.display_name ?? 'Your driver'}</p>
            {driver.verification_status === 'approved' && (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Car className="h-3.5 w-3.5" />
            {vehicle || driver.vehicle_type}
            {driver.license_plate && (
              <span className="font-mono font-semibold text-foreground">
                {driver.license_plate}
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-warning" fill="currentColor" />
            {Number(driver.rating ?? 5).toFixed(1)} · {driver.total_rides ?? 0} trips
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
