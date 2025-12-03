import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, HandCoins, Search } from 'lucide-react';
import { usePaymentRequests } from '@/hooks/usePaymentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface PaymentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  display_name?: string;
  email?: string;
}

export default function PaymentRequestDialog({ open, onOpenChange }: PaymentRequestDialogProps) {
  const { createRequest } = usePaymentRequests();
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount('');
      setDescription('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq('id', user?.id || '')
      .limit(5);

    setSearching(false);

    if (error) {
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    setSearchResults((data || []) as UserProfile[]);
    
    if (data?.length === 0) {
      toast({
        title: 'No users found',
        description: 'Try searching by email or name',
      });
    }
  };

  const handleRequest = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedUser) {
      toast({
        title: 'Select recipient',
        description: 'Please search and select a user to request from',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    const result = await createRequest(
      selectedUser.id, 
      numAmount, 
      description || `Payment request`
    );
    setProcessing(false);

    if (result.success) {
      toast({
        title: 'Request sent',
        description: `Request for $${numAmount.toFixed(2)} sent to ${selectedUser.display_name || selectedUser.email}`
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Request failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const getInitials = (profile: UserProfile) => {
    if (profile.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    return profile.email?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            Request Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search for user */}
          <div className="space-y-3">
            <Label>Request From</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Search by email or name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} variant="secondary">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Search results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((profile) => (
                  <Card 
                    key={profile.id} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setSelectedUser(profile);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{profile.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Selected user */}
            {selectedUser && (
              <Card className="border-primary">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{selectedUser.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    Change
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-3">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label>Reason (optional)</Label>
            <Input
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequest}
              disabled={processing || !amount || !selectedUser}
              className="flex-1"
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request ${amount || '0.00'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
