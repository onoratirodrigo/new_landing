import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Branch } from "../data/branches";
import { provinceShapes } from "../data/provinceShapes";

interface Props {
  branches: Branch[];
  /** URL del mapa institucional que se muestra por defecto. */
  defaultMapUrl: string;
}

/**
 * Explorador de sucursales:
 * - Cards a la izquierda, mapa flotando a la derecha (sin caja).
 * - Hover/focus/tap sobre una card o un pin abre la ficha de la sucursal.
 *
 * La ficha no aparece: el PUNTO del mapa se agranda hasta ser la ficha.
 * Todo el recorrido se hace con una sola propiedad interpolable,
 * `clip-path: inset()`, arrancando del rectángulo exacto del pin —18x18,
 * cuadrado, con `round 50%`, que sobre un cuadrado dibuja un círculo— y
 * terminando en `inset(0 0 0 0 round 22px)`, que es la ficha entera. El
 * navegador interpola entre esos dos valores y el círculo se vuelve card sin
 * ningún corte.
 *
 * Tres detalles sostienen la ilusión, y ninguno es decorativo:
 *
 * 1. El punto es del color de la placa (brand-800), igual que la ficha, así
 *    que el arranque del crecimiento no tiene salto de color.
 * 2. El contenido está montado desde el primer cuadro, a tamaño final: lo que
 *    crece es la ventana por la que se lo ve, no una mancha que después se
 *    llena. Acompaña con una escala de 1.06 a 1 para que se lea como
 *    acercarse y no como un agujero abriéndose sobre algo quieto.
 * 3. La sombra va en `drop-shadow` y no en `box-shadow`: clip-path recorta al
 *    elemento Y a su box-shadow, así que con box-shadow la sombra aparecía de
 *    golpe al final. drop-shadow se calcula sobre la forma ya recortada y
 *    sigue al círculo desde el primer cuadro.
 *
 * Los parámetros (duración, distancia del zoom, curva) salieron de calibrar
 * el efecto en un prototipo aparte, no de elegir números redondos.
 */

/** Duración del viaje de ida. La vuelta va al 80%. */
const DUR = 420;
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
/** Cuánto se acerca el mapa mientras la ficha se abre. */
const ZOOM = 2.2;
/** Tiene que coincidir con el border-radius de .branch-sheet. */
const RADIUS = 22;
/** Fundido al cambiar de sucursal con la ficha ya abierta. */
const SWAP = 140;

type Geom = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  cx: number;
  cy: number;
};

export default function BranchExplorer({ branches, defaultMapUrl }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  /** Sucursal montada en la ficha. Sobrevive al activeId mientras cierra. */
  const [sheetBranch, setSheetBranch] = useState<Branch | null>(null);
  const [swapping, setSwapping] = useState(false);
  /** El iframe de Google Maps entra recién cuando la ficha terminó de
   *  abrirse: cargarlo durante el viaje mete un rectángulo blanco en el
   *  medio de la animación, y además evita una petición por cada hover. */
  const [settled, setSettled] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const pinRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const anims = useRef<Animation[]>([]);
  /* Cuatro temporizadores con nombre y no una bolsa común: cada uno se
     cancela en un momento distinto, y limpiarlos todos de una barría el que
     monta el iframe justo cuando la ficha termina de abrirse. */
  const hoverTimer = useRef<number | null>(null);
  const unmountTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const swapTimer = useRef<number | null>(null);
  /* La ficha está haciendo el viaje de vuelta. Si el mouse vuelve antes de
     que termine, hay que desandar el cierre en vez de dejarla escondida. */
  const closing = useRef(false);
  /** Geometría del punto, medida UNA vez al abrir con el mapa en reposo: al
   *  cerrar no se puede volver a medir porque el mapa está escalado. */
  const geom = useRef<Geom | null>(null);
  /** Hay una ficha abierta (el morph ya corrió). */
  const open = useRef(false);

  const activeId = hovered ?? pinned;

  const stop = (t: React.MutableRefObject<number | null>) => {
    if (t.current !== null) {
      window.clearTimeout(t.current);
      t.current = null;
    }
  };
  const run = (
    t: React.MutableRefObject<number | null>,
    fn: () => void,
    ms: number
  ) => {
    stop(t);
    t.current = window.setTimeout(() => {
      t.current = null;
      fn();
    }, ms);
  };
  const cancelAnims = () => {
    anims.current.forEach((a) => {
      try {
        a.cancel();
      } catch {
        /* ya terminada */
      }
    });
    anims.current = [];
    panelRef.current?.classList.remove("is-zooming");
  };

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Mide el punto dentro de la caja del panel. */
  const measure = (id: string): Geom | null => {
    const pin = pinRefs.current.get(id);
    const panel = panelRef.current;
    if (!pin || !panel) return null;
    const p = pin.getBoundingClientRect();
    const s = panel.getBoundingClientRect();
    return {
      top: p.top - s.top,
      right: s.right - p.right,
      bottom: s.bottom - p.bottom,
      left: p.left - s.left,
      cx: ((p.left + p.width / 2 - s.left) / s.width) * 100,
      cy: ((p.top + p.height / 2 - s.top) / s.height) * 100,
    };
  };

  const startClip = (g: Geom) =>
    `inset(${g.top.toFixed(1)}px ${g.right.toFixed(1)}px ${g.bottom.toFixed(
      1
    )}px ${g.left.toFixed(1)}px round 50%)`;
  const fullClip = `inset(0px 0px 0px 0px round ${RADIUS}px)`;

  /** El viaje completo: ficha, contenido, sombra y mapa. */
  const morph = (g: Geom, back: boolean) => {
    const sheet = sheetRef.current;
    const map = mapRef.current;
    const panel = panelRef.current;
    if (!sheet || !map || !panel) return;

    const d = back ? DUR * 0.8 : DUR;
    const css = getComputedStyle(document.documentElement);
    const plate = css.getPropertyValue("--brand-800").trim();
    const deep = css.getPropertyValue("--brand-900").trim();

    // Los otros seis puntos se corren del camino: la atención se va al que se
    // está abriendo antes de que empiece a abrirse.
    map.classList.toggle("is-focusing", !back);

    const shape = [
      { clipPath: startClip(g), backgroundColor: `rgb(${plate})` },
      { clipPath: fullClip, backgroundColor: `rgb(${plate})` },
    ];
    anims.current.push(
      sheet.animate(back ? [shape[1], shape[0]] : shape, {
        duration: d,
        easing: EASE,
        fill: "both",
      })
    );

    // La sombra crece con la forma recortada (ver el comentario de arriba).
    const shadow = [
      { filter: `drop-shadow(0 2px 5px rgb(${deep} / 0.55))` },
      { filter: `drop-shadow(0 18px 34px rgb(${deep} / 0.5))` },
    ];
    anims.current.push(
      sheet.animate(back ? [shadow[1], shadow[0]] : shadow, {
        duration: d,
        easing: EASE,
        fill: "both",
      })
    );

    const body = sheet.querySelector<HTMLElement>(".branch-sheet-body");
    if (body) {
      const scale = [{ transform: "scale(1.06)" }, { transform: "scale(1)" }];
      anims.current.push(
        body.animate(back ? [scale[1], scale[0]] : scale, {
          duration: d,
          easing: EASE,
          fill: "both",
        })
      );
    }

    // El mapa se acerca al punto y se disuelve. El desenfoque del medio es lo
    // que separa un movimiento de cámara de un simple cambio de escala.
    document.documentElement.style.setProperty("--pin-x", `${g.cx.toFixed(2)}%`);
    document.documentElement.style.setProperty("--pin-y", `${g.cy.toFixed(2)}%`);
    const camera: Keyframe[] = [
      { transform: "scale(1)", opacity: 1, filter: "blur(0px)" },
      { filter: "blur(2.5px)", offset: 0.5 },
      { transform: `scale(${ZOOM})`, opacity: 0, filter: "blur(0px)" },
    ];
    panel.classList.add("is-zooming");
    const cam = map.animate(back ? [...camera].reverse() : camera, {
      duration: d,
      easing: EASE,
      fill: "both",
    });
    // onfinish no corre si la animación se cancela a mitad de camino; por eso
    // cancelAnims() también saca la clase.
    cam.onfinish = () => panel.classList.remove("is-zooming");
    anims.current.push(cam);
  };

  /* Abre el morph sobre una ficha ya montada. Mide el punto recién después
     de cancelar las animaciones: cancel() devuelve el mapa a su reposo, así
     que la medición sale correcta incluso a mitad de un cierre. */
  const openMorph = (id: string) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    closing.current = false;

    if (prefersReducedMotion()) {
      sheet.style.clipPath = "";
      setSettled(true);
      return;
    }

    cancelAnims();
    const g = measure(id);
    if (!g) {
      sheet.style.clipPath = "";
      setSettled(true);
      return;
    }
    geom.current = g;
    sheet.style.clipPath = startClip(g);
    morph(g, false);
    run(settleTimer, () => setSettled(true), DUR);
  };

  /* Montar / cambiar / desmontar la ficha según la sucursal activa. */
  useEffect(() => {
    const active = branches.find((b) => b.id === activeId) ?? null;

    if (active) {
      stop(unmountTimer);

      // Primera apertura: montar. El morph lo dispara el useLayoutEffect de
      // abajo, que corre antes del primer pintado.
      if (!sheetBranch) {
        setSettled(false);
        setSheetBranch(active);
        return;
      }

      // El mouse volvió antes de que terminara el cierre: se desanda.
      if (closing.current) {
        setSettled(false);
        if (sheetBranch.id !== active.id) setSheetBranch(active);
        openMorph(active.id);
        return;
      }

      // Cambio de sucursal con la ficha abierta: no se rehace el morph. El
      // punto de la nueva está tapado por la ficha, así que hacerlo crecer
      // desde ahí no se vería, y el mapa tendría que volver a foja cero.
      if (sheetBranch.id !== active.id) {
        setSwapping(true);
        setSettled(false);
        run(
          swapTimer,
          () => {
            setSheetBranch(active);
            setSwapping(false);
            run(settleTimer, () => setSettled(true), DUR);
          },
          SWAP
        );
      }
      return;
    }

    if (sheetBranch && !closing.current) {
      stop(swapTimer);
      stop(settleTimer);
      setSettled(false);
      if (geom.current && !prefersReducedMotion()) {
        closing.current = true;
        cancelAnims();
        morph(geom.current, true);
        run(
          unmountTimer,
          () => {
            closing.current = false;
            open.current = false;
            setSheetBranch(null);
          },
          DUR * 0.8 + 30
        );
      } else {
        open.current = false;
        setSheetBranch(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, sheetBranch]);

  /* El morph de apertura va en useLayoutEffect y no en useEffect: hay que
     escribir el recorte inicial ANTES de que el navegador pinte. Si la ficha
     llega a pintarse una sola vez sin recorte, se ve la caja entera tapando
     el mapa — eso es un parpadeo. */
  useLayoutEffect(() => {
    if (!sheetBranch || open.current) return;
    open.current = true;
    openMorph(sheetBranch.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetBranch]);

  useEffect(() => {
    return () => {
      [hoverTimer, unmountTimer, settleTimer, swapTimer].forEach(stop);
      cancelAnims();
    };
  }, []);

  const openBranch = (id: string) => {
    stop(hoverTimer);
    setHovered(id);
  };
  /* 120 ms de gracia: sin eso, el hueco entre dos cards cerraría y volvería a
     abrir la ficha en cada cruce del mouse. */
  const scheduleClose = () => {
    run(hoverTimer, () => setHovered(null), 120);
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
        {/* Texto de la sección + cards */}
        <div className="lg:col-span-5">
          <div className="mb-8 md:mb-10" data-reveal="up">
            <span className="eyebrow">Sucursales</span>
            <h2 className="section-title mt-4">Llegamos a todo el país.</h2>
            <p className="lead mt-5">
              Siete puntos logísticos estratégicamente distribuidos para
              brindar una solución integral a clientes y proveedores. Pasá el
              mouse sobre cada sucursal para ver su información y ubicación.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3" onMouseLeave={scheduleClose}>
            {branches.map((b, i) => {
              const isActive = activeId === b.id;
              return (
                <li
                  key={b.id}
                  data-reveal="up"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <button
                    type="button"
                    ref={(el) => {
                      cardRefs.current.set(b.id, el);
                    }}
                    onMouseEnter={() => openBranch(b.id)}
                    onFocus={() => openBranch(b.id)}
                    onClick={() =>
                      setPinned((p) => (p === b.id ? null : b.id))
                    }
                    aria-pressed={pinned === b.id}
                    aria-describedby="branch-panel"
                    className={`plate plate-grid plate-hover w-full text-left p-4 ${
                      isActive ? "is-active" : ""
                    }`}
                  >
                    {/* La silueta de la provincia con el punto de la ciudad
                        en su posición real. */}
                    <svg
                      className="plate-art plate-art-province"
                      viewBox="0 0 100 100"
                      aria-hidden="true"
                    >
                      <path
                        className="shape"
                        d={provinceShapes[b.province.shape]}
                      />
                      <circle
                        className="pin"
                        cx={b.province.pin.x}
                        cy={b.province.pin.y}
                        r={4}
                      />
                    </svg>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-white truncate">
                        {b.city}
                      </div>
                      <div className="text-xs text-white/65 truncate">
                        {b.region}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Panel: el mapa flota sin caja y la ficha crece desde el punto */}
        <div
          id="branch-panel"
          ref={panelRef}
          data-reveal="from-right"
          className="lg:col-span-7 branch-panel"
          onMouseEnter={() => stop(hoverTimer)}
          onMouseLeave={scheduleClose}
        >
          <DefaultMap
            mapUrl={defaultMapUrl}
            branches={branches}
            mapRef={mapRef}
            pinRefs={pinRefs}
            onPinEnter={(id) => openBranch(id)}
            onPinClick={(id) => setPinned((p) => (p === id ? null : id))}
            activeId={activeId}
          />

          {/* Sin key: la ficha NO se remonta al cambiar de sucursal. Si se
              remontara, el nodo nuevo perdería la sombra —que vive en una
              animación con fill: both sobre el nodo viejo— y la card quedaría
              plana después del primer cambio. */}
          {sheetBranch && (
            <BranchSheet
              branch={sheetBranch}
              sheetRef={sheetRef}
              swapping={swapping}
              settled={settled}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Mapa institucional + pines                                          */
/* ─────────────────────────────────────────────────────────────────── */
function DefaultMap({
  mapUrl,
  branches,
  mapRef,
  pinRefs,
  onPinEnter,
  onPinClick,
  activeId,
}: {
  mapUrl: string;
  branches: Branch[];
  mapRef: React.MutableRefObject<HTMLDivElement | null>;
  pinRefs: React.MutableRefObject<Map<string, HTMLButtonElement | null>>;
  onPinEnter: (id: string) => void;
  onPinClick: (id: string) => void;
  activeId: string | null;
}) {
  // Los pines aparecen de a uno (en cascada) recién cuando el mapa entra en
  // el viewport, en vez de estar todos ahí desde el primer render.
  const [pinsRevealed, setPinsRevealed] = useState(false);
  const clipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clipRef.current) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
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
      { threshold: 0.3 }
    );
    observer.observe(clipRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="branch-map-clip" ref={clipRef}>
      <div className="branch-map" ref={mapRef}>
        <img
          src={mapUrl}
          alt="Mapa de Argentina con los siete puntos logísticos de Etman"
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
              ref={(el) => {
                pinRefs.current.set(b.id, el);
              }}
              onMouseEnter={() => onPinEnter(b.id)}
              onFocus={() => onPinEnter(b.id)}
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* La ficha: el punto agrandado                                        */
/* ─────────────────────────────────────────────────────────────────── */
function BranchSheet({
  branch,
  sheetRef,
  swapping,
  settled,
}: {
  branch: Branch;
  sheetRef: React.MutableRefObject<HTMLDivElement | null>;
  swapping: boolean;
  settled: boolean;
}) {
  return (
    <div ref={sheetRef} className="branch-sheet">
      <div
        className={`branch-sheet-body flex flex-col h-full ${
          swapping ? "is-swapping" : ""
        }`}
      >
        <div className="grid sm:grid-cols-5 flex-1 min-h-0">
          <div className="sm:col-span-2 relative bg-brand-900 min-h-[150px] overflow-hidden">
            <img
              src={branch.image}
              alt={`Sucursal Etman ${branch.city}`}
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              loading="lazy"
              decoding="async"
            />
            {/* El degradé hace legible el badge sobre cualquier foto. */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900/10 to-brand-900/75" />
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand-900/80 border border-white/25 px-2.5 py-1 text-[11px] font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Sucursal
            </div>
          </div>

          <div className="sm:col-span-3 p-5 md:p-6 space-y-4 overflow-auto">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/60 font-semibold">
                {branch.region}
              </div>
              <h3 className="font-display font-extrabold tracking-tighter2 text-2xl md:text-3xl text-white leading-tight mt-1">
                {branch.city}
              </h3>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="ico-hit flex items-start gap-2.5 text-white/85">
                <svg
                  className="mt-0.5 shrink-0 text-white/60"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  data-ico="pin"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{branch.address}</span>
              </div>

              {branch.phone && (
                <a
                  href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`}
                  className="ico-hit flex items-start gap-2.5 text-white/85 hover:text-white transition-colors"
                >
                  <svg
                    className="mt-0.5 shrink-0 text-white/60"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    data-ico="phone"
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
                  className="ico-hit flex items-start gap-2.5 text-white/85 hover:text-white transition-colors"
                >
                  <svg
                    className="mt-0.5 shrink-0 text-white/60"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    data-ico="mail"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" data-ico-part="flap" />
                  </svg>
                  <span className="break-all">{e}</span>
                </a>
              ))}
            </div>

            {branch.hours.length > 0 && (
              <div className="border-t border-dashed border-white/20 pt-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-1.5">
                  Horarios de atención
                </div>
                <ul className="text-sm text-white/75 space-y-1">
                  {branch.hours.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* El embed entra recién con la ficha abierta: durante el viaje sería
            un rectángulo blanco en el medio de la animación. */}
        <div className="relative h-[30%] min-h-[130px] bg-brand-900 border-t border-white/15">
          {settled && (
            <iframe
              src={branch.mapEmbed}
              title={`Mapa de la sucursal ${branch.city}`}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      </div>
    </div>
  );
}
