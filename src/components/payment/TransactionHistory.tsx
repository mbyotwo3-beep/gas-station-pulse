import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  transaction_type: 'payment' | 'refund' | 'payout' | 'fee' | 'top_up' | 'transfer_in' | 'transfer_out';
  service_type: 'ride' | 'food_delivery' | 'package_delivery';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_method_type?: string;
  description?: string;
  created_at: string;
  completed_at?: string;
}

interface TransactionHistoryProps {
  filterType?: 'wallet' | 'all';
}

export default function TransactionHistory({ filterType = 'all' }: TransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterType]);

  const fetchTransactions = async () => {
    if (!user) return;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Filter for wallet-related transactions
    if (filterType === 'wallet') {
      query = query.or('transaction_type.eq.top_up,payment_method_type.eq.wallet');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions((data || []) as Transaction[]);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
      case 'processing':
        return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
      case 'transfer_out':
        return <ArrowUpRight className="h-5 w-5 text-destructive" />;
      case 'refund':
      case 'payout':
      case 'transfer_in':
        return <ArrowDownRight className="h-5 w-5 text-green-500" />;
      case 'top_up':
        return <Wallet className="h-5 w-5 text-green-500" />;
      case 'fee':
        return <ArrowUpRight className="h-5 w-5 text-yellow-500" />;
      default:
        return <ArrowUpRight className="h-5 w-5" />;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'ride':
        return 'Ride';
      case 'food_delivery':
        return 'Food Delivery';
      case 'package_delivery':
        return 'Package Delivery';
      default:
        return type;
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No transactions yet
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {transaction.transaction_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getServiceTypeLabel(transaction.service_type)}
                          </Badge>
                          <Badge variant={getStatusColor(transaction.status)} className="text-xs">
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1">{transaction.status}</span>
                          </Badge>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {transaction.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy h:mm a')}
                        </p>
                        {transaction.payment_method_type && (
                          <p className="text-xs text-muted-foreground">
                            via {transaction.payment_method_type.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.transaction_type === 'payment' || 
                        transaction.transaction_type === 'fee' || 
                        transaction.transaction_type === 'transfer_out'
                          ? 'text-destructive'
                          : 'text-green-500'
                      }`}>
                        {transaction.transaction_type === 'payment' || 
                         transaction.transaction_type === 'fee' || 
                         transaction.transaction_type === 'transfer_out' ? '-' : '+'}
                        {transaction.currency === 'USD' ? '$' : ''}
                        {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
