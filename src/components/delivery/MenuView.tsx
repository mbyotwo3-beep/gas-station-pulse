import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
  preparation_time: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuViewProps {
  restaurantId: string;
  onBack: () => void;
  onCheckout: (items: CartItem[], restaurantId: string) => void;
}

export default function MenuView({ restaurantId, onBack, onCheckout }: MenuViewProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, [restaurantId]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => 
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading menu...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Restaurants
        </Button>
        {cart.length > 0 && (
          <Badge variant="default" className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </Badge>
        )}
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-semibold text-lg mb-3">{category}</h3>
          <div className="space-y-3">
            {items.map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">${item.price}</span>
                          {quantity === 0 ? (
                            <Button size="sm" onClick={() => addToCart(item)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-semibold">{quantity}</span>
                              <Button size="sm" onClick={() => addToCart(item)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <Card className="sticky bottom-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold text-primary">${getTotalAmount().toFixed(2)}</span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => onCheckout(cart, restaurantId)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Checkout ({cart.length} items)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
