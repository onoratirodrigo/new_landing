import { useEffect, useRef, useState } from "react";
import type { Branch } from "../data/branches";

interface Props {
  branches: Branch[];
  /** URL del mapa institucional que se muestra por defecto. */
  defaultMapUrl: string;
}

/**
 * Explorador de sucursales:
 * - Cards a la izquierda + panel con mapa o detalle a la derecha.
 * - Pines interactivos sobre el mapa de Argentina.
 * - Hover/focus/tap (sobre una card o un pin) abre el detalle con un reveal
 *   animado cuyo origen es el elemento que disparó la acción.
 */
export default function BranchExplorer({ branches, defaultMapUrl }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [revealOrigin, setRevealOrigin] = useState({ x: 50, y: 50 });

  const closeTimer = useRef<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const panelRef = useRef<HTMLDivElement | null>(null);

  const activeId = hovered ?? pinned;
  const active = branches.find((b) => b.id === activeId) ?? null;

  /** Calcula el origen del clip-path a partir de un elemento source. */
  const setRevealOriginFromElement = (element: Element | null) => {
    const panel = panelRef.current;
    if (!element || !panel) return;
    const elRect = element.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const cx = elRect.left + elRect.width / 2 - panelRect.left;
    const cy = elRect.top + elRect.height / 2 - panelRect.top;
    const x = (cx / panelRect.width) * 100;
    const y = (cy / panelRect.height) * 100;
    setRevealOrigin({ x, y });
  };

  /** Abre el detalle de una sucursal. `source` permite usar la posición de
   *  un pin (sobre el panel) como origen del reveal en vez de la card. */
  const open = (id: string, source?: Element | null) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setRevealOriginFromElement(source ?? cardRefs.current.get(id) ?? null);
    setHovered(id);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHovered(null), 120);
  };

  // Cerrar el pin con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(null);
        setHovered(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Cards */}
        <div className="lg:col-span-5">
          <ul className="grid grid-cols-2 gap-3" onMouseLeave={scheduleClose}>
            {branches.map((b) => {
              const isActive = activeId === b.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      cardRefs.current.set(b.id, el);
                    }}
                    onMouseEnter={() => open(b.id)}
                    onFocus={() => open(b.id)}
                    onClick={() =>
                      setPinned((p) => (p === b.id ? null : b.id))
                    }
                    aria-pressed={pinned === b.id}
                    aria-describedby="branch-panel"
                    className={`group w-full text-left rounded-xl border p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                      isActive
                        ? "border-brand-500 bg-brand-50/60 shadow-sm"
                        : "border-ink-100 hover:border-brand-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                          isActive
                            ? "bg-brand-500"
                            : "bg-ink-200 group-hover:bg-brand-500"
                        }`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="font-display font-bold text-ink-900 truncate">
                          {b.city}
                        </div>
                        <div className="text-xs text-ink-500 truncate">
                          {b.region}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Panel: mapa institucional o detalle de la sucursal */}
        <div
          id="branch-panel"
          className="lg:col-span-7 relative"
          onMouseEnter={() => {
            if (closeTimer.current) window.clearTimeout(closeTimer.current);
          }}
          onMouseLeave={scheduleClose}
        >
          <div
            ref={panelRef}
            className="relative rounded-3xl border border-ink-100 bg-white overflow-hidden shadow-soft"
            style={
              {
                "--reveal-x": `${revealOrigin.x}%`,
                "--reveal-y": `${revealOrigin.y}%`,
              } as React.CSSProperties
            }
          >
            {active ? (
              <BranchDetail key={active.id} branch={active} />
            ) : (
              <DefaultMap
                key="default"
                mapUrl={defaultMapUrl}
                branches={branches}
                onPinEnter={(id, el) => open(id, el)}
                onPinClick={(id) =>
                  setPinned((p) => (p === id ? null : id))
                }
                activeId={activeId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Vista por defecto: mapa institucional + pines                       */
/* ─────────────────────────────────────────────────────────────────── */
function DefaultMap({
  mapUrl,
  branches,
  onPinEnter,
  onPinClick,
  activeId,
}: {
  mapUrl: string;
  branches: Branch[];
  onPinEnter: (id: string, el: Element) => void;
  onPinClick: (id: string) => void;
  activeId: string | null;
}) {
  // Los pines aparecen de a uno (en cascada) recién cuando el mapa entra en
  // el viewport, en vez de estar todos ahí desde el primer render.
  const [pinsRevealed, setPinsRevealed] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setPinsRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPinsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="branch-anim-default bg-gradient-to-br from-brand-50 via-white to-brand-50 p-6 md:p-10">
      <div className="relative" ref={mapRef}>
        <img
          src={mapUrl}
          alt="Mapa de Argentina con los siete puntos logísticos de Etman"
          className="w-full h-auto object-contain select-none pointer-events-none"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {branches.map((b, i) => {
          const isActive = activeId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onMouseEnter={(e) => onPinEnter(b.id, e.currentTarget)}
              onFocus={(e) => onPinEnter(b.id, e.currentTarget)}
              onClick={() => onPinClick(b.id)}
              aria-label={`Sucursal ${b.city}`}
              className={`branch-pin ${isActive ? "is-active" : ""}`}
              style={{
                left: `${b.mapPosition.x}%`,
                top: `${b.mapPosition.y}%`,
              }}
            >
              <span
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  pinsRevealed ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}
                style={{ transitionDelay: pinsRevealed ? `${i * 90}ms` : "0ms" }}
              >
                <span className="branch-pin-pulse" aria-hidden="true" />
                <span className="branch-pin-dot" aria-hidden="true" />
                <span className="branch-pin-label">{b.city}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 border border-ink-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600 font-semibold">
              Capacidad
            </div>
            <div className="font-display font-bold text-ink-900 text-lg">
              24.000 m² de almacenamiento
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs uppercase tracking-widest text-brand-600 font-semibold">
              Logística
            </div>
            <div className="font-display font-bold text-ink-900 text-lg">
              7 puntos en el país
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Vista de detalle                                                    */
/* ─────────────────────────────────────────────────────────────────── */
function BranchDetail({ branch }: { branch: Branch }) {
  const [animating, setAnimating] = useState(true);

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === "branch-reveal") setAnimating(false);
  };

  return (
    <div
      className={`flex flex-col ${animating ? "branch-anim-reveal" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="grid sm:grid-cols-5 gap-0">
        <div className="sm:col-span-2 relative aspect-[4/3] sm:aspect-auto sm:min-h-full bg-ink-100">
          <img
            src={branch.image}
            alt={`Sucursal Etman ${branch.city}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Sucursal
          </div>
        </div>

        <div className="sm:col-span-3 p-5 md:p-7 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-600 font-semibold">
              {branch.region}
            </div>
            <h3 className="font-display font-extrabold tracking-tighter2 text-2xl md:text-3xl text-ink-900 leading-tight mt-1">
              {branch.city}
            </h3>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5 text-ink-700">
              <svg
                className="mt-0.5 shrink-0 text-brand-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{branch.address}</span>
            </div>

            {branch.phone && (
              <a
                href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`}
                className="flex items-start gap-2.5 text-ink-700 hover:text-brand-600 transition-colors"
              >
                <svg
                  className="mt-0.5 shrink-0 text-brand-500"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{branch.phone}</span>
              </a>
            )}

            {branch.emails.map((e) => (
              <a
                key={e}
                href={`mailto:${e}`}
                className="flex items-start gap-2.5 text-ink-700 hover:text-brand-600 transition-colors"
              >
                <svg
                  className="mt-0.5 shrink-0 text-brand-500"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="break-all">{e}</span>
              </a>
            ))}
          </div>

          {branch.hours.length > 0 && (
            <div className="rounded-xl bg-ink-50 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 mb-1.5">
                Horarios de atención
              </div>
              <ul className="text-sm text-ink-700 space-y-1">
                {branch.hours.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="relative aspect-[16/9] sm:aspect-[16/7] bg-ink-100 border-t border-ink-100">
        <iframe
          src={branch.mapEmbed}
          title={`Mapa de la sucursal ${branch.city}`}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
