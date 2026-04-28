import { useEffect, useRef, useState } from "react";
import { Activity, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { classifyGpsAccuracy, gpsToneClasses } from "@/lib/gpsQuality";

interface GpsAccuracyTestProps {
  open: boolean;
  onClose: () => void;
  /** Total test duration in seconds. */
  durationSec?: number;
}

interface Sample {
  t: number;
  accuracy: number;
  lat: number;
  lng: number;
}

export default function GpsAccuracyTest({
  open,
  onClose,
  durationSec = 20,
}: GpsAccuracyTestProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const stop = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
  };

  const start = () => {
    setSamples([]);
    setElapsed(0);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setRunning(true);
    startRef.current = performance.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setSamples((prev) => [
          ...prev,
          {
            t: performance.now() - startRef.current,
            accuracy: pos.coords.accuracy,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
        ]);
      },
      (err) => {
        setError(err.message || "Could not read GPS.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    tickRef.current = window.setInterval(() => {
      const e = (performance.now() - startRef.current) / 1000;
      setElapsed(e);
      if (e >= durationSec) {
        stop();
      }
    }, 200);
  };

  // Stop on close/unmount
  useEffect(() => {
    if (!open) stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const count = samples.length;
  const best = count ? Math.min(...samples.map((s) => s.accuracy)) : null;
  const worst = count ? Math.max(...samples.map((s) => s.accuracy)) : null;
  const avg = count
    ? samples.reduce((sum, s) => sum + s.accuracy, 0) / count
    : null;
  const last = count ? samples[count - 1].accuracy : null;

  // Drift = max distance between any two sampled points (meters)
  const drift = (() => {
    if (count < 2) return null;
    let max = 0;
    for (let i = 0; i < samples.length; i++) {
      for (let j = i + 1; j < samples.length; j++) {
        const a = samples[i];
        const b = samples[j];
        const dLat = (b.lat - a.lat) * 111000;
        const dLng =
          (b.lng - a.lng) * 111000 * Math.cos((a.lat * Math.PI) / 180);
        const d = Math.sqrt(dLat * dLat + dLng * dLng);
        if (d > max) max = d;
      }
    }
    return max;
  })();

  const progress = Math.min(100, (elapsed / durationSec) * 100);
  const finished = !running && count > 0;

  const verdict = (() => {
    if (!finished || avg === null) return null;
    const quality = classifyGpsAccuracy(avg);
    const driftOk = (drift ?? 0) < 25;

    // Excellent + stable drift = trust
    if (quality.tier === 'excellent' && driftOk) {
      return {
        tone: 'success' as const,
        icon: Check,
        title: 'Trust this fix',
        body: 'GPS is locked tight and stable. Position is reliable.',
      };
    }
    // Good, or excellent with drift = usable but confirm pickups
    if (quality.tier === 'excellent' || quality.tier === 'good') {
      return {
        tone: 'warning' as const,
        icon: AlertTriangle,
        title: 'Usable, but not precise',
        body: driftOk
          ? 'Fine for nearby places. Confirm exact pickups manually.'
          : `Position drifted ~${Math.round(drift ?? 0)}m during the test. Confirm pickups manually.`,
      };
    }
    // Fair / Poor / Very poor → don't trust
    return {
      tone: 'destructive' as const,
      icon: AlertTriangle,
      title: "Don't trust this fix",
      body: quality.hint,
    };
  })();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="GPS accuracy test"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-background rounded-3xl border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/12 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">GPS Accuracy Test</div>
              <div className="text-[11px] text-muted-foreground">
                {running
                  ? `Sampling… ${elapsed.toFixed(1)}s / ${durationSec}s`
                  : finished
                  ? `Done — ${count} sample${count === 1 ? "" : "s"} collected`
                  : `Runs for ${durationSec}s. Stand still for best results.`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-200 ease-linear",
              finished ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${running ? progress : finished ? 100 : 0}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Best" value={best} highlight="success" />
            <Stat label="Average" value={avg} />
            <Stat label="Worst" value={worst} highlight="warning" />
            <Stat label="Latest" value={last} />
            <Stat label="Drift" value={drift} unit="m" />
            <Stat
              label="Samples"
              value={count}
              unit=""
              isCount
            />
          </div>

          {verdict && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3 text-xs",
                verdict.tone === "success" &&
                  "bg-success/10 border-success/40 text-success",
                verdict.tone === "warning" &&
                  "bg-warning/10 border-warning/40 text-warning-foreground",
                verdict.tone === "destructive" &&
                  "bg-destructive/10 border-destructive/40 text-destructive"
              )}
            >
              <verdict.icon className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">{verdict.title}</div>
                <div className="opacity-90 leading-snug">{verdict.body}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!running && !finished && (
              <Button onClick={start} className="flex-1">
                Start test
              </Button>
            )}
            {running && (
              <Button onClick={stop} variant="outline" className="flex-1">
                Stop early
              </Button>
            )}
            {finished && (
              <>
                <Button onClick={start} variant="outline" className="flex-1">
                  Run again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit = "m",
  highlight,
  isCount,
}: {
  label: string;
  value: number | null;
  unit?: string;
  highlight?: "success" | "warning";
  isCount?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-base font-bold mt-0.5",
          highlight === "success" && value !== null && "text-success",
          highlight === "warning" && value !== null && "text-warning-foreground"
        )}
      >
        {value === null
          ? "—"
          : isCount
          ? value
          : `${unit ? "±" : ""}${Math.round(value)}${unit}`}
      </div>
    </div>
  );
}
