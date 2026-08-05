import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

interface Revenue {
  total_gross: number;
  total_commission: number;
  total_payouts: number;
  jobs: number;
}

export default function PlatformRevenueCard() {
  const [revenue, setRevenue] = useState<Revenue | null>(null);

  useEffect(() => {
    supabase.rpc('get_platform_revenue').then(({ data, error }) => {
      if (error) {
        console.error('Revenue load failed:', error.message);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setRevenue(row as unknown as Revenue);
    });
  }, []);

  const fmt = (n: number) => `K${Number(n ?? 0).toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5" />
          Platform revenue (last 30 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Gross billed</p>
          <p className="text-lg font-semibold">{fmt(revenue?.total_gross ?? 0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Commission (6%)</p>
          <p className="text-lg font-semibold">{fmt(revenue?.total_commission ?? 0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Driver payouts</p>
          <p className="text-lg font-semibold">{fmt(revenue?.total_payouts ?? 0)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Completed jobs</p>
          <p className="text-lg font-semibold">{revenue?.jobs ?? 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}
