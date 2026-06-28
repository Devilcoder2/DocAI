"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Theme"
      className="p-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-100 dark:bg-slate-905 text-slate-700 dark:text-slate-200 hover:scale-105 transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
    >
      {theme === "light" ? (
        <>
          <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500/20" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider md:inline hidden">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider md:inline hidden">Light Mode</span>
        </>
      )}
    </button>
  );
}
