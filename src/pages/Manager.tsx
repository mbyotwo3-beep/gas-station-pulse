import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Manager() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Manager Login - FuelFinder";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => navigate("/"), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <section className="w-full max-w-sm">
        <h1 className="sr-only">Manager Login</h1>
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
      </section>
    </main>
  );
}
