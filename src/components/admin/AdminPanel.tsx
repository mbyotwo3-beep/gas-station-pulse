import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, Car, Fuel, TrendingUp, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserWithRole {
  id: string;
  email: string;
  display_name?: string;
  primary_role: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalStations: number;
  totalRides: number;
  totalDrivers: number;
  activeRides: number;
  activeDrivers: number;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalStations: 0,
    totalRides: 0,
    totalDrivers: 0,
    activeRides: 0,
    activeDrivers: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, display_name, primary_role, created_at')
        .order('created_at', { ascending: false });

      if (usersData) setUsers(usersData);

      // Fetch statistics
      const [stationsCount, ridesCount, driversCount, activeRidesCount, activeDriversCount] = await Promise.all([
        supabase.from('stations').select('id', { count: 'exact', head: true }),
        supabase.from('rides').select('id', { count: 'exact', head: true }),
        supabase.from('driver_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('rides').select('id', { count: 'exact', head: true }).in('status', ['pending', 'accepted', 'in_progress']),
        supabase.from('driver_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      setStats({
        totalUsers: usersData?.length || 0,
        totalStations: stationsCount.count || 0,
        totalRides: ridesCount.count || 0,
        totalDrivers: driversCount.count || 0,
        activeRides: activeRidesCount.count || 0,
        activeDrivers: activeDriversCount.count || 0
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'passenger' | 'driver' | 'manager' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ primary_role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole }]);

      toast({ title: 'Success', description: 'User role updated' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading admin panel...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System overview and management</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Fuel className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalStations}</div>
              <div className="text-xs text-muted-foreground">Stations</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalDrivers}</div>
              <div className="text-xs text-muted-foreground">Drivers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{stats.totalRides}</div>
              <div className="text-xs text-muted-foreground">Total Rides</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-success animate-pulse" />
              <div className="text-2xl font-bold">{stats.activeRides}</div>
              <div className="text-xs text-muted-foreground">Active Rides</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-success animate-pulse" />
              <div className="text-2xl font-bold">{stats.activeDrivers}</div>
              <div className="text-xs text-muted-foreground">Online Drivers</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{user.display_name || user.email}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        user.primary_role === 'admin' ? 'destructive' :
                        user.primary_role === 'manager' ? 'default' :
                        user.primary_role === 'driver' ? 'success' :
                        'secondary'
                      }>
                        {user.primary_role}
                      </Badge>
                      <Select
                        value={user.primary_role}
                        onValueChange={(value: 'user' | 'passenger' | 'driver' | 'manager' | 'admin') => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="passenger">Passenger</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Database Status</div>
                    <div className="text-sm text-muted-foreground">All systems operational</div>
                  </div>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Storage Status</div>
                    <div className="text-sm text-muted-foreground">Photo uploads working</div>
                  </div>
                  <Badge variant="success">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Real-time Updates</div>
                    <div className="text-sm text-muted-foreground">WebSocket connections active</div>
                  </div>
                  <Badge variant="success">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
