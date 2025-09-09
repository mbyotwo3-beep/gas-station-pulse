import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Fuel, Clock, MapPin, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Station } from '@/hooks/useStations';

interface StationReportDialogProps {
  station: Station;
  children: React.ReactNode;
  onReportSubmitted?: () => void;
}

export default function StationReportDialog({ 
  station, 
  children, 
  onReportSubmitted 
}: StationReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'available' | 'low' | 'out'>(station.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to report station status',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('station_reports')
        .insert({
          station_id: station.id,
          station_name: station.name,
          status,
          note: note.trim() || null,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: `Status updated to ${status}`,
        variant: 'default'
      });

      setOpen(false);
      setNote('');
      onReportSubmitted?.();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-success';
      case 'low': return 'text-warning';
      case 'out': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            {station.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Station Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {station.address}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge 
                  variant={station.status === 'available' ? 'default' : station.status === 'low' ? 'secondary' : 'destructive'}
                  className={getStatusColor(station.status)}
                >
                  {station.status === 'available' ? 'Available' : station.status === 'low' ? 'Low Supply' : 'Out of Fuel'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatLastUpdated(station.lastUpdated)}
              </div>
            </div>
          </div>

          {/* Report Form */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Update Status</Label>
            
            <RadioGroup 
              value={status} 
              onValueChange={(value) => setStatus(value as any)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full" />
                  <span className="font-medium">Available</span>
                  <span className="text-sm text-muted-foreground">Fuel is available</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded-full" />
                  <span className="font-medium">Low Supply</span>
                  <span className="text-sm text-muted-foreground">Limited fuel available</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="out" id="out" />
                <Label htmlFor="out" className="flex-1 cursor-pointer flex items-center gap-2">
                  <div className="w-3 h-3 bg-destructive rounded-full" />
                  <span className="font-medium">Out of Fuel</span>
                  <span className="text-sm text-muted-foreground">No fuel available</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="note" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Add any additional information about the station..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitReport}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}