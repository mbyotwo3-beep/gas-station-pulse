import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, CheckCircle, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  service_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  estimated_delivery_time: string;
  pickup_location: any;
  delivery_location: any;
  items: any;
}

export default function OrderTracker() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
          filter: `customer_id=eq.${user.id}`
        },
        () => {
          fetchActiveOrders();
        }
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
        .in('status', ['pending', 'accepted', 'picking_up', 'in_transit'])
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'picking_up':
        return <Package className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'picking_up':
      case 'in_transit':
        return 'default';
      default:
        return 'secondary';
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
      {activeOrders.map((order) => (
        <Card key={order.id} className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {order.service_type === 'food_delivery' ? '🍔 Food Order' :
                 order.service_type === 'package_delivery' ? '📦 Package Delivery' : '🚗 Ride'}
              </CardTitle>
              <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-muted-foreground">{order.pickup_location.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-muted-foreground">{order.delivery_location.address}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-semibold text-primary">${order.total_amount}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
