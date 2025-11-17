import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Car, User } from 'lucide-react';

interface PendingDriver {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model?: string;
  license_plate?: string;
  verification_status: string;
  created_at: string;
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

export default function DriverVerificationPanel() {
  const { user } = useAuth();
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDrivers();

    // Real-time subscription for new driver applications
    const channel = supabase
      .channel('driver-verifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_profiles'
        },
        () => {
          fetchPendingDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          profiles!inner(display_name, email)
        `)
        .in('verification_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPendingDrivers(data || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (driverId: string, status: 'approved' | 'rejected') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          verification_status: status,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
          verified_by: user.id
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'Driver Approved' : 'Driver Rejected',
        description: `Driver has been ${status}`,
      });

      fetchPendingDrivers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          Driver Verification Queue
        </h3>
        <Badge variant="secondary">{pendingDrivers.length} Pending</Badge>
      </div>

      {pendingDrivers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending driver applications
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map((driver) => (
            <Card key={driver.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {driver.profiles?.display_name || 'Unknown Driver'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {driver.profiles?.email}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      driver.verification_status === 'pending' ? 'secondary' :
                      driver.verification_status === 'approved' ? 'default' :
                      'destructive'
                    }
                  >
                    {driver.verification_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {driver.verification_status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {driver.verification_status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                    {driver.verification_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle Type</p>
                    <p className="font-medium capitalize">{driver.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">License Plate</p>
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

                {driver.verification_status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerification(driver.id, 'approved')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleVerification(driver.id, 'rejected')}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}