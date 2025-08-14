import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Filter, MapPin, DollarSign, Clock, Fuel } from 'lucide-react';
import type { FuelStatus } from '@/components/StationCard';

interface FilterOptions {
  status: FuelStatus[];
  maxDistance: number;
  priceRange: [number, number];
  amenities: string[];
  brands: string[];
  operatingHours: 'any' | '24h' | 'open_now';
  sortBy: 'distance' | 'price' | 'rating' | 'updated';
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const defaultFilters: FilterOptions = {
  status: ['available', 'low'],
  maxDistance: 10,
  priceRange: [0, 200],
  amenities: [],
  brands: [],
  operatingHours: 'any',
  sortBy: 'distance'
};

const availableAmenities = [
  'ATM', 'Shop', 'Restroom', 'Car Wash', 'Air Pump', 'Vacuum', 'Food Court', 'WiFi'
];

const popularBrands = [
  'Shell', 'BP', 'Total', 'Mobil', 'Caltex', 'Puma', 'Engen', 'Sasol'
];

export default function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    onClearFilters();
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-2xl">
        <Card className="h-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="overflow-y-auto pb-20">
            <div className="space-y-6">
              {/* Station Status */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Station Status</Label>
                <div className="flex flex-wrap gap-2">
                  {(['available', 'low', 'out'] as FuelStatus[]).map(status => (
                    <Badge
                      key={status}
                      variant={localFilters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => updateFilter('status', toggleArrayItem(localFilters.status, status))}
                    >
                      {status === 'available' ? 'Available' : status === 'low' ? 'Low Supply' : 'Out of Fuel'}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Distance */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Maximum Distance: {localFilters.maxDistance} km
                </Label>
                <Slider
                  value={[localFilters.maxDistance]}
                  onValueChange={([value]) => updateFilter('maxDistance', value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Range: K{localFilters.priceRange[0]} - K{localFilters.priceRange[1]}
                </Label>
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                  max={300}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Operating Hours */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </Label>
                <Select
                  value={localFilters.operatingHours}
                  onValueChange={(value: FilterOptions['operatingHours']) => updateFilter('operatingHours', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Hours</SelectItem>
                    <SelectItem value="open_now">Open Now</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Fuel Brands */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Brands
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {popularBrands.map(brand => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Switch
                        id={`brand-${brand}`}
                        checked={localFilters.brands.includes(brand)}
                        onCheckedChange={() => updateFilter('brands', toggleArrayItem(localFilters.brands, brand))}
                      />
                      <Label htmlFor={`brand-${brand}`} className="text-sm">{brand}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAmenities.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Switch
                        id={`amenity-${amenity}`}
                        checked={localFilters.amenities.includes(amenity)}
                        onCheckedChange={() => updateFilter('amenities', toggleArrayItem(localFilters.amenities, amenity))}
                      />
                      <Label htmlFor={`amenity-${amenity}`} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sort By */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Sort By</Label>
                <Select
                  value={localFilters.sortBy}
                  onValueChange={(value: FilterOptions['sortBy']) => updateFilter('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          {/* Fixed bottom buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClear} className="flex-1">
                Clear All
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}