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
    status: 'available' as 'available' | 'low' | 'out',
    note: ''
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

    if (!formData.name.trim() || !formData.address.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both station name and address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a unique station ID based on name
      const stationId = formData.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      const { error } = await supabase
        .from('station_reports')
        .insert({
          station_id: stationId,
          station_name: formData.name.trim(),
          status: formData.status,
          note: formData.note.trim() || null,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: 'Station added successfully',
        description: `${formData.name} has been added to the map`,
        variant: 'default'
      });

      // Reset form
      setFormData({
        name: '',
        address: '',
        status: 'available',
        note: ''
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