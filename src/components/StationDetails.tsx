import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Fuel, 
  Clock, 
  DollarSign, 
  Wifi, 
  Coffee, 
  WashingMachine,
  Store,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Station } from '@/hooks/useStations';
import StationPhotos from './StationPhotos';
import StationReviews from './StationReviews';

interface StationDetailsProps {
  station: Station;
  userLocation?: { lat: number; lng: number };
  onClose?: () => void;
}

const amenityIcons: Record<string, any> = {
  'wifi': Wifi,
  'coffee': Coffee,
  'car_wash': WashingMachine,
  'shop': Store,
  'restroom': Store,
  'atm': DollarSign
};

export default function StationDetails({ station, userLocation, onClose }: StationDetailsProps) {
  const handleShare = async () => {
    const shareData = {
      title: station.name,
      text: `Check out ${station.name} - ${station.address}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${station.name}\n${station.address}\nhttps://www.google.com/maps?q=${station.lat},${station.lng}`);
        toast({
          title: 'Link copied!',
          description: 'Station details copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getDirectionsUrl = () => {
    const dest = `${station.lat},${station.lng}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    return origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  };

  const isOpen = () => {
    if (!station.operating_hours) return null;
    const now = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const hours = station.operating_hours[day];
    
    if (!hours) return null;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const openStatus = isOpen();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="w-full">View Details</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl mb-1">{station.name}</SheetTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {station.address}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleShare} className="w-10 h-10 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={station.status === 'available' ? 'success' : station.status === 'low' ? 'warning' : 'destructive'}>
              <Fuel className="h-3 w-3 mr-1" />
              {station.status === 'available' ? 'Fuel Available' : station.status === 'low' ? 'Low Supply' : 'Out of Fuel'}
            </Badge>
            {station.brand && (
              <Badge variant="outline">{station.brand}</Badge>
            )}
            {openStatus !== null && (
              <Badge variant={openStatus ? 'success' : 'destructive'}>
                <Clock className="h-3 w-3 mr-1" />
                {openStatus ? 'Open' : 'Closed'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="h-12">
              <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4 mr-2" />
                Directions
              </a>
            </Button>
            <Button variant="outline" className="h-12" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Fuel Prices */}
              {station.fuel_prices && Object.keys(station.fuel_prices).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fuel Prices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(station.fuel_prices).map(([type, price]) => (
                      <div key={type} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <span className="capitalize">{type}</span>
                        <span className="font-semibold">K{Number(price).toFixed(2)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Fuel Types */}
              {station.fuel_types && station.fuel_types.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Available Fuel Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {station.fuel_types.map((type) => (
                        <Badge key={type} variant="outline" className="capitalize">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {station.amenities && station.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {station.amenities.map((amenity) => {
                        const Icon = amenityIcons[amenity] || Store;
                        return (
                          <div key={amenity} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{amenity.replace('_', ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Operating Hours */}
              {station.operating_hours && Object.keys(station.operating_hours).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(station.operating_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{day}</span>
                        <span className="text-muted-foreground">
                          {hours.open} - {hours.close}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="photos">
              <StationPhotos 
                photos={station.photos || []} 
                stationName={station.name} 
              />
            </TabsContent>

            <TabsContent value="reviews">
              <StationReviews stationId={station.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
