import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { DOC_LABELS, type DriverDocument } from '@/hooks/useDriverDocuments';
import { CheckCircle, XCircle, Clock, Car, User, Eye, Ban, ShieldAlert } from 'lucide-react';

interface PendingDriver {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  license_plate?: string | null;
  verification_status: string;
  is_suspended: boolean;
  created_at: string;
  profiles?: { display_name?: string | null; email?: string | null };
}

export default function DriverVerificationPanel() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [docsByDriver, setDocsByDriver] = useState<Record<string, DriverDocument[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchDrivers = useCallback(async () => {
    try {
      const { data: driversData, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = (driversData ?? []).map((d) => d.user_id);
      const [{ data: profilesData }, { data: docsData }] = await Promise.all([
        supabase.from('profiles').select('id, display_name, email').in('id', userIds),
        supabase.from('driver_documents').select('*').in('driver_id', userIds),
      ]);

      const grouped: Record<string, DriverDocument[]> = {};
      (docsData as DriverDocument[] | null)?.forEach((d) => {
        grouped[d.driver_id] = [...(grouped[d.driver_id] ?? []), d];
      });
      setDocsByDriver(grouped);

      setDrivers(
        (driversData ?? []).map((driver) => ({
          ...driver,
          profiles: profilesData?.find((p) => p.id === driver.user_id),
        })) as PendingDriver[],
      );
    } catch (e) {
      console.error('Error fetching drivers:', e);
      toast({
        title: 'Error',
        description: 'Failed to load driver applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const channel = supabase
      .channel('driver-verifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_profiles' }, () =>
        fetchDrivers(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_documents' }, () =>
        fetchDrivers(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDrivers]);

  const viewDocument = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(path, 300);
    if (error || !data) {
      toast({ title: 'Could not open document', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const reviewDocument = async (docId: string, status: 'approved' | 'rejected', note?: string) => {
    const { error } = await supabase
      .from('driver_documents')
      .update({ status, review_notes: note || null, reviewed_at: new Date().toISOString() })
      .eq('id', docId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Document ${status}` });
    fetchDrivers();
  };

  const setVerification = async (
    driverUserId: string,
    status: 'approved' | 'rejected' | 'suspended',
  ) => {
    const { error } = await supabase.rpc('set_driver_verification', {
      p_driver_id: driverUserId,
      p_status: status,
      p_reason: notes[driverUserId] || null,
    });
    if (error) {
      toast({ title: 'Action blocked', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Driver ${status}` });
    setNotes((p) => ({ ...p, [driverUserId]: '' }));
    fetchDrivers();
  };

  if (loading) return <div className="text-center text-muted-foreground">Loading...</div>;

  const pendingCount = drivers.filter((d) => d.verification_status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          Driver verification
        </h3>
        <Badge variant="secondary">{pendingCount} pending</Badge>
      </div>

      {drivers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No driver applications yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => {
            const docs = docsByDriver[driver.user_id] ?? [];
            return (
              <Card key={driver.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {driver.profiles?.display_name || 'Unknown driver'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{driver.profiles?.email}</p>
                    </div>
                    <Badge
                      variant={
                        driver.is_suspended || driver.verification_status === 'rejected'
                          ? 'destructive'
                          : driver.verification_status === 'approved'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {driver.is_suspended ? (
                        <ShieldAlert className="h-3 w-3 mr-1" />
                      ) : driver.verification_status === 'approved' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : driver.verification_status === 'rejected' ? (
                        <XCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {driver.is_suspended ? 'suspended' : driver.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vehicle type</p>
                      <p className="font-medium capitalize">{driver.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Licence plate</p>
                      <p className="font-medium">{driver.license_plate || 'N/A'}</p>
                    </div>
                    {driver.vehicle_make && (
                      <div>
                        <p className="text-muted-foreground">Make</p>
                        <p className="font-medium">{driver.vehicle_make}</p>
                      </div>
                    )}
                    {driver.vehicle_model && (
                      <div>
                        <p className="text-muted-foreground">Model</p>
                        <p className="font-medium">{driver.vehicle_model}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documents ({docs.length})</p>
                    {docs.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No documents uploaded — this driver cannot be approved.
                      </p>
                    )}
                    {docs.map((doc) => {
                      const expired = doc.expires_on
                        ? new Date(doc.expires_on) <= new Date()
                        : false;
                      return (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm"
                        >
                          <span className="flex-1">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                          {doc.expires_on && (
                            <span
                              className={
                                expired ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'
                              }
                            >
                              exp {doc.expires_on}
                            </span>
                          )}
                          <Badge
                            variant={
                              expired || doc.status === 'rejected'
                                ? 'destructive'
                                : doc.status === 'approved'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {expired ? 'expired' : doc.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="View document"
                            onClick={() => viewDocument(doc.file_path)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewDocument(doc.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              reviewDocument(doc.id, 'rejected', notes[driver.user_id])
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      aria-label="Reason or reviewer note"
                      placeholder="Reason / reviewer note (used when rejecting or suspending)"
                      value={notes[driver.user_id] ?? ''}
                      onChange={(e) =>
                        setNotes((p) => ({ ...p, [driver.user_id]: e.target.value }))
                      }
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setVerification(driver.user_id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve driver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVerification(driver.user_id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setVerification(driver.user_id, 'suspended')}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
