"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const THEME_STORAGE_KEY = "domary-theme";
const THEME_CHANGE_EVENT = "domary:theme-change";

type ThemeToggleProps = {
  variant?: "header" | "floating";
};

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="size-[1.15rem]" fill="none" viewBox="0 0 24 24">
      <path d="M20 15.1A8.5 8.5 0 0 1 8.9 4a8.5 8.5 0 1 0 11.1 11.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden="true" className="size-[1.15rem]" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-changing");
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  window.setTimeout(() => root.classList.remove("theme-changing"), 220);
}

export function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setDark(root.classList.contains("dark"));
    setMounted(true);

    const syncTheme = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextDark = event.newValue === "dark";
      applyTheme(nextDark);
      setDark(nextDark);
    };

    const syncSamePageTheme = (event: Event) => {
      const nextDark = (event as CustomEvent<{ dark?: boolean }>).detail?.dark;
      if (typeof nextDark === "boolean") setDark(nextDark);
    };

    window.addEventListener("storage", syncTheme);
    window.addEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    applyTheme(nextDark);
    localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
    setDark(nextDark);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark: nextDark } }));
  };

  const label = dark ? "Ativar modo claro" : "Ativar modo noturno";

  const button = (
    <button
      aria-label={label}
      aria-pressed={dark}
      className={`focus-ring grid place-items-center rounded-full text-black ${variant === "floating" ? "fixed right-3 top-3 z-[100] size-12 border border-black/10 bg-white/90 shadow-[0_10px_32px_rgb(0_0_0/0.14)] backdrop-blur-md hover:border-domary-yellow hover:bg-white sm:right-4 sm:top-4" : "size-10 hover:bg-black/5"}`}
      data-theme-toggle={variant}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span className={mounted ? "" : "opacity-0"}>{dark ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );

  if (variant === "floating") {
    return mounted ? createPortal(button, document.body) : null;
  }

  return button;
}
