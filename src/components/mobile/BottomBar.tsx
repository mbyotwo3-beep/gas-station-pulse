import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { User, LogOut } from "lucide-react";

export default function BottomBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-medium">FuelFinder</div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="hero" size="sm">
              <Link to="/auth">
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
