import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, Bell } from 'lucide-react';

export default function ProfileDialog() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [notifications, setNotifications] = useState<boolean>(profile?.preferences?.notifications ?? true);

  const handleSave = async () => {
    await updateProfile({
      display_name: displayName,
      preferences: {
        ...profile?.preferences,
        notifications,
        favorite_stations: profile?.preferences?.favorite_stations || []
      }
    });
    setOpen(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl">
          <User className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about station status
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={(checked) => setNotifications(checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Favorite Stations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Favorite Stations</CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.preferences?.favorite_stations?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.favorite_stations.map((stationId) => (
                    <Badge key={stationId} variant="secondary">
                      {stationId}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No favorite stations yet. Start favoriting stations from the main map!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}