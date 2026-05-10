import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  MapPin,
  Satellite,
  RefreshCw,
  Smartphone,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ExternalLink,
} from 'lucide-react';

interface GpsTroubleshooterProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  accuracy?: number | null;
  reason?: 'denied' | 'unavailable' | 'timeout' | 'low-accuracy' | null;
}

const REASON_COPY: Record<NonNullable<GpsTroubleshooterProps['reason']>, string> = {
  denied: "Location permission was denied. Re-enable it in your browser's site settings.",
  unavailable: "Your device couldn't determine a location right now.",
  timeout: 'GPS is taking longer than expected to lock on.',
  'low-accuracy': 'GPS is connected but the fix is imprecise.',
};

type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking';

function detectPlatform(): 'ios' | 'android' | 'mac' | 'windows' | 'linux' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Macintosh/.test(ua)) return 'mac';
  if (/Windows/.test(ua)) return 'windows';
  if (/Linux/.test(ua)) return 'linux';
  return 'other';
}

function detectBrowser(): 'chrome' | 'safari' | 'firefox' | 'edge' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
  return 'other';
}

function getSettingsGuide(): { label: string; steps: string[]; deepLink?: string } {
  const platform = detectPlatform();
  const browser = detectBrowser();

  if (platform === 'ios') {
    return {
      label: 'iPhone / iPad',
      steps: [
        'Open Settings → Privacy & Security → Location Services (turn ON).',
        `Scroll down and tap ${browser === 'safari' ? 'Safari Websites' : 'your browser app'}.`,
        'Set "Allow Location Access" to "While Using the App" or "Ask Next Time".',
        'Return to this page and tap Retry GPS.',
      ],
    };
  }
  if (platform === 'android') {
    return {
      label: 'Android',
      steps: [
        'Open Settings → Location → turn it ON (use High accuracy / Google Location).',
        'Open Settings → Apps → your browser → Permissions → Location → Allow.',
        'In the browser, tap the lock icon next to the URL → Permissions → Reset / Allow Location.',
        'Return to this page and tap Retry GPS.',
      ],
    };
  }
  if (browser === 'chrome' || browser === 'edge') {
    return {
      label: browser === 'edge' ? 'Microsoft Edge' : 'Google Chrome',
      steps: [
        'Click the lock / tune icon to the left of the address bar.',
        'Set Location to "Allow".',
        'Reload the page, then tap Retry GPS below.',
      ],
      deepLink: browser === 'edge'
        ? 'edge://settings/content/location'
        : 'chrome://settings/content/location',
    };
  }
  if (browser === 'firefox') {
    return {
      label: 'Firefox',
      steps: [
        'Click the lock icon next to the address bar.',
        'Click "Clear permission" next to "Access your location" (or set it to Allow).',
        'Reload the page and tap Retry GPS.',
      ],
      deepLink: 'about:preferences#privacy',
    };
  }
  if (browser === 'safari') {
    return {
      label: 'Safari (Mac)',
      steps: [
        'Open Safari menu → Settings → Websites → Location.',
        'Find this site and set it to Allow.',
        'Reload the page and tap Retry GPS.',
      ],
    };
  }
  return {
    label: 'Browser settings',
    steps: [
      'Open your browser settings → Site permissions → Location.',
      'Find this site and set Location to Allow.',
      'Reload and tap Retry GPS.',
    ],
  };
}

export default function GpsTroubleshooter({
  open,
  onClose,
  onRetry,
  accuracy,
  reason,
}: GpsTroubleshooterProps) {
  const [permission, setPermission] = useState<PermState>('checking');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let permStatus: PermissionStatus | null = null;
    const onChange = () => {
      if (!cancelled && permStatus) setPermission(permStatus.state as PermState);
    };

    (async () => {
      if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
        if (!cancelled) setPermission('unsupported');
        return;
      }
      try {
        permStatus = await (navigator as any).permissions.query({ name: 'geolocation' });
        if (!cancelled && permStatus) {
          setPermission(permStatus.state as PermState);
          permStatus.addEventListener('change', onChange);
        }
      } catch {
        if (!cancelled) setPermission('unsupported');
      }
    })();

    return () => {
      cancelled = true;
      if (permStatus) permStatus.removeEventListener('change', onChange);
    };
  }, [open]);

  const guide = getSettingsGuide();

  const permBadge = (() => {
    switch (permission) {
      case 'granted':
        return (
          <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1">
            <ShieldCheck className="h-3 w-3" /> Permission granted
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" /> Permission denied
          </Badge>
        );
      case 'prompt':
        return (
          <Badge variant="secondary" className="gap-1">
            <ShieldQuestion className="h-3 w-3" /> Will ask on next try
          </Badge>
        );
      case 'unsupported':
        return (
          <Badge variant="outline" className="gap-1">
            <ShieldQuestion className="h-3 w-3" /> Status unknown
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <ShieldQuestion className="h-3 w-3" /> Checking…
          </Badge>
        );
    }
  })();

  const showDeniedGuide = permission === 'denied' || reason === 'denied';

  const steps = [
    {
      icon: MapPin,
      title: 'Allow location access',
      body: "Tap the lock icon in your browser's address bar and set Location to Allow for this site.",
    },
    {
      icon: Smartphone,
      title: 'Enable High Accuracy mode',
      body: 'In your phone Settings → Location, choose High accuracy (uses GPS, Wi-Fi and mobile networks).',
    },
    {
      icon: Satellite,
      title: 'Step outside',
      body: 'GPS signals are blocked indoors and by tall buildings. Move to an open area with a clear sky view.',
    },
    {
      icon: Wifi,
      title: 'Toggle Wi-Fi & Airplane mode',
      body: 'Briefly turn Airplane mode on then off — this forces a fresh fix and clears stale Wi-Fi-based estimates.',
    },
    {
      icon: RefreshCw,
      title: 'Retry',
      body: 'After the steps above, tap Retry. The first lock outdoors usually takes 10–30 seconds.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trouble locking on GPS</DialogTitle>
          <DialogDescription>
            {reason ? REASON_COPY[reason] : 'Try these steps to get an accurate fix.'}
            {typeof accuracy === 'number' && (
              <span className="block mt-1 text-xs">Current accuracy: ±{Math.round(accuracy)}m</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Permission status */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div>
            <p className="text-sm font-medium">Browser location permission</p>
            <p className="text-xs text-muted-foreground">{guide.label}</p>
          </div>
          {permBadge}
        </div>

        {/* Denied: deep guide */}
        {showDeniedGuide && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-destructive">
              Re-enable location for this site
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-foreground/90">
              {guide.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {guide.deepLink && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Browsers block programmatic navigation to chrome:// / edge:// — copy instead.
                  navigator.clipboard?.writeText(guide.deepLink!);
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Copy settings URL ({guide.deepLink})
              </Button>
            )}
          </div>
        )}

        {/* Granted but low accuracy: positive confirmation */}
        {permission === 'granted' && !showDeniedGuide && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-3">
            <p className="text-sm">
              <ShieldCheck className="h-4 w-4 inline mr-1 text-green-600" />
              Permission is granted. The steps below will help improve accuracy.
            </p>
          </div>
        )}

        <ol className="space-y-3 mt-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span> {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Got it
          </Button>
          {onRetry && (
            <Button
              className="flex-1"
              onClick={() => {
                onRetry();
                onClose();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Retry GPS
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
