import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const storageKey = "fuel-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored === "dark";
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(storageKey, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(storageKey, "light");
    }
  }, [isDark]);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setIsDark((v) => !v)}
      className="motion-smooth"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export default ThemeToggle;
