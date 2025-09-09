import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Fuel, Car, Shield, User } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [primaryRole, setPrimaryRole] = useState<'user' | 'driver' | 'manager' | 'passenger'>('passenger');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  useEffect(() => {
    document.title = isLogin ? "Sign In - FuelFinder" : "Sign Up - FuelFinder";
    setIsChecking(false);
  }, [isLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        navigate("/");
      } else {
        const { error } = await signUp(email, password, displayName, primaryRole);

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      if (error.message.includes('already registered')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Try signing in instead.",
          variant: "destructive",
        });
      } else if (error.message.includes('Invalid login credentials')) {
        toast({
          title: "Invalid credentials",
          description: "Please check your email and password.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred during authentication.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'passenger' as const,
      label: 'Passenger',
      description: 'Book rides and find fuel stations',
      icon: User,
      color: 'text-blue-500'
    },
    {
      value: 'driver' as const,
      label: 'Driver',
      description: 'Offer rides + all passenger features',
      icon: Car,
      color: 'text-green-500'
    },
    {
      value: 'user' as const,
      label: 'Fuel User',
      description: 'Find fuel stations and report status',
      icon: Fuel,
      color: 'text-orange-500'
    },
    {
      value: 'manager' as const,
      label: 'Station Manager',
      description: 'Manage stations + all features',
      icon: Shield,
      color: 'text-purple-500'
    }
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-md border border-border/30">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Fuel className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Sign in to access your fuel finder account" 
              : "Join the community - Choose your role"
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mobile-input"
                  required={!isLogin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Choose Your Role</label>
                <div className="space-y-3">
                  {roleOptions.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <div key={role.value} className="relative">
                        <input
                          type="radio"
                          id={role.value}
                          name="role"
                          value={role.value}
                          checked={primaryRole === role.value}
                          onChange={(e) => setPrimaryRole(e.target.value as any)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={role.value}
                          className={`
                            flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${primaryRole === role.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                            }
                          `}
                        >
                          <div className={`mr-3 mt-0.5 ${role.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{role.label}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                          <div className={`
                            w-4 h-4 rounded-full border-2 ml-2 mt-0.5
                            ${primaryRole === role.value 
                              ? 'border-primary bg-primary' 
                              : 'border-border'
                            }
                          `} />
                        </label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You can add additional roles later from your profile
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="mobile-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mobile-input pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="mobile-button w-full"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
              setDisplayName("");
              setPrimaryRole('passenger');
            }}
            className="text-primary hover:text-primary-light font-medium transition-colors"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </Card>
    </div>
  );
}
