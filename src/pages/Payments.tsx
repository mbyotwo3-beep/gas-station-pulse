import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentMethodsManager from '@/components/payment/PaymentMethodsManager';
import TransactionHistory from '@/components/payment/TransactionHistory';
import { CreditCard, History } from 'lucide-react';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('methods');

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Manage your payment methods and view transaction history
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
          <PaymentMethodsManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
