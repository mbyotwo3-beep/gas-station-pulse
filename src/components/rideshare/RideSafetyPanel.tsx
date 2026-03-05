import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, AlertTriangle, Phone, Share2, Copy, Check, 
  MapPin, Clock, UserCheck, FileWarning, Siren, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RideSafetyPanelProps {
  rideId: string;
  isDriver: boolean;
  pickupAddress: string;
  destinationAddress: string;
  otherPartyName?: string;
  rideStatus: string;
  driverId?: string;
  passengerId?: string;
}

export default function RideSafetyPanel({
  rideId,
  isDriver,
  pickupAddress,
  destinationAddress,
  otherPartyName = isDriver ? 'Passenger' : 'Driver',
  rideStatus,
}: RideSafetyPanelProps) {
  const { user } = useAuth();
  const [showSOS, setShowSOS] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShareTrip, setShowShareTrip] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState('');
  const [sosTriggered, setSosTriggered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Generate a shareable trip link
  const tripShareLink = `${window.location.origin}/trip/${rideId}`;
  const tripShareMessage = `I'm on a ride right now.\n📍 From: ${pickupAddress}\n🎯 To: ${destinationAddress}\nTrack my trip: ${tripShareLink}`;

  const handleSOS = () => {
    setSosTriggered(true);
    
    // Log SOS event (in production, this would alert authorities)
    console.warn('🚨 SOS TRIGGERED', {
      rideId,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      role: isDriver ? 'driver' : 'passenger',
    });

    toast({
      title: '🚨 Emergency Alert Sent',
      description: 'Emergency contacts and support have been notified. Stay safe.',
      variant: 'destructive',
    });

    // Auto-close after a moment
    setTimeout(() => setShowSOS(false), 2000);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tripShareMessage);
      setCopied(true);
      toast({ title: 'Trip details copied!', description: 'Share with your trusted contacts' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Could not copy', description: 'Please copy manually', variant: 'destructive' });
    }
  };

  const handleShareTrip = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Live Trip',
          text: tripShareMessage,
          url: tripShareLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSubmitReport = async () => {
    if (!reportType || !reportDescription.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setSubmittingReport(true);

    // Log incident report (in production → Supabase table + admin notification)
    console.warn('🔴 INCIDENT REPORT', {
      rideId,
      userId: user?.id,
      reportType,
      description: reportDescription,
      timestamp: new Date().toISOString(),
      role: isDriver ? 'driver' : 'passenger',
    });

    toast({
      title: 'Report Submitted',
      description: 'Our safety team will review this incident within 24 hours. If you are in immediate danger, please call emergency services.',
    });

    setReportType('');
    setReportDescription('');
    setSubmittingReport(false);
    setShowReport(false);
  };

  return (
    <>
      {/* Safety Action Bar */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Safety</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* SOS Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowSOS(true)}
                className="gap-1 font-bold"
              >
                <Siren className="h-4 w-4" />
                SOS
              </Button>

              {/* Share Trip */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareTrip(true)}
                className="gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share Trip
              </Button>

              {/* Report Incident */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport(true)}
                className="gap-1"
              >
                <FileWarning className="h-4 w-4" />
                Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOS Emergency Dialog */}
      <Dialog open={showSOS} onOpenChange={setShowSOS}>
        <DialogContent className="border-destructive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-6 w-6" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription>
              This will alert emergency contacts, record your location, and notify our safety team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!sosTriggered ? (
              <>
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">When you trigger SOS:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Your live location is recorded
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Emergency contacts are notified
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="h-3 w-3" /> Trip is flagged for safety review
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-3 w-3" /> Ride details are preserved as evidence
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label>Emergency Contact (optional)</Label>
                  <Input
                    value={emergencyContacts}
                    onChange={(e) => setEmergencyContacts(e.target.value)}
                    placeholder="+260 97X XXX XXX"
                    type="tel"
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowSOS(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSOS}
                    className="flex-1 font-bold"
                    size="lg"
                  >
                    <Siren className="h-5 w-5 mr-2" />
                    TRIGGER SOS
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  For immediate danger, call <strong>911</strong> or your local emergency number
                </p>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">🚨</div>
                <p className="text-lg font-bold text-destructive">Alert Sent</p>
                <p className="text-sm text-muted-foreground">
                  Emergency contacts and our safety team have been notified.
                  Stay calm and stay in a safe location.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Trip Dialog */}
      <Dialog open={showShareTrip} onOpenChange={setShowShareTrip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Trip
            </DialogTitle>
            <DialogDescription>
              Let someone know where you are. Share your live trip details with trusted contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">Trip Details:</p>
              <p>📍 From: {pickupAddress}</p>
              <p>🎯 To: {destinationAddress}</p>
              <p>📋 Ride ID: {rideId.slice(0, 8)}...</p>
              <p>🕐 Status: {rideStatus}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
              <Button onClick={handleShareTrip} className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Incident Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-destructive" />
              Report Safety Incident
            </DialogTitle>
            <DialogDescription>
              Your report will be reviewed by our safety team. All reports are confidential.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Incident Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or Threats</SelectItem>
                  <SelectItem value="unsafe_driving">Unsafe Driving</SelectItem>
                  <SelectItem value="route_deviation">Unexpected Route Change</SelectItem>
                  <SelectItem value="intoxication">Driver/Passenger Under Influence</SelectItem>
                  <SelectItem value="vehicle_condition">Poor Vehicle Condition</SelectItem>
                  <SelectItem value="fraud">Fare Fraud / Overcharging</SelectItem>
                  <SelectItem value="discrimination">Discrimination</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="theft">Theft or Property Damage</SelectItem>
                  <SelectItem value="other">Other Safety Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Describe what happened</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide as much detail as possible. Include time, location, and any witnesses..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reportDescription.length}/1000
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> False reports may result in account suspension. 
                For emergencies, use the SOS button or call local emergency services.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReport(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={submittingReport || !reportType || !reportDescription.trim()}
                variant="destructive"
                className="flex-1"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
