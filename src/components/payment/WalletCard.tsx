import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletCardProps {
  balance: number;
  loading?: boolean;
  onTopUp?: () => void;
}

export default function WalletCard({ balance, loading, onTopUp }: WalletCardProps) {
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary-foreground/80">
          <Wallet className="h-4 w-4" />
          Wallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
            <p className="text-xs text-primary-foreground/60 mt-1">USD</p>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            className="gap-1"
            onClick={onTopUp}
          >
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
