import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Package, UtensilsCrossed, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';

interface OrderHistoryItem {
  id: string;
  service_type: string;
  status: string;
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  pickup_location: { lat: number; lng: number; address: string };
  delivery_location: { lat: number; lng: number; address: string };
  items: any[];
  special_instructions?: string;
  created_at: string;
  delivered_at?: string;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrderHistory();
    }
  }, [user]);

  const fetchOrderHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .in('status', ['delivered', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching order history:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        pickup_location: item.pickup_location as { lat: number; lng: number; address: string },
        delivery_location: item.delivery_location as { lat: number; lng: number; address: string },
        items: item.items as any[]
      }));
      setOrders(typedData);
    }
    setLoading(false);
  };

  const foodOrders = orders.filter(o => o.service_type === 'food_delivery');
  const packageOrders = orders.filter(o => o.service_type === 'package_delivery');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const OrderCard = ({ order }: { order: OrderHistoryItem }) => {
    const isFood = order.service_type === 'food_delivery';
    
    return (
      <Card className="surface-gradient">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isFood ? (
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              ) : (
                <Package className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium">
                {isFood ? 'Food Order' : 'Package Delivery'}
              </span>
            </div>
            <Badge variant={getStatusVariant(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>

          {order.delivered_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(order.delivered_at), 'MMM d, yyyy h:mm a')}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm truncate">{order.pickup_location?.address || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-sm truncate">{order.delivery_location?.address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Items:</p>
              <div className="space-y-1">
                {order.items.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Delivery</span>
                <span>${order.delivery_fee?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-xl font-bold">{order.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading order history...</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Order History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="food">Food ({foodOrders.length})</TabsTrigger>
            <TabsTrigger value="package">Packages ({packageOrders.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </TabsContent>
          
          <TabsContent value="food" className="space-y-4 mt-4">
            {foodOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No food orders yet</p>
            ) : (
              foodOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
          
          <TabsContent value="package" className="space-y-4 mt-4">
            {packageOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No package deliveries yet</p>
            ) : (
              packageOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
