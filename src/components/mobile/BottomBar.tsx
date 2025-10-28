import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { User, LogOut, Shield } from "lucide-react";
import ProfileDialog from "@/components/ProfileDialog";

export default function BottomBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/98 backdrop-blur-xl shadow-elegant md:hidden">
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-primary">FuelFinder</div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <ProfileDialog />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="h-9"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="text-xs">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button asChild size="sm" className="h-9">
                <Link to="/auth">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-xs">Sign In</span>
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
