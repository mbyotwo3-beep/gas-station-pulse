import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { usePageSeo } from '@/lib/seo';

type Status = 'verifying' | 'success' | 'failed' | 'pending';

export default function DpoReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your payment with DPO Pay…');
  const [amount, setAmount] = useState<number | null>(null);

  usePageSeo({
    title: 'Payment Verification – FuelFinder',
    description: 'Verifying your DPO Pay wallet top-up.',
    path: '/payments/dpo-return',
  });

  useEffect(() => {
    const token = params.get('TransactionToken') || params.get('token') || params.get('ID');
    if (!token) {
      setStatus('failed');
      setMessage('Missing payment token.');
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('dpo-verify-token', {
        body: { token },
      });
      if (error) {
        setStatus('failed');
        setMessage(error.message || 'Verification failed.');
        return;
      }
      if (data?.credited) {
        setStatus('success');
        setAmount(data.amount);
        if (data.rideId) {
          setMessage(`Ride paid. $${Number(data.amount).toFixed(2)} sent to your driver.`);
        } else {
          setMessage(`Payment confirmed. $${Number(data.amount).toFixed(2)} added to your wallet.`);
        }
      } else if (data?.result === '901') {
        setStatus('pending');
        setMessage('Payment is still pending. Refresh this page in a moment.');
      } else {
        setStatus('failed');
        setMessage(data?.explanation || 'Payment was not completed.');
      }
    })();
  }, [params]);

  const Icon = status === 'success' ? CheckCircle2 : status === 'failed' ? XCircle : Loader2;
  const iconClass =
    status === 'success' ? 'text-green-500' :
    status === 'failed' ? 'text-destructive' :
    'text-muted-foreground animate-spin';

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Card className="p-8 text-center space-y-4">
        <Icon className={`h-12 w-12 mx-auto ${iconClass}`} />
        <h1 className="text-xl font-semibold">
          {status === 'success' ? 'Payment Successful' :
           status === 'failed' ? 'Payment Failed' :
           status === 'pending' ? 'Payment Pending' :
           'Verifying Payment'}
        </h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate('/')}>Home</Button>
          <Button onClick={() => navigate('/payments')}>Go to Wallet</Button>
        </div>
      </Card>
    </div>
  );
}
