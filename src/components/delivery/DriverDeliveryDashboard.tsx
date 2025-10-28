import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, UtensilsCrossed, Navigation, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: string;
  service_type: string;
  pickup_location: any;
  delivery_location: any;
  total_amount: number;
  items: any;
  special_instructions: string;
  status: string;
  created_at: string;
}

interface Earnings {
  total: number;
  pending: number;
  paid: number;
}

export default function DriverDeliveryDashboard() {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [earnings, setEarnings] = useState<Earnings>({ total: 0, pending: 0, paid: 0 });
  const [accepting, setAccepting] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
    fetchActiveDelivery();
    fetchEarnings();

    const channel = supabase
      .channel('delivery-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.pending'
        },
        () => {
          fetchAvailableOrders();
          toast.info('New delivery available!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvailableOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .in('service_type', ['food_delivery', 'package_delivery'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) setAvailableOrders(data);
  };

  const fetchActiveDelivery = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['accepted', 'picking_up', 'in_transit'])
      .single();

    if (!error && data) setActiveDelivery(data);
  };

  const fetchEarnings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('driver_earnings')
      .select('amount, status')
      .eq('driver_id', user.id);

    if (!error && data) {
      const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
      const pending = data.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
      const paid = data.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0);
      setEarnings({ total, pending, paid });
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!user) return;

    setAccepting(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: user.id, 
          status: 'accepted' 
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order accepted!');
      fetchAvailableOrders();
      fetchActiveDelivery();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    } finally {
      setAccepting(null);
    }
  };

  const updateDeliveryStatus = async (newStatus: string) => {
    if (!activeDelivery) return;

    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'picking_up') {
        updates.picked_up_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
        
        // Create earnings record
        const driverEarning = Number(activeDelivery.total_amount) * 0.75;
        await supabase.from('driver_earnings').insert({
          driver_id: user!.id,
          order_id: activeDelivery.id,
          amount: driverEarning,
          service_type: activeDelivery.service_type as any,
          status: 'pending'
        });
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', activeDelivery.id);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      
      if (newStatus === 'delivered') {
        setActiveDelivery(null);
        fetchEarnings();
      } else {
        fetchActiveDelivery();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Tabs defaultValue="deliveries" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        <TabsTrigger value="earnings">Earnings</TabsTrigger>
      </TabsList>

      <TabsContent value="deliveries" className="space-y-4">
        {activeDelivery && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeDelivery.service_type === 'food_delivery' ? (
                  <><UtensilsCrossed className="h-5 w-5" /> Active Food Delivery</>
                ) : (
                  <><Package className="h-5 w-5" /> Active Package Delivery</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-sm">Pickup</p>
                    <p className="text-sm text-muted-foreground">{activeDelivery.pickup_location.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-destructive mt-1" />
                  <div>
                    <p className="font-medium text-sm">Delivery</p>
                    <p className="text-sm text-muted-foreground">{activeDelivery.delivery_location.address}</p>
                  </div>
                </div>
              </div>

              {activeDelivery.special_instructions && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Instructions:</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.special_instructions}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Earnings:</span>
                <span className="text-xl font-bold text-success">
                  ${(Number(activeDelivery.total_amount) * 0.75).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                {activeDelivery.status === 'accepted' && (
                  <Button onClick={() => updateDeliveryStatus('picking_up')} disabled={updating} className="flex-1">
                    Start Pickup
                  </Button>
                )}
                {activeDelivery.status === 'picking_up' && (
                  <Button onClick={() => updateDeliveryStatus('in_transit')} disabled={updating} className="flex-1">
                    Start Delivery
                  </Button>
                )}
                {activeDelivery.status === 'in_transit' && (
                  <Button onClick={() => updateDeliveryStatus('delivered')} disabled={updating} variant="success" className="flex-1">
                    Complete Delivery
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available Deliveries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No deliveries available</p>
            ) : (
              availableOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {order.service_type === 'food_delivery' ? '🍔 Food' : '📦 Package'}
                      </Badge>
                      <span className="font-semibold text-success">
                        +${(Number(order.total_amount) * 0.75).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">From: {order.pickup_location.address}</p>
                      <p className="text-muted-foreground">To: {order.delivery_location.address}</p>
                    </div>
                    <Button
                      onClick={() => acceptOrder(order.id)}
                      disabled={accepting === order.id || !!activeDelivery}
                      className="w-full"
                    >
                      {accepting === order.id ? 'Accepting...' : 'Accept Delivery'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="earnings" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-success">${earnings.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-warning mb-2" />
              <p className="text-2xl font-bold">${earnings.pending.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold text-success">${earnings.paid.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Paid Out</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
