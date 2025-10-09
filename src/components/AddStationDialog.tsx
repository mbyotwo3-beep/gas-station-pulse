import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, MapPin, Building, Fuel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AddStationDialogProps {
  onStationAdded?: () => void;
}

export default function AddStationDialog({ onStationAdded }: AddStationDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    brand: '',
    status: 'available' as 'available' | 'low' | 'out',
    note: '',
    photos: [] as string[],
    photoInput: '',
    fuelPrices: { petrol: '', diesel: '', premium: '' },
    fuelTypes: [] as string[],
    amenities: [] as string[],
    operatingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:00', close: '22:00' },
      sunday: { open: '06:00', close: '22:00' }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add a station',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name.trim() || !formData.address.trim() || !formData.lat || !formData.lng) {
      toast({
        title: 'Missing information',
        description: 'Please provide station name, address, and coordinates',
        variant: 'destructive'
      });
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Invalid coordinates',
        description: 'Please provide valid latitude and longitude values',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a unique station ID based on name
      const stationId = formData.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-') + '-' + Date.now();

      // Prepare fuel prices
      const fuelPrices: Record<string, number> = {};
      if (formData.fuelPrices.petrol) fuelPrices.petrol = parseFloat(formData.fuelPrices.petrol);
      if (formData.fuelPrices.diesel) fuelPrices.diesel = parseFloat(formData.fuelPrices.diesel);
      if (formData.fuelPrices.premium) fuelPrices.premium = parseFloat(formData.fuelPrices.premium);

      // First, create the station
      const { error: stationError } = await supabase
        .from('stations')
        .insert({
          id: stationId,
          name: formData.name.trim(),
          address: formData.address.trim(),
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          brand: formData.brand.trim() || null,
          photos: formData.photos.length > 0 ? formData.photos : null,
          fuel_prices: Object.keys(fuelPrices).length > 0 ? fuelPrices : null,
          fuel_types: formData.fuelTypes.length > 0 ? formData.fuelTypes : null,
          amenities: formData.amenities.length > 0 ? formData.amenities : null,
          operating_hours: formData.operatingHours,
          created_by: user.id
        });

      if (stationError) throw stationError;

      // Then create an initial status report
      const { error: reportError } = await supabase
        .from('station_reports')
        .insert({
          station_id: stationId,
          station_name: formData.name.trim(),
          status: formData.status,
          note: formData.note.trim() || null,
          user_id: user.id
        });

      if (reportError) throw reportError;

      toast({
        title: 'Station added successfully',
        description: `${formData.name} has been added to the map`,
        variant: 'default'
      });

      // Reset form
      setFormData({
        name: '',
        address: '',
        lat: '',
        lng: '',
        brand: '',
        status: 'available',
        note: '',
        photos: [],
        photoInput: '',
        fuelPrices: { petrol: '', diesel: '', premium: '' },
        fuelTypes: [],
        amenities: [],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '06:00', close: '22:00' },
          sunday: { open: '06:00', close: '22:00' }
        }
      });
      
      setOpen(false);
      onStationAdded?.();
    } catch (error) {
      console.error('Error adding station:', error);
      toast({
        title: 'Error',
        description: 'Failed to add station. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Station
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Add New Fuel Station
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Station Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Station Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Shell Cairo Road, BP Woodlands"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address *
            </Label>
            <Input
              id="address"
              placeholder="e.g., Cairo Road, Lusaka"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">
                Latitude *
              </Label>
              <Input
                id="lat"
                type="number"
                step="any"
                placeholder="-15.4067"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">
                Longitude *
              </Label>
              <Input
                id="lng"
                type="number"
                step="any"
                placeholder="28.2871"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Use Google Maps to find coordinates
          </p>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">
              Brand (Optional)
            </Label>
            <Input
              id="brand"
              placeholder="e.g., Shell, BP, Total, Puma"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
            />
          </div>

          {/* Initial Status */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Current Status</Label>
            
            <RadioGroup 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="available" id="new-available" />
                <Label htmlFor="new-available" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span>Available</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="low" id="new-low" />
                <Label htmlFor="new-low" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-warning rounded-full" />
                  <span>Low Supply</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="out" id="new-out" />
                <Label htmlFor="new-out" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span>Out of Fuel</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="new-note">Additional Notes (Optional)</Label>
            <Textarea
              id="new-note"
              placeholder="Any additional information about this station..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Photo URLs */}
          <div className="space-y-2">
            <Label htmlFor="photo-input">Photo URLs (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="photo-input"
                placeholder="Enter photo URL..."
                value={formData.photoInput}
                onChange={(e) => setFormData(prev => ({ ...prev, photoInput: e.target.value }))}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (formData.photoInput.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      photos: [...prev.photos, prev.photoInput.trim()],
                      photoInput: ''
                    }));
                  }
                }}
              >
                Add
              </Button>
            </div>
            {formData.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.photos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img src={photo} alt="" className="w-16 h-16 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, idx) => idx !== i)
                      }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fuel Prices */}
          <div className="space-y-2">
            <Label>Fuel Prices (K/Liter, Optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Petrol"
                value={formData.fuelPrices.petrol}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  fuelPrices: { ...prev.fuelPrices, petrol: e.target.value }
                }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Diesel"
                value={formData.fuelPrices.diesel}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  fuelPrices: { ...prev.fuelPrices, diesel: e.target.value }
                }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Premium"
                value={formData.fuelPrices.premium}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  fuelPrices: { ...prev.fuelPrices, premium: e.target.value }
                }))}
              />
            </div>
          </div>

          {/* Fuel Types */}
          <div className="space-y-2">
            <Label>Fuel Types Available</Label>
            <div className="flex flex-wrap gap-2">
              {['petrol', 'diesel', 'premium', 'lpg', 'electric'].map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={formData.fuelTypes.includes(type) ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      fuelTypes: prev.fuelTypes.includes(type)
                        ? prev.fuelTypes.filter(t => t !== type)
                        : [...prev.fuelTypes, type]
                    }));
                  }}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {['wifi', 'coffee', 'car_wash', 'shop', 'restroom', 'atm'].map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  size="sm"
                  variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      amenities: prev.amenities.includes(amenity)
                        ? prev.amenities.filter(a => a !== amenity)
                        : [...prev.amenities, amenity]
                    }));
                  }}
                  className="capitalize text-xs"
                >
                  {amenity.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Adding Station...' : 'Add Station'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}