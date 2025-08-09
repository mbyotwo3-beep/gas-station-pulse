import ManagerLogin from "@/components/ManagerLogin";
import ThemeToggle from "@/components/ThemeToggle";

export default function BottomBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-medium">FuelFinder</div>
        <div className="flex items-center gap-2">
          <ManagerLogin />
          <ThemeToggle />
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
