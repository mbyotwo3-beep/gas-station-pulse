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

    // Centered moving average for a smoother trend line.
    const w = Math.max(1, Math.floor(smoothingWindow));
    const half = Math.floor(w / 2);
    const smoothed = values.map((_, i) => {
      const start = Math.max(0, i - half);
      const end = Math.min(values.length, i + half + 1);
      let sum = 0;
      for (let k = start; k < end; k++) sum += values[k];
      return sum / (end - start);
    });

    const minV = Math.min(...smoothed);
    const maxV = Math.max(...smoothed);
    const range = Math.max(maxV - minV, 1); // avoid divide-by-zero

    const tMin = now - windowMs;
    const tRange = windowMs;

    const coords = windowed.map((p, i) => {
      const x = ((p.t - tMin) / tRange) * width;
      // Invert Y: lower meters (better) -> higher on chart
      const y = height - ((smoothed[i] - minV) / range) * (height - 4) - 2;
      return [x, y] as const;
    });

    // Build a smooth path using quadratic curves between midpoints (Catmull-Rom-like).
    let d = '';
    if (coords.length === 1) {
      d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
    } else {
      d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
      for (let i = 1; i < coords.length; i++) {
        const [px, py] = coords[i - 1];
        const [cx, cy] = coords[i];
        const mx = (px + cx) / 2;
        const my = (py + cy) / 2;
        d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
        if (i === coords.length - 1) {
          d += ` T ${cx.toFixed(1)} ${cy.toFixed(1)}`;
        }
      }
    }

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
