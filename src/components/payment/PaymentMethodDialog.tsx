import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PaymentMethodDialog({ open, onOpenChange, onSuccess }: PaymentMethodDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'credit_card' | 'debit_card' | 'digital_wallet' | 'cash'>('credit_card');
  const [provider, setProvider] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [walletId, setWalletId] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const paymentMethodData: any = {
        user_id: user.id,
        type,
        is_default: isDefault,
        is_active: true
      };

      if (type === 'credit_card' || type === 'debit_card') {
        if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear) {
          throw new Error('Please fill in all card details');
        }
        paymentMethodData.last_four = cardNumber.slice(-4);
        paymentMethodData.cardholder_name = cardholderName;
        paymentMethodData.expiry_month = parseInt(expiryMonth);
        paymentMethodData.expiry_year = parseInt(expiryYear);
        paymentMethodData.provider = provider || 'Unknown';
      } else if (type === 'digital_wallet') {
        if (!provider || !walletId) {
          throw new Error('Please fill in wallet details');
        }
        paymentMethodData.provider = provider;
        paymentMethodData.wallet_id = walletId;
      }

      const { error } = await supabase
        .from('payment_methods')
        .insert(paymentMethodData);

      if (error) throw error;

      toast({
        title: 'Payment method added',
        description: 'Your payment method has been saved successfully',
      });

      onSuccess?.();
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('credit_card');
    setProvider('');
    setCardNumber('');
    setCardholderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setWalletId('');
    setIsDefault(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === 'credit_card' || type === 'debit_card') && (
            <>
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="1234 5678 9012 3456"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cardholder Name</Label>
                <Input
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="MM"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="YYYY"
                    maxLength={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">Amex</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {type === 'digital_wallet' && (
            <>
              <div className="space-y-2">
                <Label>Wallet Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wallet ID / Email</Label>
                <Input
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  placeholder="wallet@example.com"
                  required
                />
              </div>
            </>
          )}

          {type === 'cash' && (
            <p className="text-sm text-muted-foreground">
              Select this option to pay with cash upon service completion.
            </p>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="default">Set as default</Label>
            <Switch
              id="default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Payment Method
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
