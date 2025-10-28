import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedLocationSearch from '../map/EnhancedLocationSearch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

export default function PackageDeliveryForm() {
  const { user } = useAuth();
  const [pickupLocation, setPickupLocation] = useState<any>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<any>(null);
  const [packageSize, setPackageSize] = useState('small');
  const [packageDescription, setPackageDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const packageSizes = {
    small: { label: 'Small', price: 5, description: 'Up to 5 lbs' },
    medium: { label: 'Medium', price: 10, description: '5-20 lbs' },
    large: { label: 'Large', price: 20, description: '20-50 lbs' },
    xlarge: { label: 'Extra Large', price: 35, description: '50+ lbs' }
  };

  const handleSubmit = async () => {
    if (!pickupLocation || !deliveryLocation) {
      toast.error('Please select both pickup and delivery locations');
      return;
    }

    if (!packageDescription || !recipientName || !recipientPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('Please sign in to send a package');
      return;
    }

    setSubmitting(true);
    try {
      const deliveryFee = packageSizes[packageSize as keyof typeof packageSizes].price;

      const { error } = await supabase.from('orders').insert({
        customer_id: user.id,
        service_type: 'package_delivery',
        pickup_location: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address
        },
        delivery_location: {
          lat: deliveryLocation.lat,
          lng: deliveryLocation.lng,
          address: deliveryLocation.address
        },
        items: [{
          type: 'package',
          size: packageSize,
          description: packageDescription,
          recipient_name: recipientName,
          recipient_phone: recipientPhone
        }],
        subtotal: deliveryFee,
        delivery_fee: 0,
        total_amount: deliveryFee,
        special_instructions: specialInstructions || null,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Package delivery requested successfully!');
      
      // Reset form
      setPickupLocation(null);
      setDeliveryLocation(null);
      setPackageSize('small');
      setPackageDescription('');
      setRecipientName('');
      setRecipientPhone('');
      setSpecialInstructions('');
    } catch (error) {
      console.error('Error requesting delivery:', error);
      toast.error('Failed to request delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Send a Package
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Pickup Location</Label>
          <EnhancedLocationSearch onLocationSelect={setPickupLocation} />
        </div>

        <div className="space-y-2">
          <Label>Delivery Location</Label>
          <EnhancedLocationSearch onLocationSelect={setDeliveryLocation} />
        </div>

        <div className="space-y-2">
          <Label>Package Size</Label>
          <Select value={packageSize} onValueChange={setPackageSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(packageSizes).map(([key, { label, price, description }]) => (
                <SelectItem key={key} value={key}>
                  {label} - ${price} ({description})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Package Description *</Label>
          <Input
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            placeholder="What's in the package?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Recipient Name *</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Recipient Phone *</Label>
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Phone number"
              type="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Special Instructions (optional)</Label>
          <Textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any special delivery instructions..."
            rows={3}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Cost:</span>
            <span className="text-2xl font-bold text-primary">
              ${packageSizes[packageSize as keyof typeof packageSizes].price}
            </span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!pickupLocation || !deliveryLocation || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Requesting Delivery...' : 'Request Delivery'}
        </Button>
      </CardContent>
    </Card>
  );
}
