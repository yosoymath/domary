"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavigationPhase = "idle" | "loading" | "complete";

const MINIMUM_FEEDBACK_MS = 220;
const LOGOUT_FEEDBACK_PARAM = "session";
const LOGOUT_FEEDBACK_VALUE = "ended";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="m6.5 12.5 3.4 3.4 7.6-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<NavigationPhase>("idle");
  const [logoutConfirmed, setLogoutConfirmed] = useState(false);
  const phaseRef = useRef<NavigationPhase>("idle");
  const previousPathnameRef = useRef(pathname);
  const startedAtRef = useRef(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePhase = useCallback((nextPhase: NavigationPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const startNavigation = useCallback(() => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    startedAtRef.current = Date.now();
    document.documentElement.classList.add("route-changing");
    updatePhase("loading");
  }, [updatePhase]);

  const completeNavigation = useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MINIMUM_FEEDBACK_MS - elapsed);

    completionTimerRef.current = setTimeout(() => {
      document.documentElement.classList.remove("route-changing");
      updatePhase("complete");

      idleTimerRef.current = setTimeout(() => updatePhase("idle"), 260);
    }, remaining);
  }, [updatePhase]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      const sameDocumentAnchor = destination.pathname === current.pathname && destination.search === current.search && destination.hash;
      if (sameDocumentAnchor || destination.href === current.href) return;

      startNavigation();
    }

    function handleProgrammaticNavigation() {
      startNavigation();
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handleProgrammaticNavigation);
    window.addEventListener("domary:navigation-start", handleProgrammaticNavigation);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handleProgrammaticNavigation);
      window.removeEventListener("domary:navigation-start", handleProgrammaticNavigation);
    };
  }, [startNavigation]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (phaseRef.current === "loading") completeNavigation();
    }
  }, [completeNavigation, pathname]);

  useEffect(() => {
    if (searchParams.get(LOGOUT_FEEDBACK_PARAM) !== LOGOUT_FEEDBACK_VALUE) return;

    document.documentElement.classList.remove("route-changing");
    updatePhase("complete");
    setLogoutConfirmed(true);

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete(LOGOUT_FEEDBACK_PARAM);
    window.history.replaceState(window.history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);

    toastTimerRef.current = setTimeout(() => setLogoutConfirmed(false), 4200);
  }, [searchParams, updatePhase]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      document.documentElement.classList.remove("route-changing");
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="navigation-progress" data-phase={phase}>
        <span />
      </div>

      <div
        aria-atomic="true"
        aria-live="polite"
        className="session-toast"
        data-visible={logoutConfirmed}
        role="status"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-domary-yellow text-domary-black">
          <CheckIcon />
        </span>
        <span>
          <strong className="block text-sm font-bold">Sessão encerrada</strong>
          <span className="mt-0.5 block text-xs text-white/60">Você saiu da sua conta com segurança.</span>
        </span>
      </div>
    </>
  );
}
