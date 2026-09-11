import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Wallet } from 'lucide-react';

interface DriverRow {
  driverId: string;
  name: string;
  gross: number;
  commission: number;
  net: number;
  jobs: number;
  pending: number;
}

const fmt = (n: number) => `K${Number(n ?? 0).toFixed(2)}`;

/** Per-driver earnings roll-up for admins. */
export default function DriverEarningsOverview() {
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('driver_earnings')
        .select('driver_id, amount, gross_amount, commission_amount, status');
      if (error) {
        console.error('Earnings load failed:', error.message);
        setLoading(false);
        return;
      }

      const ids = Array.from(new Set((data ?? []).map((e) => e.driver_id)));
      const { data: profiles } = ids.length
        ? await supabase.from('profiles').select('id, display_name, email').in('id', ids)
        : { data: [] as any[] };

      const byDriver = new Map<string, DriverRow>();
      (data ?? []).forEach((e) => {
        const profile = profiles?.find((p: any) => p.id === e.driver_id);
        const row =
          byDriver.get(e.driver_id) ??
          {
            driverId: e.driver_id,
            name: profile?.display_name || profile?.email || 'Driver',
            gross: 0,
            commission: 0,
            net: 0,
            jobs: 0,
            pending: 0,
          };
        row.gross += Number(e.gross_amount ?? e.amount ?? 0);
        row.commission += Number(e.commission_amount ?? 0);
        row.net += Number(e.amount ?? 0);
        row.jobs += 1;
        if (e.status === 'pending') row.pending += Number(e.amount ?? 0);
        byDriver.set(e.driver_id, row);
      });

      setRows(Array.from(byDriver.values()).sort((a, b) => b.net - a.net));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5" />
          Driver earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading earnings...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.driverId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.jobs} jobs · gross {fmt(r.gross)} · commission {fmt(r.commission)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.pending > 0 && <Badge variant="secondary">{fmt(r.pending)} pending</Badge>}
                  <span className="font-semibold">{fmt(r.net)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
