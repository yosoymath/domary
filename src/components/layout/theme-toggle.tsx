"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const THEME_STORAGE_KEY = "domary-theme";
const THEME_CHANGE_EVENT = "domary:theme-change";
const THEME_COLOR_TRANSITION_DURATION = 180;

let themeColorFrame: number | undefined;
let themeColorTimer: number | undefined;

type ThemeToggleProps = {
  variant?: "header" | "floating";
};

/** Preferência salva: "dark" ou "light". Sem preferência, segue o sistema. */
function savedPreference(): boolean | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  if (value === "dark") return true;
  if (value === "light" || value === "classic") return false;
  return null;
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function transitionColors(update: () => void) {
  const root = document.documentElement;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }

  root.classList.add("theme-color-transition");
  if (themeColorFrame !== undefined) window.cancelAnimationFrame(themeColorFrame);
  if (themeColorTimer !== undefined) window.clearTimeout(themeColorTimer);

  themeColorFrame = window.requestAnimationFrame(() => {
    update();
    themeColorTimer = window.setTimeout(() => {
      root.classList.remove("theme-color-transition");
      themeColorTimer = undefined;
    }, THEME_COLOR_TRANSITION_DURATION);
    themeColorFrame = undefined;
  });
}

function applyDark(dark: boolean) {
  const root = document.documentElement;
  if (root.classList.contains("dark") === dark) return;

  transitionColors(() => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark } }));
  });
}

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

export function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) applyDark(savedPreference() ?? systemPrefersDark());
    };
    const syncSystemTheme = () => {
      if (savedPreference() === null) applyDark(systemPrefersDark());
    };
    const syncSamePageTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: boolean }>).detail;
      if (typeof detail?.dark === "boolean") setDark(detail.dark);
    };

    window.addEventListener("storage", syncStorage);
    window.addEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
    systemTheme.addEventListener("change", syncSystemTheme);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
      systemTheme.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    applyDark(next);
  };

  const label = dark ? "Ativar tema claro" : "Ativar tema escuro";
  const button = (
    <button
      aria-label={label}
      aria-pressed={dark}
      className={`focus-ring grid place-items-center rounded-md text-black ${variant === "floating" ? "fixed right-3 top-3 z-[100] size-12 border border-black/10 bg-white/90 shadow-[0_10px_32px_rgb(0_0_0/0.14)] hover:border-domary-yellow hover:bg-white sm:right-4 sm:top-4" : "size-10 hover:bg-black/5"}`}
      data-theme-dark={dark}
      data-theme-toggle={variant}
      onClick={toggle}
      title={label}
      type="button"
    >
      <span className={`theme-toggle-icon ${mounted ? "" : "opacity-0"}`}>{dark ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );

  if (variant === "floating") {
    return mounted ? createPortal(button, document.body) : null;
  }

  return button;
}
