"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./brand-marquee.module.css";

type Brand = {
  name: string;
  detail?: string;
  logo?: string;
};

const brands: readonly Brand[] = [
  { name: "Dudalina", logo: "/media/brands/dudalina.png" },
  { name: "Individual", logo: "/media/brands/individual.jpg" },
  { name: "Acostamento", logo: "/media/brands/acostamento.png" },
  { name: "Hering", logo: "/media/brands/hering.png" },
  {
    name: "Pit Bull",
    detail: "Jeans & Alfaiataria",
    logo: "/media/brands/pitbull jeans.png",
  },
  { name: "King Joe", logo: "/media/brands/kingjoe-seeklogo.png" },
  {
    name: "Crocker",
    detail: "Jeans",
    logo: "/media/brands/crocker jeans.png",
  },
  { name: "Departamento", logo: "/media/brands/departamento.png" },
  {
    name: "Highstil",
    detail: "Jeans & Alfaiataria",
    logo: "/media/brands/highstil.png",
  },
  {
    name: "Resumo",
    detail: "Jeans & Alfaiataria",
    logo: "/media/brands/resumo.jpg",
  },
  { name: "Lopper", detail: "Jeans", logo: "/media/brands/loopper.png" },
  { name: "Ognus", detail: "Jeans", logo: "/media/brands/ognus.png" },
  { name: "Sallo", logo: "/media/brands/sallo-seeklogo.png" },
  { name: "D&0" },
  { name: "Savelli", detail: "Calçados", logo: "/media/brands/savelli.jpg" },
  { name: "Domary", detail: "Calçados", logo: "/media/brands/domary.png" },
  {
    name: "Diamantes",
    detail: "Lingerie",
    logo: "/media/brands/diamantes.png",
  },
];

function BrandGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className={styles.group}>
      {brands.map((brand) => (
        <div
          aria-label={`${brand.name}${brand.detail ? ` ${brand.detail}` : ""}`}
          className={`${styles.brand} ${brand.logo ? styles.brandWithLogo : ""}`}
          key={`${brand.name}-${brand.detail ?? "marca"}`}
        >
          {brand.logo ? (
            <>
              <span aria-hidden="true" className={styles.logoPlate}>
                <img className={styles.logo} src={brand.logo} alt="" />
              </span>
              {brand.detail ? (
                <span aria-hidden="true" className={styles.logoDetail}>
                  {brand.detail}
                </span>
              ) : null}
            </>
          ) : (
            <>
              <span aria-hidden="true" className={styles.mark}>
                {brand.name.slice(0, 2)}
              </span>
              <span className={styles.name}>
                {brand.name}
                {brand.detail ? <span className={styles.detail}>{brand.detail}</span> : null}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function BrandMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; x: number } | null>(null);
  const touchingRef = useRef(false);
  const resumeAutomaticAtRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function normalizePosition(viewport: HTMLDivElement) {
    const groupWidth = viewport.scrollWidth / 2;

    if (groupWidth <= 0) return;

    if (viewport.scrollLeft >= groupWidth) {
      viewport.scrollLeft -= groupWidth;
    } else if (viewport.scrollLeft <= 0) {
      viewport.scrollLeft += groupWidth;
    }
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollLeft = viewport.scrollWidth / 2;

    const movementInterval = window.setInterval(() => {
      if (
        !pointerRef.current &&
        !touchingRef.current &&
        Date.now() >= resumeAutomaticAtRef.current
      ) {
        viewport.scrollLeft += 0.8;
        normalizePosition(viewport);
      }
    }, 24);

    return () => window.clearInterval(movementInterval);
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || event.pointerType === "touch") return;

    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
    };

    viewport.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (
      !viewport ||
      !pointer ||
      pointer.id !== event.pointerId
    ) return;

    viewport.scrollLeft -= event.clientX - pointer.x;
    pointer.x = event.clientX;
    normalizePosition(viewport);
  }

  function finishDragging(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (pointerRef.current?.id !== event.pointerId) return;

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    pointerRef.current = null;
    setIsDragging(false);
  }

  function handleTouchStart() {
    touchingRef.current = true;
    resumeAutomaticAtRef.current = Number.POSITIVE_INFINITY;
  }

  function handleTouchEnd() {
    touchingRef.current = false;
    resumeAutomaticAtRef.current = Date.now() + 600;
  }

  function handleScroll() {
    const resumeAt = resumeAutomaticAtRef.current;

    if (resumeAt === Number.POSITIVE_INFINITY || resumeAt > Date.now()) {
      resumeAutomaticAtRef.current = Date.now() + 350;
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

    event.preventDefault();
    viewport.scrollLeft += event.key === "ArrowRight" ? 240 : -240;
    normalizePosition(viewport);
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
          onScroll={handleScroll}
          onTouchCancel={handleTouchEnd}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          ref={viewportRef}
          role="region"
          tabIndex={0}
        >
          <div className={styles.track}>
            <BrandGroup />
            <BrandGroup hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
