"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark");

    setDark(isDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;

    document.documentElement.classList.toggle(
      "dark",
      nextDark,
    );

    localStorage.setItem(
      "theme",
      nextDark ? "dark" : "light",
    );

    setDark(nextDark);
  }

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-800" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        dark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="
        flex h-9 w-9 items-center justify-center
        rounded-lg
        border border-zinc-200
        bg-white
        text-zinc-600
        shadow-sm
        transition-all
        hover:bg-zinc-50
        hover:text-zinc-900
        dark:border-zinc-700
        dark:bg-zinc-900
        dark:text-zinc-300
        dark:hover:bg-zinc-800
        dark:hover:text-white
      "
    >
      {dark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}