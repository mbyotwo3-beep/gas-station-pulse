import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ChefHat, Loader2 } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

interface QueueOrder {
  id: string;
  status: string;
  items: any;
  total_amount: number | null;
  special_instructions: string | null;
  created_at: string;
  delivery_location: any;
}

/** Order states a restaurant owner moves through, in order. */
const NEXT_STEP: Record<string, { status: string; label: string }> = {
  pending: { status: 'accepted', label: 'Accept order' },
  accepted: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready_for_pickup', label: 'Ready for pickup' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  picking_up: 'Courier collecting',
  in_transit: 'On the way',
};

export default function RestaurantOrderQueue() {
  const { user } = useAuth();
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, items, total_amount, special_instructions, created_at, delivery_location')
      .in('restaurant_id', ids)
      .in('status', ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picking_up', 'in_transit'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading restaurant orders:', error);
    } else {
      setOrders((data ?? []) as QueueOrder[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.from('restaurants').select('id').eq('owner_id', user.id);
      const ids = (data ?? []).map((r) => r.id);
      setRestaurantIds(ids);
      await fetchOrders(ids);

      if (ids.length > 0) {
        channel = supabase
          .channel('restaurant-order-queue')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () =>
            fetchOrders(ids),
          )
          .subscribe();
      }
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const advance = async (order: QueueOrder) => {
    const step = NEXT_STEP[order.status];
    if (!step) return;
    setBusyId(order.id);
    const { error } = await supabase.from('orders').update({ status: step.status }).eq('id', order.id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not update order', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Order marked "${STATUS_LABELS[step.status] ?? step.status}"` });
    fetchOrders(restaurantIds);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (restaurantIds.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ChefHat className="h-5 w-5" />
          Kitchen queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="No open orders"
            description="New orders from customers will appear here in real time."
          />
        ) : (
          orders.map((order) => {
            const step = NEXT_STEP[order.status];
            const items: any[] = Array.isArray(order.items) ? order.items : [];
            return (
              <div key={order.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.special_instructions && (
                  <p className="text-xs text-muted-foreground">
                    Note: {order.special_instructions}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-semibold">
                    ${Number(order.total_amount ?? 0).toFixed(2)}
                  </span>
                  {step && (
                    <Button size="sm" disabled={busyId === order.id} onClick={() => advance(order)}>
                      {busyId === order.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {step.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
