import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface AccuracyPoint {
  t: number; // ms timestamp
  v: number; // accuracy in meters
}

interface AccuracySparklineProps {
  points: AccuracyPoint[];
  /** Window in ms; points older than this are ignored. */
  windowMs?: number;
  width?: number;
  height?: number;
  /** Centered moving-average window size (samples). Set to 1 to disable smoothing. */
  smoothingWindow?: number;
  className?: string;
}

/**
 * Tiny inline SVG sparkline of GPS accuracy values over a rolling window.
 * Lower values (better accuracy) sit closer to the top of the chart.
 */
export default function AccuracySparkline({
  points,
  windowMs = 60_000,
  width = 80,
  height = 24,
  smoothingWindow = 5,
  className,
}: AccuracySparklineProps) {
  const { path, areaPath, latest, min, max, strokeColor } = useMemo(() => {
    const now = Date.now();
    const windowed = points.filter(p => now - p.t <= windowMs);

    if (windowed.length === 0) {
      return { path: '', areaPath: '', latest: null, min: 0, max: 0, strokeColor: 'hsl(var(--muted-foreground))' };
    }

    const values = windowed.map(p => p.v);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = Math.max(maxV - minV, 1); // avoid divide-by-zero

    const tMin = now - windowMs;
    const tRange = windowMs;

    const coords = windowed.map(p => {
      const x = ((p.t - tMin) / tRange) * width;
      // Invert Y: lower meters (better) -> higher on chart
      const y = height - ((p.v - minV) / range) * (height - 4) - 2;
      return [x, y] as const;
    });

    // Build smoothed line path
    const d = coords
      .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`))
      .join(' ');

    // Area fill underneath
    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `${d} L ${last[0].toFixed(1)} ${height} L ${first[0].toFixed(1)} ${height} Z`;

    const latestVal = values[values.length - 1];
    const color =
      latestVal <= 30
        ? 'hsl(var(--success, 142 76% 36%))'
        : latestVal <= 100
        ? 'hsl(var(--muted-foreground))'
        : 'hsl(var(--destructive))';

    return {
      path: d,
      areaPath: area,
      latest: latestVal,
      min: minV,
      max: maxV,
      strokeColor: color,
    };
  }, [points, windowMs, width, height]);

  if (!path) {
    return (
      <div
        className={cn('flex items-center justify-center text-[9px] text-muted-foreground', className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`GPS accuracy trend, latest ${Math.round(latest ?? 0)} meters, range ${Math.round(min)}–${Math.round(max)}m`}
    >
      <path d={areaPath} fill={strokeColor} fillOpacity={0.15} />
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
