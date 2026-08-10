"use client";

import { useEffect, useRef, useState } from "react";

type ProductImage = {
  id: string;
  url: string;
  alt: string;
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  productName: string;
};

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousBodyOverflowRef = useRef("");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function restorePageScroll() {
      document.body.style.overflow = previousBodyOverflowRef.current;
    }

    dialog.addEventListener("close", restorePageScroll);

    return () => {
      dialog.removeEventListener("close", restorePageScroll);
      restorePageScroll();
    };
  }, []);

  function openImage(index: number) {
    setActiveIndex(index);
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
        {images.map((image, index) => {
          const imageAlt = image.alt || `${productName} — foto ${index + 1}`;

          return (
            <figure className="relative aspect-square w-[86vw] max-w-[34rem] shrink-0 snap-center overflow-hidden bg-[#f5f5f5] lg:w-auto lg:max-w-none" key={image.id}>
              <button
                aria-label={`Ampliar ${imageAlt}`}
                className="focus-ring group size-full cursor-zoom-in"
                onClick={() => openImage(index)}
                type="button"
              >
                <img
                  alt={imageAlt}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  src={image.url}
                />
                <span className="absolute left-3 top-3 rounded-full bg-[rgba(255,255,255,0.9)] px-3 py-1.5 text-[10px] font-bold text-[#111] shadow-sm">
                  Ampliar foto
                </span>
              </button>
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[rgba(255,255,255,0.9)] px-2.5 py-1 text-[10px] font-medium text-[#111] shadow-sm">
                {index + 1}/{images.length}
              </span>
            </figure>
          );
        })}
      </div>

      {images.length > 1 ? <p className="mt-2 text-center text-[10px] font-bold text-black/35 lg:hidden">Deslize para ver mais fotos</p> : null}

      <dialog
        aria-label={`Foto ampliada de ${productName}`}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-white outline-none backdrop:bg-black/10 backdrop:backdrop-blur-xl"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        onKeyDown={(event) => {
          if (images.length < 2) return;
          if (event.key === "ArrowLeft") showPrevious();
          if (event.key === "ArrowRight") showNext();
        }}
        ref={dialogRef}
      >
        <div className="relative size-full overflow-hidden">
          <p aria-live="polite" className="sr-only">Foto {activeIndex + 1} de {images.length}</p>
          <button
            aria-label="Fechar foto ampliada"
            autoFocus
            className="focus-ring absolute right-4 top-4 z-20 grid size-12 place-items-center border-0 bg-transparent text-4xl font-light leading-none text-white drop-shadow-lg transition-opacity hover:opacity-65 sm:right-6 sm:top-6"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            ×
          </button>

          {activeImage ? (
            <div className="absolute inset-0 flex min-h-0 min-w-0 items-center justify-center p-5 sm:p-12">
              <img
                alt={activeImage.alt || `${productName} — foto ${activeIndex + 1}`}
                className="h-auto w-auto max-h-[82dvh] max-w-[90vw] object-contain sm:max-h-[86dvh] sm:max-w-[84vw]"
                decoding="async"
                src={activeImage.url}
              />
            </div>
          ) : null}

          {images.length > 1 ? (
            <>
              <button
                aria-label="Ver foto anterior"
                className="focus-ring absolute bottom-4 left-4 z-10 grid size-12 place-items-center border-0 bg-transparent text-5xl font-light text-white drop-shadow-lg transition-opacity hover:opacity-65 sm:bottom-auto sm:left-6 sm:top-1/2 sm:-translate-y-1/2"
                onClick={showPrevious}
                type="button"
              >
                ‹
              </button>
              <button
                aria-label="Ver próxima foto"
                className="focus-ring absolute bottom-4 right-4 z-10 grid size-12 place-items-center border-0 bg-transparent text-5xl font-light text-white drop-shadow-lg transition-opacity hover:opacity-65 sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2"
                onClick={showNext}
                type="button"
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
