import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = mode === "login" ? "Login - FuelFinder" : "Sign Up - FuelFinder";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // defer navigation slightly to avoid blocking callback
        setTimeout(() => navigate("/"), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mode, navigate]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message });
    } else {
      toast({ title: "Welcome back", description: "You are now logged in." });
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message });
    } else {
      toast({ title: "Check your email", description: "Confirm your address to finish signing up." });
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <section className="w-full max-w-sm">
        <h1 className="sr-only">FuelFinder Authentication</h1>
        <Card>
          <CardHeader>
            <CardTitle>{mode === "login" ? "Login" : "Create an account"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? onLogin : onSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign Up"}
              </Button>
            </form>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              {mode === "login" ? (
                <button className="underline" onClick={() => setMode("signup")}>Need an account? Sign up</button>
              ) : (
                <button className="underline" onClick={() => setMode("login")}>Already have an account? Log in</button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
