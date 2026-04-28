/**
 * Shared GPS accuracy classification used across the app.
 * Keeping tiers, labels, hints, and tones in one place ensures the
 * accuracy chip, low-accuracy banner, search-pill badge, and GPS test
 * screen always speak the same language.
 */

export type GpsTier = 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor';
export type GpsTone = 'success' | 'warning' | 'destructive';

export interface GpsQuality {
  tier: GpsTier;
  /** Short label shown in chips and badges. */
  label: string;
  /** Semantic tone — maps to design-system colors. */
  tone: GpsTone;
  /** One-line explanation + suggested action for the user. */
  hint: string;
}

/**
 * Classify a GPS accuracy value (in meters) into a user-facing tier.
 * Thresholds are aligned with Uber/Google Maps guidance:
 *   ≤20m  excellent  ·  ≤50m  good  ·  ≤150m fair  ·  ≤500m poor  ·  >500m very poor
 */
export function classifyGpsAccuracy(accuracyMeters: number): GpsQuality {
  if (accuracyMeters <= 20) {
    return {
      tier: 'excellent',
      label: 'Excellent',
      tone: 'success',
      hint: 'GPS lock is sharp. Position is trustworthy.',
    };
  }
  if (accuracyMeters <= 50) {
    return {
      tier: 'good',
      label: 'Good',
      tone: 'success',
      hint: 'Solid GPS fix. Safe to use for pickups.',
    };
  }
  if (accuracyMeters <= 150) {
    return {
      tier: 'fair',
      label: 'Fair',
      tone: 'warning',
      hint: 'Move outdoors or near a window for a tighter fix.',
    };
  }
  if (accuracyMeters <= 500) {
    return {
      tier: 'poor',
      label: 'Poor',
      tone: 'warning',
      hint: 'Position may be off by a city block. Confirm your address manually.',
    };
  }
  return {
    tier: 'very-poor',
    label: 'Very poor',
    tone: 'destructive',
    hint: 'GPS is unreliable here. Search your address manually for precision.',
  };
}

/**
 * Tailwind class helper for semantic tones. Used by chips, banners,
 * and verdict cards so every accuracy surface matches.
 */
export const gpsToneClasses: Record<GpsTone, { chip: string; banner: string; text: string }> = {
  success: {
    chip: 'bg-success/15 text-success border-success/30',
    banner: 'bg-success/10 border-success/40 text-success',
    text: 'text-success',
  },
  warning: {
    chip: 'bg-warning/15 text-warning-foreground border-warning/40',
    banner: 'bg-warning/10 border-warning/40 text-warning-foreground',
    text: 'text-warning-foreground',
  },
  destructive: {
    chip: 'bg-destructive/15 text-destructive border-destructive/40',
    banner: 'bg-destructive/10 border-destructive/40 text-destructive',
    text: 'text-destructive',
  },
};
