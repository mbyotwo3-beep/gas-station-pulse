import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface ForgotPasswordDialogProps {
  trigger?: React.ReactNode;
}

export default function ForgotPasswordDialog({ trigger }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setEmail("");
      setSent(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="text-primary hover:text-primary-light text-sm font-medium transition-colors">
            Forgot password?
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Check your email</h3>
              <p className="text-muted-foreground text-sm mt-1">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mobile-input"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
