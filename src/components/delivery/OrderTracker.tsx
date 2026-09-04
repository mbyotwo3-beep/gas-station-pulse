import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, XCircle, Flag } from 'lucide-react';
import { toast } from 'sonner';
import DeliveryStatusTimeline from './DeliveryStatusTimeline';
import OrderCancelDialog from './OrderCancelDialog';
import OrderDisputeDialog from './OrderDisputeDialog';
import { formatDistanceToNow } from 'date-fns';

interface Order {
  id: string;
  service_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  estimated_delivery_time: string | null;
  pickup_location: any;
  delivery_location: any;
  items: any;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Looking for courier',
  accepted: 'Accepted',
  preparing: 'Being prepared',
  ready_for_pickup: 'Ready for pickup',
  picking_up: 'Picking up your order',
  in_transit: 'On the way',
  delivered: 'Delivered',
};

export default function OrderTracker() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [reportOrderId, setReportOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchActiveOrders();

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        () => fetchActiveOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchActiveOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .in('status', ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picking_up', 'in_transit'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActiveOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading orders...</div>;
  }

  if (activeOrders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Active Orders</h2>
      {activeOrders.map((order) => {
        const placedAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
        return (
          <Card key={order.id} className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {order.service_type === 'food_delivery'
                    ? '🍔 Food Order'
                    : order.service_type === 'package_delivery'
                    ? '📦 Package Delivery'
                    : order.service_type === 'errand'
                    ? '🛍️ Errand'
                    : '🚗 Ride'}
                </CardTitle>
                <Badge variant="default">{STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Placed {placedAgo}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <DeliveryStatusTimeline status={order.status} serviceType={order.service_type} />

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup</p>
                    <p className="text-muted-foreground">{order.pickup_location?.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-muted-foreground">{order.delivery_location?.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold text-primary">${Number(order.total_amount).toFixed(2)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {['pending', 'accepted', 'preparing'].includes(order.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelOrderId(order.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel order
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setReportOrderId(order.id)}>
                  <Flag className="h-4 w-4 mr-1" />
                  Report a problem
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {cancelOrderId && (
        <OrderCancelDialog
          open={!!cancelOrderId}
          onOpenChange={(o) => !o && setCancelOrderId(null)}
          orderId={cancelOrderId}
          onCancelled={fetchActiveOrders}
        />
      )}

      {reportOrderId && (
        <OrderDisputeDialog
          open={!!reportOrderId}
          onOpenChange={(o) => !o && setReportOrderId(null)}
          orderId={reportOrderId}
        />
      )}
    </div>
  );
}
