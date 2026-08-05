import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketSlide } from "../data/marketSlides";

interface Props {
  slides: MarketSlide[];
  /** ms entre slides (autoplay). Pasar 0 para desactivar. */
  interval?: number;
}

/**
 * Carrusel del bloque Etman Market.
 * - Autoplay con pausa al hover / focus / cuando la pestaña no es visible.
 * - Navegación por flechas, dots, teclado (← →) y swipe táctil.
 * - Transición por translateX, sin libs externas.
 */
export default function MarketCarousel({ slides, interval = 5500 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const total = slides.length;
  const goTo = useCallback(
    (i: number) => setIndex(((i % total) + total) % total),
    [total],
  );
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  // Autoplay
  useEffect(() => {
    if (!interval || paused || total < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval, paused, total]);

  // Pausar cuando la pestaña no es visible
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Navegación por teclado cuando el carrusel está enfocado
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  // Swipe touch
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  if (total === 0) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Vistas del nuevo Etman Market"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative outline-none"
    >
      {/* Viewport del carrusel — sin marco, los slides van limpios */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-50 aspect-[16/10] shadow-2xl ring-1 ring-black/5">
          <div
            className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
            aria-live="polite"
          >
            {slides.map((s, i) => (
              <div
                key={s.src}
                className="relative h-full w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                aria-hidden={i !== index}
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
                {s.caption && (
                  <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-sm rounded-lg bg-ink-900/85 text-white text-xs sm:text-sm px-3 py-2 backdrop-blur">
                    {s.caption}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Flechas */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Slide anterior"
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-md ring-1 ring-black/5 hover:bg-white transition"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Slide siguiente"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-md ring-1 ring-black/5 hover:bg-white transition"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </>
          )}
        </div>

      {/* Dots */}
      {total > 1 && (
        <div
          className="mt-5 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Seleccionar slide"
        >
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Ir al slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  active
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
