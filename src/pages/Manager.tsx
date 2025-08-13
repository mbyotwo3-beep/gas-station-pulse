import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FuelStatus } from "@/components/StationCard";

export default function Manager() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Manager update form state
  const [stationName, setStationName] = useState("");
  const [stationId, setStationId] = useState("");
  const [status, setStatus] = useState<FuelStatus>("available");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = isAuthed ? "Manager Update - FuelFinder" : "Manager Login - FuelFinder";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [isAuthed]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message });
    } else {
      toast({ title: "Welcome", description: "Signed in as manager." });
    }
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been logged out." });
  };

  const onSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) {
      toast({ title: "Station name required", description: "Please enter your station name." });
      return;
    }
    setSubmitting(true);
    // Use station name as ID if no specific ID provided (simplified for managers)
    const stationIdentifier = stationId.trim() || stationName.trim().toLowerCase().replace(/\s+/g, '-');
    const { error } = await (supabase as any).from('station_reports').insert({
      station_id: stationIdentifier,
      station_name: stationName.trim(),
      status,
      note: note.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "✅ Status updated!", description: "Your station update was submitted successfully." });
      setNote("");
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <section className="w-full max-w-md">
        <h1 className="sr-only">{isAuthed ? 'Manager Update' : 'Manager Login'}</h1>
        {!isAuthed ? (
          <Card>
            <CardHeader>
              <CardTitle>Manager Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quick Station Update</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitReport} className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="stationName" className="text-base font-semibold">Your Station Name</Label>
                  <Input 
                    id="stationName" 
                    value={stationName} 
                    onChange={(e) => setStationName(e.target.value)} 
                    placeholder="Enter your station name"
                    className="text-lg p-4"
                    required 
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label className="text-base font-semibold">Current Fuel Status</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={status === "available" ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setStatus("available")}
                    >
                      ✅ Available
                    </Button>
                    <Button
                      type="button"
                      variant={status === "low" ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setStatus("low")}
                    >
                      ⚠️ Low
                    </Button>
                    <Button
                      type="button"
                      variant={status === "out" ? "default" : "outline"}
                      className="h-16 text-lg"
                      onClick={() => setStatus("out")}
                    >
                      ❌ Out
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="note" className="text-base font-semibold">Quick Note (optional)</Label>
                  <Textarea 
                    id="note" 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                    placeholder="e.g. Long queue, Open until 10pm, Cash only"
                    className="text-lg"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={onLogout} className="flex-1">
                    Sign Out
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-2 h-12 text-lg">
                    {submitting ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
