ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS actual_distance numeric,
  ADD COLUMN IF NOT EXISTS actual_duration integer,
  ADD COLUMN IF NOT EXISTS final_fare numeric,
  ADD COLUMN IF NOT EXISTS fare_breakdown jsonb;