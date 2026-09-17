import { useCallback, useEffect, useRef, useState } from "react";
import type { Branch } from "../data/branches";
import BranchExplorer from "./BranchExplorer";
import BranchSlices from "./BranchSlices";

interface Props {
  branches: Branch[];
  /** URL del mapa institucional que usa la vista 1. */
  defaultMapUrl: string;
}

/**
 * Las dos maquetas de Sucursales montadas sobre las caras de un cubo que rota
 * en el eje X: la vista 1 (mapa + fichas) es la cara frontal, la vista 2
 * (tajos) es la cara de ABAJO. Apretar "2" gira el cubo -90°, la frontal se va
 * hacia arriba y la de abajo sube a ocupar su lugar.
 *
 * El único número delicado es la profundidad. Un cubo cierra si cada cara está
 * empujada media altura hacia afuera, así que las dos llevan
 * translateZ(--h / 2) y el contenedor mide --h: mientras esa variable sea la
 * misma para las dos, la arista donde se doblan queda pegada.
 *
 * El problema es que las dos vistas NO miden lo mismo, y fijar --h al alto de
 * la más grande dejaría media pantalla de magenta vacío en la otra —sobre todo
 * en mobile, donde la vista 1 apila mapa y fichas—. Entonces --h se anima
 * junto con la rotación: está registrada con @property (ver global.css), así
 * que interpola como longitud y el translateZ de las caras la sigue cuadro a
 * cuadro. El cubo se estira mientras gira, pero nunca se abre.
 *
 * Las alturas se miden sobre el CONTENIDO de cada cara y no sobre la cara
 * misma: la cara está estirada a --h y medirla sería circular. Ver measure()
 * para por qué se lee offsetHeight en vez de confiar en el observer.
 */

const VIEWS = [
  { n: "1", label: "Vista 1: mapa con fichas" },
  { n: "2", label: "Vista 2: tajos a todo el ancho" },
] as const;

/** Alto del header pegajoso: nada de la sección puede quedar abajo suyo. */
const HEADER = 96;
/** Aire mínimo, y también el umbral para no corregir de gusto. */
const GAP = 24;

/**
 * Las dos vistas no miden lo mismo, así que al girar el cubo la sección cambia
 * de alto y todo lo que está abajo se corre: el que apretó el botón se queda
 * mirando cualquier cosa y tiene que scrollear para reencontrar el contenido.
 *
 * En vez de perseguir ese corrimiento, la sección se reencuadra sola. Si entra
 * en el viewport queda centrada bajo el header. Si no entra —la vista 2 mide
 * 920px contra 700 de aire— se le alinea el BORDE DE ABAJO y no el de arriba:
 * lo que tiene que quedar a la vista es la grilla y los botones con los que se
 * cambia de vista, no el título que ya se leyó. Alineando el tope, los botones
 * terminaban 200px abajo del fold, que es justo el scroll que hay que evitar.
 *
 * Se calcula con el alto DESTINO y no con el que tiene puesto —la transición
 * de --h recién arranca—, así el scroll y el giro viajan juntos y se leen como
 * un solo movimiento.
 */
function frameSection(top: number, height: number) {
  const vh = window.innerHeight;
  const room = vh - HEADER - GAP;
  const target =
    height <= room
      ? HEADER + (room - height) / 2
      : Math.min(vh - GAP - height, HEADER);
  const delta = top - target;
  if (Math.abs(delta) < GAP) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" });
}

export default function BranchesViews({ branches, defaultMapUrl }: Props) {
  const [view, setView] = useState(0);
  /** Tajo abierto en la vista 2. Vive acá para que sobreviva al giro. */
  const [openSlice, setOpenSlice] = useState(0);
  const [heights, setHeights] = useState<[number, number]>([0, 0]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);

  /**
   * offsetHeight y no lo que reporta el observer, por dos motivos que se
   * pagaron caro:
   *
   * 1. getBoundingClientRect() devuelve el rect CON la transformada aplicada,
   *    y la cara de atrás está de canto: proyecta alto cero.
   * 2. El ResizeObserver directamente no entrega nada para esa cara. Con la
   *    medición viviendo sólo adentro del observer, la vista oculta se quedaba
   *    en 0 y al girar el cubo --h caía al alto de la OTRA cara: el contenido
   *    se desbordaba, la sección lo recortaba y la cara —que al tener
   *    transform arma contexto de apilado— tapaba los botones.
   *
   * offsetHeight es el alto de layout, ajeno a la transformada, y se puede
   * leer en cualquier momento. El observer queda sólo como disparador.
   */
  const measure = useCallback(() => {
    const next: [number, number] = [
      innerRefs.current[0]?.offsetHeight ?? 0,
      innerRefs.current[1]?.offsetHeight ?? 0,
    ];
    setHeights((prev) =>
      prev[0] === next[0] && prev[1] === next[1] ? prev : next
    );
    return next;
  }, []);

  useEffect(() => {
    measure();
    const obs = new ResizeObserver(() => measure());
    innerRefs.current.forEach((el) => el && obs.observe(el));
    window.addEventListener("resize", measure);
    /* Las fotos de las sucursales y la tipografía mueven el alto cuando
       terminan de cargar, después del primer measure(). */
    window.addEventListener("load", measure);
    document.fonts?.ready.then(measure);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [measure]);

  /* La cara de atrás no puede recibir foco ni ser leída: está de canto. */
  useEffect(() => {
    faceRefs.current.forEach((el, i) => {
      el?.toggleAttribute("inert", i !== view);
    });
  }, [view]);

  const h = heights[view] || heights[view === 0 ? 1 : 0] || 0;

  const switchTo = (next: number) => {
    if (next === view) return;
    /* Medido en el momento del click, no lo que haya quedado en el estado: es
       el único dato con el que se puede encuadrar antes de que --h viaje. */
    const m = measure();
    const root = rootRef.current;
    if (root) {
      const rect = root.getBoundingClientRect();
      /* El tope no se mueve: la sección crece hacia abajo. Lo que cambia es el
         alto, y la diferencia es la de las dos caras. */
      const grow = (m[next] || h) - (m[view] || h);
      frameSection(rect.top, rect.height + grow);
    }
    setView(next);
  };

  return (
    <div className="branch-views" ref={rootRef}>
      <div
        className="cube-scene"
        style={h ? ({ ["--h" as string]: `${h}px` } as React.CSSProperties) : undefined}
      >
        <div className="cube" data-face={view}>
          {[0, 1].map((i) => (
            <div
              key={i}
              ref={(el) => {
                faceRefs.current[i] = el;
              }}
              className={`cube-face cube-face-${i === 0 ? "front" : "bottom"} ${
                i === view ? "" : "is-back"
              }`}
            >
              <div
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
                className="cube-face-inner"
              >
                {i === 0 ? (
                  <BranchExplorer
                    branches={branches}
                    defaultMapUrl={defaultMapUrl}
                  />
                ) : (
                  <BranchSlices
                    branches={branches}
                    openIndex={openSlice}
                    onOpen={setOpenSlice}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="view-switch"
        role="group"
        aria-label="Cambiar la maqueta de Sucursales"
      >
        {VIEWS.map((v, i) => (
          <button
            key={v.n}
            type="button"
            className={`view-switch-btn ${i === view ? "is-active" : ""}`}
            aria-pressed={i === view}
            aria-label={v.label}
            onClick={() => switchTo(i)}
          >
            {v.n}
          </button>
        ))}
      </div>
    </div>
  );
}
