import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

interface Dispute {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  reporter_id: string;
  subject_id: string;
  kind: 'ride' | 'order';
}

const STATUSES = ['open', 'investigating', 'resolved', 'rejected'] as const;

export default function DisputeReviewPanel() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    try {
      const [rides, orders] = await Promise.all([
        supabase.from('ride_disputes').select('*').order('created_at', { ascending: false }),
        supabase.from('order_disputes').select('*').order('created_at', { ascending: false }),
      ]);
      if (rides.error) throw rides.error;
      if (orders.error) throw orders.error;

      const mapped: Dispute[] = [
        ...(rides.data ?? []).map((d: any) => ({ ...d, subject_id: d.ride_id, kind: 'ride' as const })),
        ...(orders.data ?? []).map((d: any) => ({ ...d, subject_id: d.order_id, kind: 'order' as const })),
      ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setDisputes(mapped);
    } catch (e) {
      console.error('Error loading disputes:', e);
      toast({ title: 'Error', description: 'Failed to load disputes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
    const channel = supabase
      .channel('admin-disputes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_disputes' }, fetchDisputes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_disputes' }, fetchDisputes)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDisputes]);

  const setStatus = async (dispute: Dispute, status: string) => {
    const table = dispute.kind === 'ride' ? 'ride_disputes' : 'order_disputes';
    const { error } = await supabase.from(table).update({ status }).eq('id', dispute.id);
    if (error) {
      toast({ title: 'Update blocked', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Dispute marked ${status}` });
    fetchDisputes();
  };

  const render = (list: Dispute[]) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="No disputes"
          description="Nothing to review right now."
        />
      );
    }
    return (
      <div className="space-y-3">
        {list.map((d) => (
          <Card key={`${d.kind}-${d.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base capitalize">
                    {d.category.replace(/_/g, ' ')}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.kind === 'ride' ? 'Ride' : 'Order'} {d.subject_id.slice(0, 8)} ·{' '}
                    {new Date(d.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={
                    d.status === 'resolved'
                      ? 'default'
                      : d.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {d.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{d.description}</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== d.status).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === 'resolved' ? 'default' : 'outline'}
                    onClick={() => setStatus(d, s)}
                  >
                    Mark {s}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-center text-muted-foreground py-6">Loading disputes...</div>;

  const open = disputes.filter((d) => d.status === 'open' || d.status === 'investigating');

  return (
    <Tabs defaultValue="open" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
        <TabsTrigger value="all">All ({disputes.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="open">{render(open)}</TabsContent>
      <TabsContent value="all">{render(disputes)}</TabsContent>
    </Tabs>
  );
}
