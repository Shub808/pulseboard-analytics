"use client";

import { useTheme, type ThemePreference } from "@/components/theme-provider";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "system", label: "System", icon: "⌁" },
];

/**
 * Theme switcher as a radio group — three mutually exclusive states (including
 * "follow the OS") can't be expressed by a two-state toggle button.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const selected = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference(option.value)}
            title={option.label}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-sm transition-colors",
              selected
                ? "bg-brand-600 text-white"
                : "text-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
