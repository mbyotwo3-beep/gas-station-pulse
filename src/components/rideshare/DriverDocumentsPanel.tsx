import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDriverDocuments,
  REQUIRED_DOC_TYPES,
  DOC_LABELS,
} from '@/hooks/useDriverDocuments';
import { ShieldCheck, Upload, Clock, CheckCircle2, XCircle } from 'lucide-react';

const ALL_TYPES = [...REQUIRED_DOC_TYPES, 'insurance'] as const;

export default function DriverDocumentsPanel() {
  const { user } = useAuth();
  const { documents, loading, uploadDocument, missingTypes } = useDriverDocuments(user?.id);
  const [busyType, setBusyType] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (docType: string, file?: File | null) => {
    if (!file) return;
    setBusyType(docType);
    try {
      await uploadDocument(docType, file, expiry[docType]);
      toast({ title: 'Document uploaded', description: 'It will be reviewed by our team.' });
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBusyType(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading documents…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5" />
          Verification documents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every driver is vetted before taking passengers or packages. All five required documents
          must be approved before you can go online.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {missingTypes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {missingTypes.length} required document{missingTypes.length > 1 ? 's' : ''} still
            outstanding.
          </p>
        )}

        {ALL_TYPES.map((type) => {
          const doc = documents.find((d) => d.doc_type === type);
          const expired = doc?.expires_on ? new Date(doc.expires_on) <= new Date() : false;
          return (
            <div key={type} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{DOC_LABELS[type]}</span>
                {doc ? (
                  <Badge
                    variant={
                      expired || doc.status === 'rejected'
                        ? 'destructive'
                        : doc.status === 'approved'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {expired ? (
                      <XCircle className="h-3 w-3 mr-1" />
                    ) : doc.status === 'approved' ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : doc.status === 'rejected' ? (
                      <XCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {expired ? 'expired' : doc.status}
                  </Badge>
                ) : (
                  <Badge variant="outline">not uploaded</Badge>
                )}
              </div>

              {doc?.review_notes && (
                <p className="text-xs text-destructive">Reviewer note: {doc.review_notes}</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`expiry-${type}`} className="text-xs text-muted-foreground">
                    Expiry date (if any)
                  </Label>
                  <Input
                    id={`expiry-${type}`}
                    type="date"
                    value={expiry[type] ?? doc?.expires_on ?? ''}
                    onChange={(e) => setExpiry((p) => ({ ...p, [type]: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <input
                    ref={(el) => (inputsRef.current[type] = el)}
                    id={`file-${type}`}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile(type, e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busyType === type}
                    onClick={() => inputsRef.current[type]?.click()}
                    aria-label={`Upload ${DOC_LABELS[type]}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {busyType === type ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
