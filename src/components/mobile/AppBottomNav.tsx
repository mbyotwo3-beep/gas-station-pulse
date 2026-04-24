import { Fuel, Car, UtensilsCrossed, Package, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppTab = "fuel" | "rides" | "food" | "packages" | "errands";

interface AppBottomNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: typeof Fuel }[] = [
  { id: "fuel", label: "Fuel", icon: Fuel },
  { id: "rides", label: "Rides", icon: Car },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "packages", label: "Send", icon: Package },
  { id: "errands", label: "Errands", icon: Briefcase },
];

export default function AppBottomNav({ active, onChange }: AppBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[60] border-t bg-background/95 backdrop-blur-xl shadow-elegant"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "w-full flex flex-col items-center gap-0.5 py-2.5 transition-colors",
                  "text-[10px] font-medium",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-7 w-12 rounded-full transition-all",
                    isActive ? "bg-primary/12" : "bg-transparent"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                </span>
                <span>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
