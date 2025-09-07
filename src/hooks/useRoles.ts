import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type AppRole = 'user' | 'driver' | 'manager' | 'admin';

export function useRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole>('user');
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    if (!user) {
      setRoles([]);
      setPrimaryRole('user');
      setLoading(false);
      return;
    }

    try {
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;

      // Get primary role from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('primary_role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const userRolesList = userRoles?.map(r => r.role as AppRole) || [];
      setRoles(userRolesList);
      setPrimaryRole(profile?.primary_role || 'user');
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user roles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const canManageStations = (): boolean => {
    return hasRole('manager') || hasRole('admin');
  };

  const canViewAllRides = (): boolean => {
    return hasRole('admin');
  };

  const canDrive = (): boolean => {
    return hasRole('driver') || hasRole('admin');
  };

  const isRegularUser = (): boolean => {
    return hasRole('user') && !hasRole('driver') && !hasRole('manager') && !hasRole('admin');
  };

  const assignAdditionalRole = async (role: AppRole): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('assign_additional_role', {
        _user_id: user.id,
        _role: role
      });

      if (error) throw error;

      // Refresh roles
      await fetchUserRoles();
      
      toast({
        title: 'Role Added',
        description: `You now have ${role} privileges`,
        variant: 'default'
      });

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user]);

  return {
    roles,
    primaryRole,
    loading,
    hasRole,
    canManageStations,
    canViewAllRides,
    canDrive,
    isRegularUser,
    assignAdditionalRole,
    refetch: fetchUserRoles
  };
}