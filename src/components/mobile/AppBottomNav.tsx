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
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-border bg-background"
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
                aria-label={`${t.label}${isActive ? " (current)" : ""}`}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1 pt-2.5 pb-2.5",
                  "text-[11px] tracking-tight transition-colors duration-150 active:opacity-60",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-medium"
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  aria-hidden
                />
                <span>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

