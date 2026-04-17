"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ scrolled }: { scrolled?: boolean }) {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label =
    theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System theme";

  return (
    <button
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-sm transition-colors ${
        scrolled
          ? "text-ink-mid hover:text-eccellere-gold hover:bg-eccellere-gold/10"
          : "text-white/70 hover:text-eccellere-gold hover:bg-white/10"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
