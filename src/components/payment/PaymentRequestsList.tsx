import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentRequests } from '@/hooks/usePaymentRequests';
import { toast } from '@/hooks/use-toast';
import { HandCoins, Check, X, Ban, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
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

export default function PaymentRequestsList() {
  const { incomingRequests, outgoingRequests, loading, acceptRequest, declineRequest, cancelRequest } = usePaymentRequests();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'accept' | 'decline' | 'cancel';
    requestId: string;
    amount: number;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'default';
      case 'declined':
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3" />;
      case 'declined':
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      case 'expired':
        return <Ban className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    setProcessing(true);
    let result;

    switch (confirmDialog.action) {
      case 'accept':
        result = await acceptRequest(confirmDialog.requestId);
        break;
      case 'decline':
        result = await declineRequest(confirmDialog.requestId);
        break;
      case 'cancel':
        result = await cancelRequest(confirmDialog.requestId);
        break;
    }

    setProcessing(false);
    setConfirmDialog(null);

    if (result?.success) {
      toast({
        title: 'Success',
        description: `Request ${confirmDialog.action}ed successfully`
      });
    } else {
      toast({
        title: 'Error',
        description: result?.error || 'Failed to process request',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || '??';
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" />
            Payment Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="incoming">
                Incoming ({incomingRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="outgoing">
                Outgoing ({outgoingRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-3 mt-4">
              {incomingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payment requests received
                </p>
              ) : (
                incomingRequests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(request.from_profile?.display_name, request.from_profile?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {request.from_profile?.display_name || 'User'}
                              </span>
                              <Badge variant={getStatusColor(request.status)} className="text-xs">
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.from_profile?.email}
                            </p>
                            {request.description && (
                              <p className="text-sm mt-1">{request.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(request.created_at), 'MMM dd, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <p className="text-lg font-bold text-primary">
                            ${request.amount.toFixed(2)}
                          </p>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'decline',
                                  requestId: request.id,
                                  amount: request.amount
                                })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'accept',
                                  requestId: request.id,
                                  amount: request.amount
                                })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-3 mt-4">
              {outgoingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payment requests sent
                </p>
              ) : (
                outgoingRequests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(request.to_profile?.display_name, request.to_profile?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {request.to_profile?.display_name || 'User'}
                              </span>
                              <Badge variant={getStatusColor(request.status)} className="text-xs">
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.to_profile?.email}
                            </p>
                            {request.description && (
                              <p className="text-sm mt-1">{request.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(request.created_at), 'MMM dd, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-2">
                          <p className="text-lg font-bold text-primary">
                            ${request.amount.toFixed(2)}
                          </p>
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDialog({
                                open: true,
                                action: 'cancel',
                                requestId: request.id,
                                amount: request.amount
                              })}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'accept' && 'Accept Payment Request'}
              {confirmDialog?.action === 'decline' && 'Decline Payment Request'}
              {confirmDialog?.action === 'cancel' && 'Cancel Payment Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'accept' && 
                `This will transfer $${confirmDialog.amount.toFixed(2)} from your wallet to complete this payment request.`
              }
              {confirmDialog?.action === 'decline' && 
                'The requester will be notified that you declined their request.'
              }
              {confirmDialog?.action === 'cancel' && 
                'This will cancel your payment request.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, go back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={processing}>
              {processing && <span className="mr-2">Processing...</span>}
              {!processing && 'Yes, continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
