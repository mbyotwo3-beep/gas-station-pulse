import { useEffect, useState } from 'react';

interface LatLng { lat: number; lng: number }

/**
 * Live ETA between the driver's last known ping and a target point,
 * computed with the free OSRM demo routing service.
 */
export function useRideEta(from: LatLng | null, to: LatLng | null) {
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!from || !to) {
      setEtaMin(null);
      setDistanceKm(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();
        const route = json?.routes?.[0];
        if (!cancelled && route) {
          setEtaMin(Math.max(1, Math.round(route.duration / 60)));
          setDistanceKm(+(route.distance / 1000).toFixed(1));
        }
      } catch {
        /* keep last known ETA on failure */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-run whenever the driver moves meaningfully or the target changes
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  return { etaMin, distanceKm, loading };
}
