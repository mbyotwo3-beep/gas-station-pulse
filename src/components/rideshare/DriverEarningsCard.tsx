import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet } from 'lucide-react';

interface EarningRow {
  id: string;
  amount: number;
  gross_amount: number | null;
  commission_amount: number;
  commission_rate: number;
  type: string;
  created_at: string;
}

export default function DriverEarningsCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<EarningRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('driver_earnings')
      .select('id, amount, gross_amount, commission_amount, commission_rate, type, created_at')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) {
          console.error('Earnings load failed:', error.message);
          return;
        }
        setRows((data as EarningRow[]) ?? []);
      });
  }, [user]);

  const gross = rows.reduce((s, r) => s + Number(r.gross_amount ?? r.amount), 0);
  const commission = rows.reduce((s, r) => s + Number(r.commission_amount ?? 0), 0);
  const net = rows.reduce((s, r) => s + Number(r.amount), 0);
  const fmt = (n: number) => `K${n.toFixed(2)}`;

  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5" />
          Earnings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The platform keeps a 6% commission on each completed job. The rest is yours.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{fmt(gross)}</div>
            <div className="text-xs text-muted-foreground">Gross</div>
          </div>
          <div>
            <div className="text-xl font-bold">-{fmt(commission)}</div>
            <div className="text-xs text-muted-foreground">Commission (6%)</div>
          </div>
          <div>
            <div className="text-xl font-bold text-success">{fmt(net)}</div>
            <div className="text-xs text-muted-foreground">Paid to you</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No earnings yet</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium capitalize">{r.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmt(Number(r.amount))}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(Number(r.gross_amount ?? r.amount))} − {fmt(Number(r.commission_amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
