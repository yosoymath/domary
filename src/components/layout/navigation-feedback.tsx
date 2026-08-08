"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type NavigationPhase = "idle" | "loading" | "complete";

const MINIMUM_FEEDBACK_MS = 220;
const MAXIMUM_FEEDBACK_MS = 6_500;
const COMPLETION_VISIBLE_MS = 260;
const LOGOUT_FEEDBACK_PARAM = "session";
const LOGOUT_FEEDBACK_VALUE = "ended";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const { showToast } = useToast();
  const [phase, setPhase] = useState<NavigationPhase>("idle");
  const phaseRef = useRef<NavigationPhase>("idle");
  const previousRouteKeyRef = useRef(routeKey);
  const startedAtRef = useRef(0);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutHandledRef = useRef(false);

  const updatePhase = useCallback((nextPhase: NavigationPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const clearTimers = useCallback(() => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    completionTimerRef.current = null;
    idleTimerRef.current = null;
    safetyTimerRef.current = null;
  }, []);

  const completeNavigation = useCallback((immediately = false) => {
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    safetyTimerRef.current = null;
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = immediately ? 0 : Math.max(0, MINIMUM_FEEDBACK_MS - elapsed);

    completionTimerRef.current = setTimeout(() => {
      completionTimerRef.current = null;
      document.documentElement.classList.remove("route-changing");
      updatePhase("complete");

      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        updatePhase("idle");
      }, COMPLETION_VISIBLE_MS);
    }, remaining);
  }, [updatePhase]);

  const resetNavigation = useCallback(() => {
    clearTimers();
    document.documentElement.classList.remove("route-changing");
    updatePhase("idle");
  }, [clearTimers, updatePhase]);

  const startNavigation = useCallback(() => {
    clearTimers();

    startedAtRef.current = Date.now();
    document.documentElement.classList.add("route-changing");
    updatePhase("loading");
    safetyTimerRef.current = setTimeout(() => completeNavigation(true), MAXIMUM_FEEDBACK_MS);
  }, [clearTimers, completeNavigation, updatePhase]);

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

    function handlePageShow() {
      resetNavigation();
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handleProgrammaticNavigation);
    window.addEventListener("domary:navigation-start", handleProgrammaticNavigation);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handleProgrammaticNavigation);
      window.removeEventListener("domary:navigation-start", handleProgrammaticNavigation);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [resetNavigation, startNavigation]);

  useEffect(() => {
    if (previousRouteKeyRef.current !== routeKey) {
      previousRouteKeyRef.current = routeKey;
      if (phaseRef.current === "loading") completeNavigation();
    }
  }, [completeNavigation, routeKey]);

  useEffect(() => {
    if (searchParams.get(LOGOUT_FEEDBACK_PARAM) !== LOGOUT_FEEDBACK_VALUE) {
      logoutHandledRef.current = false;
      return;
    }
    if (logoutHandledRef.current) return;
    logoutHandledRef.current = true;

    clearTimers();
    document.documentElement.classList.remove("route-changing");
    updatePhase("complete");
    idleTimerRef.current = setTimeout(() => updatePhase("idle"), COMPLETION_VISIBLE_MS);
    showToast({ title: "Sessão encerrada", message: "Você saiu da sua conta com segurança.", variant: "success" });

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete(LOGOUT_FEEDBACK_PARAM);
    window.history.replaceState(window.history.state, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);

  }, [clearTimers, searchParams, showToast, updatePhase]);

  useEffect(() => {
    document.documentElement.classList.remove("route-changing");

    return () => {
      clearTimers();
      document.documentElement.classList.remove("route-changing");
    };
  }, [clearTimers]);

  return <div aria-hidden="true" className="navigation-progress" data-phase={phase}><span /></div>;
}
