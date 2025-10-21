import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { PhotoUpload } from './PhotoUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StationPhotosProps {
  photos: string[];
  stationName: string;
  stationId?: string;
}

export default function StationPhotos({ photos, stationName, stationId }: StationPhotosProps) {
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUploaded = async (url: string) => {
    if (!stationId) {
      toast({ title: 'Error', description: 'Station ID is required', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      // Fetch current station data
      const { data: station, error: fetchError } = await supabase
        .from('stations')
        .select('photos')
        .eq('id', stationId)
        .single();

      if (fetchError) throw fetchError;

      // Add new photo to array
      const updatedPhotos = [...(station.photos || []), url];

      // Update station with new photos array
      const { error: updateError } = await supabase
        .from('stations')
        .update({ photos: updatedPhotos })
        .eq('id', stationId);

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Photo added to station!' });
      setShowUpload(false);
      
      // Force page reload to show new photo
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding photo:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add photo', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Camera className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No photos yet</p>
          {user && stationId && (
            <>
              <Button onClick={() => setShowUpload(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              
              <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Station Photo</DialogTitle>
                  </DialogHeader>
                  <PhotoUpload
                    bucket="station-photos"
                    folder={stationId}
                    onUploadComplete={handlePhotoUploaded}
                    maxSize={5242880}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Station Photos ({photos.length})</h3>
          {user && stationId && (
            <Button onClick={() => setShowUpload(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-80 transition-all hover:scale-105"
            >
              <img
                src={photo}
                alt={`${stationName} - Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIndex(null)}
              className="rounded-full w-10 h-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center h-full p-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevious}
              disabled={selectedIndex === 0}
              className="absolute left-4 rounded-full w-10 h-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <img
              src={photos[selectedIndex]}
              alt={`${stationName} - Photo ${selectedIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-elegant"
            />

            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              disabled={selectedIndex === photos.length - 1}
              className="absolute right-4 rounded-full w-10 h-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-sm text-muted-foreground">
              {selectedIndex + 1} / {photos.length}
            </span>
          </div>
        </div>
      )}

      {/* Upload dialog */}
      {showUpload && (
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Station Photo</DialogTitle>
            </DialogHeader>
            <PhotoUpload
              bucket="station-photos"
              folder={stationId || 'general'}
              onUploadComplete={handlePhotoUploaded}
              maxSize={5242880}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
