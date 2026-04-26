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
            <li key={t.id} className="relative">
              {/* Top accent bar for active tab */}
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-1 rounded-b-full transition-all duration-300",
                  isActive ? "w-10 bg-primary opacity-100" : "w-0 bg-transparent opacity-0"
                )}
              />
              <button
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${t.label}${isActive ? " (current)" : ""}`}
                className={cn(
                  "w-full flex flex-col items-center gap-0.5 pt-2.5 pb-2 transition-colors",
                  "text-[10px] font-medium",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center h-7 w-12 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-transparent"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                </span>
                <span className={cn(isActive && "font-semibold")}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
