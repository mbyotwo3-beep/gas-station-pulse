import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Wallet, Banknote, Trash2, Star, Plus } from 'lucide-react';
import { PaymentMethodDialog } from './PaymentMethodDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'digital_wallet' | 'cash';
  provider?: string;
  last_four?: string;
  cardholder_name?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_active: boolean;
  wallet_id?: string;
}

export default function PaymentMethodsManager() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
    } else {
      setPaymentMethods((data || []) as PaymentMethod[]);
    }
    setLoading(false);
  };

  const setDefaultMethod = async (methodId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', methodId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Default payment method updated',
        description: 'Your default payment method has been changed',
      });
      fetchPaymentMethods();
    }
  };

  const deleteMethod = async () => {
    if (!methodToDelete) return;

    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', methodToDelete);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Payment method removed',
        description: 'Your payment method has been removed',
      });
      fetchPaymentMethods();
    }
    setDeleteDialogOpen(false);
    setMethodToDelete(null);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'digital_wallet':
        return <Wallet className="h-5 w-5" />;
      case 'cash':
        return <Banknote className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    if (method.type === 'cash') {
      return 'Cash Payment';
    } else if (method.type === 'digital_wallet') {
      return `${method.provider || 'Digital Wallet'}`;
    } else {
      return `${method.provider || 'Card'} •••• ${method.last_four || '****'}`;
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payment methods added yet
            </p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-primary">{getMethodIcon(method.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getMethodLabel(method)}</span>
                            {method.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          {method.cardholder_name && (
                            <p className="text-sm text-muted-foreground">
                              {method.cardholder_name}
                            </p>
                          )}
                          {method.expiry_month && method.expiry_year && (
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expiry_month}/{method.expiry_year}
                            </p>
                          )}
                          {method.wallet_id && (
                            <p className="text-sm text-muted-foreground">
                              {method.wallet_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && method.type !== 'cash' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultMethod(method.id)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Set Default
                          </Button>
                        )}
                        {method.type !== 'cash' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMethodToDelete(method.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchPaymentMethods();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMethod}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
