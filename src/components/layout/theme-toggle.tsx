"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const THEME_STORAGE_KEY = "domary-theme";
const ACCENT_STORAGE_KEY = "domary-accent";
const THEME_CHANGE_EVENT = "domary:theme-change";
const ACCENT_CHANGE_EVENT = "domary:accent-change";
const THEME_COLOR_TRANSITION_DURATION = 180;
const DEFAULT_ACCENT = "#f5c400";

let themeColorFrame: number | undefined;
let themeColorTimer: number | undefined;

type ThemeMode = "classic" | "light" | "dark" | "system";

type ThemeToggleProps = {
  variant?: "header" | "floating";
};

const themeOptions: Array<{ id: ThemeMode; label: string; description: string }> = [
  { id: "classic", label: "Padrão", description: "Visual clássico da Domary" },
  { id: "light", label: "Claro", description: "Interface branca e luminosa" },
  { id: "dark", label: "Dark", description: "Interface escura completa" },
  { id: "system", label: "Sistema", description: "Segue o tema do dispositivo" },
];

const accentOptions = [
  { label: "Dourado", value: DEFAULT_ACCENT },
  { label: "Azul", value: "#3b82f6" },
  { label: "Verde", value: "#2f8f74" },
  { label: "Violeta", value: "#7c5ab6" },
  { label: "Rosa", value: "#c94f7c" },
  { label: "Terracota", value: "#c96b49" },
] as const;

function normalizeThemeMode(value: string | null): ThemeMode {
  return value === "classic" || value === "light" || value === "dark" || value === "system" ? value : "system";
}

function normalizeAccent(value: string | null) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_ACCENT;
}

function mixWithWhite(hex: string, amount = 0.52) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function accentContrast(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.42 ? "#111111" : "#ffffff";
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

function resolveDark(mode: ThemeMode) {
  return mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const dark = resolveDark(mode);
  if (root.dataset.themeMode === mode && root.classList.contains("dark") === dark) return;

  transitionColors(() => {
    root.dataset.themeMode = mode;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { dark, mode } }));
  });
}

function applyAccent(value: string) {
  const root = document.documentElement;
  const accent = normalizeAccent(value);
  if (root.style.getPropertyValue("--color-domary-yellow") === accent) return;

  root.style.setProperty("--color-domary-yellow", accent);
  root.style.setProperty("--color-domary-yellow-light", mixWithWhite(accent));
  root.style.setProperty("--color-domary-accent-contrast", accentContrast(accent));
  window.dispatchEvent(new CustomEvent(ACCENT_CHANGE_EVENT, { detail: { accent } }));
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

function PaletteIcon() {
  return (
    <svg aria-hidden="true" className="size-[1.15rem]" fill="none" viewBox="0 0 24 24">
      <path d="M12 3a9 9 0 0 0 0 18h1.15a1.9 1.9 0 0 0 1.2-3.37 1.8 1.8 0 0 1 1.13-3.2H18A3 3 0 0 0 21 11.4 8.99 8.99 0 0 0 12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.65" />
      <path d="M7.5 10h.01M9.5 6.8h.01M13.4 6.5h.01M16.5 8.7h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg aria-hidden="true" className="size-[1.15rem]" fill="none" viewBox="0 0 24 24">
      <path d="M4 5.5h16v11H4zM2.5 19.5h19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
    </svg>
  );
}

function CheckIcon() {
  return <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20"><path d="m4 10 3.5 3.5L16 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

function ThemeOptionIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "classic") return <PaletteIcon />;
  if (mode === "light") return <SunIcon />;
  if (mode === "dark") return <MoonIcon />;
  return <DeviceIcon />;
}

export function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("system");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const initialMode = normalizeThemeMode(localStorage.getItem(THEME_STORAGE_KEY));
    const initialAccent = normalizeAccent(localStorage.getItem(ACCENT_STORAGE_KEY));
    setDark(root.classList.contains("dark"));
    setMode(initialMode);
    setAccent(initialAccent);
    setMounted(true);

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) applyTheme(normalizeThemeMode(event.newValue));
      if (event.key === ACCENT_STORAGE_KEY) applyAccent(normalizeAccent(event.newValue));
    };
    const syncSystemTheme = () => {
      if (normalizeThemeMode(localStorage.getItem(THEME_STORAGE_KEY)) === "system") applyTheme("system");
    };
    const syncSamePageTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: boolean; mode?: ThemeMode }>).detail;
      if (typeof detail?.dark === "boolean") setDark(detail.dark);
      if (detail?.mode) setMode(detail.mode);
    };
    const syncSamePageAccent = (event: Event) => {
      const nextAccent = (event as CustomEvent<{ accent?: string }>).detail?.accent;
      if (nextAccent) setAccent(nextAccent);
    };

    window.addEventListener("storage", syncStorage);
    window.addEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
    window.addEventListener(ACCENT_CHANGE_EVENT, syncSamePageAccent);
    systemTheme.addEventListener("change", syncSystemTheme);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, syncSamePageTheme);
      window.removeEventListener(ACCENT_CHANGE_EVENT, syncSamePageAccent);
      systemTheme.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [open]);

  const selectTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  };

  const selectAccent = (nextAccent: string) => {
    const normalized = normalizeAccent(nextAccent);
    setAccent(normalized);
    localStorage.setItem(ACCENT_STORAGE_KEY, normalized);
    applyAccent(normalized);
  };

  const restoreDefaults = () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(ACCENT_STORAGE_KEY);
    setMode("system");
    setAccent(DEFAULT_ACCENT);
    applyTheme("system");
    applyAccent(DEFAULT_ACCENT);
  };

  const label = "Configurar aparência";
  const button = (
    <button
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={label}
      className={`focus-ring grid place-items-center rounded-md text-black ${variant === "floating" ? "fixed right-3 top-3 z-[100] size-12 border border-black/10 bg-white/90 shadow-[0_10px_32px_rgb(0_0_0/0.14)] hover:border-domary-yellow hover:bg-white sm:right-4 sm:top-4" : "size-10 hover:bg-black/5"}`}
      data-theme-dark={dark}
      data-theme-toggle={variant}
      onClick={() => setOpen(true)}
      ref={triggerRef}
      title={label}
      type="button"
    >
      <span className={`theme-toggle-icon ${mounted ? "" : "opacity-0"}`}>{dark ? <SunIcon /> : <MoonIcon />}</span>
    </button>
  );

  const appearanceDialog = mounted && open ? createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-6">
      <button aria-label="Fechar configurações de aparência" className="absolute inset-0 cursor-default bg-[#000000]/50" onClick={() => setOpen(false)} type="button" />
      <section aria-labelledby={`appearance-title-${variant}`} aria-modal="true" className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[34rem] overflow-y-auto overscroll-contain rounded-[1.7rem] border border-black/12 bg-domary-cream p-5 text-black shadow-[0_22px_64px_rgb(0_0_0/0.3)] sm:p-6" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black" id={`appearance-title-${variant}`}>Aparência da loja</h2>
            <p className="mt-1 text-xs leading-5 text-black/50">O tema e a cor são aplicados em toda a experiência.</p>
          </div>
          <button aria-label="Fechar" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-xl text-black/45 hover:bg-black/5 hover:text-black" onClick={() => setOpen(false)} ref={closeRef} type="button">×</button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-[10px] font-black tracking-[0.16em] text-black/45 uppercase">Tema completo</legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {themeOptions.map((option) => {
              const selected = mode === option.id;
              return (
                <button
                  aria-pressed={selected}
                  className={`focus-ring relative flex min-h-[4.6rem] items-center gap-3 rounded-2xl border p-3 text-left ${selected ? "border-domary-yellow bg-domary-yellow/10" : "border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.035]"}`}
                  key={option.id}
                  onClick={() => selectTheme(option.id)}
                  type="button"
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl border ${selected ? "border-domary-yellow/35 bg-domary-yellow/15 text-domary-yellow" : "border-black/8 bg-black/[0.035] text-black/65"}`}><ThemeOptionIcon mode={option.id} /></span>
                  <span className="min-w-0"><strong className="block text-sm font-black">{option.label}</strong><span className="mt-0.5 block text-[10px] leading-[1.25] text-black/48">{option.description}</span></span>
                  {selected ? <span className="absolute right-2.5 top-2.5 text-domary-yellow"><CheckIcon /></span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="my-5 h-px bg-black/10" />

        <fieldset>
          <legend className="text-[10px] font-black tracking-[0.16em] text-black/45 uppercase">Cor de destaque</legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {accentOptions.map((option) => {
              const selected = accent === option.value;
              return (
                <button
                  aria-pressed={selected}
                  className={`focus-ring flex min-h-11 items-center gap-2 rounded-xl border px-2.5 text-left text-xs font-bold ${selected ? "border-domary-yellow bg-domary-yellow/10" : "border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.035]"}`}
                  key={option.value}
                  onClick={() => selectAccent(option.value)}
                  type="button"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full text-white shadow-sm" style={{ backgroundColor: option.value }}>{selected ? <CheckIcon /> : null}</span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white px-4 py-3 hover:border-black/20 hover:bg-black/[0.035]">
          <span><strong className="block text-xs font-black">Cor personalizada</strong><span className="mt-1 block font-mono text-[10px] uppercase text-black/48">{accent}</span></span>
          <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-black/15 bg-black/[0.035]">
            <span className="size-7 rounded-md shadow-sm" style={{ backgroundColor: accent }} />
            <input aria-label="Escolher cor personalizada" className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => selectAccent(event.target.value)} type="color" value={accent} />
          </span>
        </label>

        <button className="focus-ring mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-black/10 text-xs font-bold text-black/65 hover:border-black/20 hover:bg-black/[0.035] hover:text-black" onClick={restoreDefaults} type="button">
          <span aria-hidden="true" className="text-base">↶</span> Restaurar aparência padrão
        </button>

        <p className="mt-3 text-[10px] leading-4 text-black/42">Suas preferências ficam salvas neste dispositivo e são reaplicadas automaticamente.</p>
      </section>
    </div>,
    document.body,
  ) : null;

  if (variant === "floating") {
    return mounted ? createPortal(<>{button}{appearanceDialog}</>, document.body) : null;
  }

  return <>{button}{appearanceDialog}</>;
}
