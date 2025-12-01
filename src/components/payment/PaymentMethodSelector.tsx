import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, Banknote, Plus } from 'lucide-react';
import { PaymentMethodDialog } from './PaymentMethodDialog';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'digital_wallet' | 'cash';
  provider?: string;
  last_four?: string;
  cardholder_name?: string;
  is_default: boolean;
  wallet_id?: string;
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId?: string;
  onSelectMethod: (methodId: string) => void;
  onMethodAdded?: () => void;
  allowCash?: boolean;
}

export default function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
  onMethodAdded,
  allowCash = true
}: PaymentMethodSelectorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

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
      return `${method.provider || 'Digital Wallet'} ${method.wallet_id ? `(${method.wallet_id})` : ''}`;
    } else {
      return `${method.provider || 'Card'} •••• ${method.last_four || '****'}`;
    }
  };

  const filteredMethods = allowCash 
    ? paymentMethods 
    : paymentMethods.filter(m => m.type !== 'cash');

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Payment Method</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        <RadioGroup value={selectedMethodId} onValueChange={onSelectMethod}>
          <div className="grid gap-3">
            {filteredMethods.map((method) => (
              <Card
                key={method.id}
                className={`cursor-pointer transition-colors ${
                  selectedMethodId === method.id
                    ? 'border-primary'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => onSelectMethod(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="flex-1 flex items-center gap-3">
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
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredMethods.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No payment methods added yet
              </p>
            )}
          </div>
        </RadioGroup>
      </div>

      <PaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          onMethodAdded?.();
        }}
      />
    </>
  );
}
