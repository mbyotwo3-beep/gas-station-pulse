import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StationPhotosProps {
  photos: string[];
  stationName: string;
}

export default function StationPhotos({ photos, stationName }: StationPhotosProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-muted/30 rounded-xl">
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No photos available</p>
        </div>
      </div>
    );
  }

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

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted hover:opacity-80 transition-opacity"
          >
            <img
              src={photo}
              alt={`${stationName} - Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen viewer */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
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
              className="max-h-[80vh] max-w-full object-contain rounded-2xl"
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
    </>
  );
}
