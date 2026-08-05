import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const REQUIRED_DOC_TYPES = [
  'national_id',
  'drivers_license',
  'vehicle_registration',
  'selfie',
  'police_clearance',
] as const;

export const DOC_LABELS: Record<string, string> = {
  national_id: 'National ID (NRC or passport)',
  drivers_license: "Driver's licence",
  vehicle_registration: 'Vehicle registration (white book)',
  selfie: 'Selfie holding your ID',
  police_clearance: 'Police clearance certificate',
  insurance: 'Vehicle insurance (optional)',
};

export interface DriverDocument {
  id: string;
  driver_id: string;
  doc_type: string;
  file_path: string;
  expires_on: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
}

export function useDriverDocuments(driverId?: string | null) {
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!driverId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error loading driver documents:', error.message);
    setDocuments((data as DriverDocument[]) ?? []);
    setLoading(false);
  }, [driverId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (docType: string, file: File, expiresOn?: string) => {
      if (!driverId) throw new Error('Not signed in');
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${driverId}/${docType}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('driver_documents').upsert(
        {
          driver_id: driverId,
          doc_type: docType,
          file_path: path,
          expires_on: expiresOn || null,
          status: 'pending',
          review_notes: null,
        },
        { onConflict: 'driver_id,doc_type' },
      );
      if (error) throw error;
      await fetchDocuments();
    },
    [driverId, fetchDocuments],
  );

  const getSignedUrl = useCallback(async (path: string) => {
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  const missingTypes = REQUIRED_DOC_TYPES.filter(
    (t) =>
      !documents.some(
        (d) =>
          d.doc_type === t &&
          d.status === 'approved' &&
          (!d.expires_on || new Date(d.expires_on) > new Date()),
      ),
  );

  return { documents, loading, uploadDocument, getSignedUrl, refresh: fetchDocuments, missingTypes };
}
