import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import RestaurantList from './RestaurantList';
import MenuView from './MenuView';
import OrderHistory from './OrderHistory';
import EnhancedLocationSearch from '../map/EnhancedLocationSearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function FoodDeliveryDashboard() {
  const { user } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<any>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = (items: CartItem[], restaurantId: string) => {
    setCheckoutItems(items);
    setSelectedRestaurant(restaurantId);
    setShowCheckout(true);
  };

  const handlePlaceOrder = async () => {
    if (!deliveryLocation) {
      toast.error('Please select a delivery location');
      return;
    }

    if (!user) {
      toast.error('Please sign in to place an order');
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = 5.00;
      const total = subtotal + deliveryFee;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('location, address')
        .eq('id', selectedRestaurant)
        .single();

      const { error } = await supabase.from('orders').insert({
        customer_id: user.id,
        restaurant_id: selectedRestaurant,
        service_type: 'food_delivery',
        pickup_location: restaurantData?.location || {},
        delivery_location: {
          lat: deliveryLocation.lat,
          lng: deliveryLocation.lng,
          address: deliveryLocation.address
        },
        items: checkoutItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        special_instructions: specialInstructions || null,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Order placed successfully!');
      setShowCheckout(false);
      setSelectedRestaurant(null);
      setCheckoutItems([]);
      setDeliveryLocation(null);
      setSpecialInstructions('');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (showCheckout) {
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.00;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Order Summary</h3>
            {checkoutItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg mt-2">
                <span>Total</span>
                <span className="text-primary">${(subtotal + deliveryFee).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Delivery Location</Label>
            <EnhancedLocationSearch onLocationSelect={setDeliveryLocation} />
          </div>

          <div className="space-y-2">
            <Label>Special Instructions (optional)</Label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Add delivery instructions, allergies, etc."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handlePlaceOrder} 
              disabled={!deliveryLocation || submitting}
              className="flex-1"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedRestaurant) {
    return (
      <MenuView
        restaurantId={selectedRestaurant}
        onBack={() => setSelectedRestaurant(null)}
        onCheckout={handleCheckout}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Food</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantList onSelectRestaurant={setSelectedRestaurant} />
        </CardContent>
      </Card>
      <OrderHistory />
    </div>
  );
}
