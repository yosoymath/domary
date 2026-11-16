"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./brand-marquee.module.css";

type Brand = {
  name: string;
  logo: string;
};

const brands: readonly Brand[] = [
  { name: "Dudalina", logo: "/media/brands/dudalina.png" },
  { name: "Individual", logo: "/media/brands/individual.jpg" },
  { name: "Acostamento", logo: "/media/brands/acostamento.png" },
  { name: "Hering", logo: "/media/brands/hering.png" },
  { name: "Pit Bull", logo: "/media/brands/pitbull jeans.png" },
  { name: "King Joe", logo: "/media/brands/kingjoe-seeklogo.png" },
  { name: "Crocker", logo: "/media/brands/crocker jeans.png" },
  { name: "Departamento", logo: "/media/brands/departamento.png" },
  { name: "Highstil", logo: "/media/brands/highstil.png" },
  { name: "Resumo", logo: "/media/brands/resumo.jpg" },
  { name: "Lopper", logo: "/media/brands/loopper.png" },
  { name: "Ognus", logo: "/media/brands/ognus.png" },
  { name: "Sallo", logo: "/media/brands/sallo-seeklogo.png" },
  { name: "Savelli", logo: "/media/brands/savelli.jpg" },
  { name: "Domary", logo: "/media/brands/domary.png" },
  { name: "Diamantes", logo: "/media/brands/diamantes.png" },
];

function BrandGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className={styles.group}>
      {brands.map((brand) => (
        <div
          aria-label={brand.name}
          className={`${styles.brand} ${styles.brandWithLogo}`}
          key={brand.name}
        >
          <span aria-hidden="true" className={styles.logoPlate}>
            <img alt="" className={styles.logo} decoding="async" draggable={false} fetchPriority="low" loading="lazy" src={brand.logo} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function BrandMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; x: number } | null>(null);
  const resumeAutomaticAtRef = useRef(0);
  const groupWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function moveTrackTo(offset: number) {
    const track = trackRef.current;
    const groupWidth = groupWidthRef.current;
    if (!track) return;

    let normalizedOffset = offset;
    if (groupWidth > 0) {
      normalizedOffset %= groupWidth;
      if (normalizedOffset > 0) normalizedOffset -= groupWidth;
    }

    offsetRef.current = normalizedOffset;
    track.style.transform = `translate3d(${normalizedOffset}px, 0, 0)`;
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const activeViewport = viewport;
    const activeTrack = track;

    let animationFrame: number | null = null;
    let previousFrameTime = 0;
    let isVisible = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function measureGroups() {
      groupWidthRef.current = activeTrack.scrollWidth / 2;
      moveTrackTo(offsetRef.current);
    }

    function stopAutomaticMovement() {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      previousFrameTime = 0;
    }

    function moveAutomatically(time: number) {
      if (!isVisible || document.hidden || reducedMotion.matches) {
        stopAutomaticMovement();
        return;
      }

      if (previousFrameTime > 0) {
        const elapsed = Math.min(time - previousFrameTime, 50);
        if (!pointerRef.current && Date.now() >= resumeAutomaticAtRef.current) {
          moveTrackTo(offsetRef.current - elapsed * 0.03);
        }
      }

      previousFrameTime = time;
      animationFrame = window.requestAnimationFrame(moveAutomatically);
    }

    function startAutomaticMovement() {
      if (animationFrame !== null || !isVisible || document.hidden || reducedMotion.matches) return;
      animationFrame = window.requestAnimationFrame(moveAutomatically);
    }

    function handleVisibilityChange() {
      if (document.hidden) stopAutomaticMovement();
      else startAutomaticMovement();
    }

    measureGroups();
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) startAutomaticMovement();
        else stopAutomaticMovement();
      },
      { rootMargin: "120px" },
    );

    visibilityObserver.observe(activeViewport);
    window.addEventListener("resize", measureGroups, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.addEventListener("change", handleVisibilityChange);

    return () => {
      stopAutomaticMovement();
      visibilityObserver.disconnect();
      window.removeEventListener("resize", measureGroups);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotion.removeEventListener("change", handleVisibilityChange);
    };
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
    };

    viewport.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pointer = pointerRef.current;
    if (
      !pointer ||
      pointer.id !== event.pointerId
    ) return;

    moveTrackTo(offsetRef.current + event.clientX - pointer.x);
    pointer.x = event.clientX;
  }

  function finishDragging(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (pointerRef.current?.id !== event.pointerId) return;

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    pointerRef.current = null;
    resumeAutomaticAtRef.current = Date.now() + 600;
    setIsDragging(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    moveTrackTo(offsetRef.current + (event.key === "ArrowRight" ? -240 : 240));
    resumeAutomaticAtRef.current = Date.now() + 600;
  }

  return (
    <section aria-labelledby="brand-marquee-title" className={styles.section}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className={styles.eyebrow}>Marcas selecionadas</p>
        <h2 className={styles.title} id="brand-marquee-title">Você encontra na Domary</h2>
        <p className={styles.hint}>Arraste ou deslize para explorar nos dois sentidos</p>
      </div>
      <div className={styles.marqueeFrame}>
        <div
          aria-label="Marcas vendidas pela Domary. Arraste para os lados ou use as setas do teclado."
          className={`${styles.viewport} ${isDragging ? styles.dragging : ""}`}
          onKeyDown={handleKeyDown}
          onPointerCancel={finishDragging}
          onPointerDown={handlePointerDown}
          onLostPointerCapture={finishDragging}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          ref={viewportRef}
          role="region"
          tabIndex={0}
        >
          <div className={styles.track} ref={trackRef}>
            <BrandGroup />
            <BrandGroup hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
