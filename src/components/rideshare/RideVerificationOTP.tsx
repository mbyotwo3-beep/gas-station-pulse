import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, CheckCircle, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RideVerificationOTPProps {
  rideId: string;
  isDriver: boolean;
  onVerified: () => void;
}

// Generate a deterministic 4-digit OTP from the ride ID
function generateOTP(rideId: string): string {
  let hash = 0;
  for (let i = 0; i < rideId.length; i++) {
    const char = rideId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const otp = Math.abs(hash % 10000).toString().padStart(4, '0');
  return otp;
}

export default function RideVerificationOTP({ rideId, isDriver, onVerified }: RideVerificationOTPProps) {
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const expectedOTP = generateOTP(rideId);

  // Passengers see the OTP to tell the driver
  // Drivers enter the OTP to verify the passenger
  
  const handleVerify = () => {
    if (otp === expectedOTP) {
      setVerified(true);
      toast({ title: 'Ride Verified ✅', description: 'Identity confirmed. Have a safe trip!' });
      onVerified();
    } else {
      toast({ title: 'Invalid Code', description: 'Please ask the passenger for the correct code.', variant: 'destructive' });
      setOtp('');
    }
  };

  if (verified) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 justify-center text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Ride Verified</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isDriver) {
    // Passenger sees the OTP to share with the driver
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Your Ride PIN</span>
            </div>
            <div className="text-3xl font-mono font-bold tracking-[0.5em] text-primary">
              {expectedOTP}
            </div>
            <p className="text-xs text-muted-foreground">
              Share this PIN with your driver to verify your identity
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Driver enters the OTP
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-4">
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Verify Passenger</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask the passenger for their 4-digit ride PIN
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={otp.length !== 4}
          >
            Verify
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
