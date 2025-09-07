import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Shield, Crown, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RoleBasedFeatures() {
  const { roles, primaryRole, hasRole, assignAdditionalRole, loading } = useRoles();

  if (loading) return null;

  const availableRoles = [
    {
      role: 'driver',
      label: 'Become a Driver',
      description: 'Start offering rides to passengers',
      icon: Car,
      color: 'bg-green-500'
    },
    {
      role: 'manager',
      label: 'Station Manager',
      description: 'Manage fuel stations and reports',
      icon: Shield,
      color: 'bg-purple-500'
    }
  ].filter(r => !hasRole(r.role as any));

  const handleAddRole = async (role: 'driver' | 'manager') => {
    const success = await assignAdditionalRole(role);
    if (success) {
      toast({
        title: 'Role Added!',
        description: `You can now access ${role} features`,
        variant: 'default'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Roles Display */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          Your Roles
        </h3>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <Badge 
              key={role} 
              variant={role === primaryRole ? "default" : "secondary"}
              className="capitalize"
            >
              {role}
              {role === primaryRole && " (Primary)"}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Role Capabilities */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">What You Can Do</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>View and report fuel station status</span>
          </div>
          
          {hasRole('driver') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Offer rides to passengers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>View and accept ride requests</span>
              </div>
            </>
          )}
          
          {hasRole('manager') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Manage any station reports</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span>Edit or delete station information</span>
              </div>
            </>
          )}
          
          {hasRole('admin') && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Full system access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Manage all users and data</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Available Roles to Add */}
      {availableRoles.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add More Roles
          </h3>
          <div className="space-y-3">
            {availableRoles.map(({ role, label, description, icon: Icon, color }) => (
              <div key={role} className="flex items-center justify-between p-3 border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground">{description}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddRole(role as any)}
                  className="ml-4"
                >
                  Add Role
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}