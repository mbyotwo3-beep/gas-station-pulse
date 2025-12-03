import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentMethodsManager from '@/components/payment/PaymentMethodsManager';
import TransactionHistory from '@/components/payment/TransactionHistory';
import WalletCard from '@/components/payment/WalletCard';
import WalletTopUpDialog from '@/components/payment/WalletTopUpDialog';
import WalletTransferDialog from '@/components/payment/WalletTransferDialog';
import PaymentRequestDialog from '@/components/payment/PaymentRequestDialog';
import PaymentRequestsList from '@/components/payment/PaymentRequestsList';
import { useWallet } from '@/hooks/useWallet';
import { CreditCard, History, Wallet, HandCoins } from 'lucide-react';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('wallet');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const { balance, loading } = useWallet();

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Manage your wallet, payment methods and view transaction history
        </p>
      </div>

      <div className="mb-6">
        <WalletCard 
          balance={balance} 
          loading={loading}
          onTopUp={() => setShowTopUp(true)}
          onTransfer={() => setShowTransfer(true)}
          onRequest={() => setShowRequest(true)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Methods
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet" className="space-y-6">
          <TransactionHistory filterType="wallet" />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <PaymentRequestsList />
        </TabsContent>

        <TabsContent value="methods" className="space-y-6">
          <PaymentMethodsManager />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TransactionHistory />
        </TabsContent>
      </Tabs>

      <WalletTopUpDialog 
        open={showTopUp} 
        onOpenChange={setShowTopUp}
      />

      <WalletTransferDialog
        open={showTransfer}
        onOpenChange={setShowTransfer}
      />

      <PaymentRequestDialog
        open={showRequest}
        onOpenChange={setShowRequest}
      />
    </div>
  );
}
