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
    if (!stationId.trim() || !stationName.trim()) {
      toast({ title: "Missing details", description: "Please provide Station ID and Station Name." });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from('station_reports').insert({
      station_id: stationId.trim(),
      station_name: stationName.trim(),
      status,
      note: note.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Update failed", description: error.message });
    } else {
      toast({ title: "Status reported", description: "Your update was submitted." });
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
              <CardTitle>Update Station Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitReport} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stationName">Station Name</Label>
                  <Input id="stationName" value={stationName} onChange={(e) => setStationName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stationId">Station ID</Label>
                  <Input id="stationId" value={stationId} onChange={(e) => setStationId(e.target.value)} placeholder="e.g. way-123456 or your internal ID" required />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as FuelStatus)}>
                    <SelectTrigger aria-label="Select fuel status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Fuel Available</SelectItem>
                      <SelectItem value="low">Low Supply</SelectItem>
                      <SelectItem value="out">Out of Fuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional info for drivers (hours, queues, etc.)" />
                </div>
                <div className="flex gap-2 justify-between">
                  <Button type="button" variant="outline" onClick={onLogout}>Sign out</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit update'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
