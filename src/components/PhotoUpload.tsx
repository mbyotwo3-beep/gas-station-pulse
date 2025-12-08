import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  bucket: 'station-photos' | 'avatars';
  folder?: string;
  onUploadComplete: (url: string) => void;
  maxSize?: number;
  currentPhoto?: string;
}

export function PhotoUpload({ 
  bucket, 
  folder = '', 
  onUploadComplete, 
  maxSize = 5242880,
  currentPhoto 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${Math.round(maxSize / 1024 / 1024)}MB`,
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      // Use crypto.randomUUID() for secure, unpredictable file names
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadComplete(publicUrl);

      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2"
            onClick={removePhoto}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="mt-2 text-sm text-muted-foreground">Upload</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
      {uploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}
    </div>
  );
}
