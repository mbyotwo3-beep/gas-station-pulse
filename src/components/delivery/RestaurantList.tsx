import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  rating: number;
  delivery_fee: number;
  min_order: number;
  image_url: string;
}

interface RestaurantListProps {
  onSelectRestaurant: (restaurantId: string) => void;
}

export default function RestaurantList({ onSelectRestaurant }: RestaurantListProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading restaurants...</div>;
  }

  if (restaurants.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No restaurants available at the moment
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {restaurants.map((restaurant) => (
        <Card
          key={restaurant.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectRestaurant(restaurant.id)}
        >
          <CardHeader className="p-0">
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-full h-40 object-cover rounded-t-lg"
              />
            )}
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                <p className="text-sm text-muted-foreground">{restaurant.description}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {restaurant.rating}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{restaurant.cuisine_type}</Badge>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${restaurant.delivery_fee} delivery
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                25-35 min
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
