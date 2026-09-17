import type { Branch } from "../data/branches";
import { provinceShapes } from "../data/provinceShapes";

interface Props {
  branches: Branch[];
}

/**
 * Vista 2 de Sucursales: los siete puntos como tajos superpuestos que ocupan
 * todo el ancho, sin mapa al costado.
 *
 * La grilla es un solo truco: 2N+1 columnas de 1fr, cada tajo abarca TRES y
 * pisa una del vecino, así que lo que se ve de un tajo cerrado son sus dos
 * primeras columnas. Abrir uno engorda su columna EXCLUSIVA —la del medio,
 * la única que ningún vecino pisa— y el navegador interpola
 * grid-template-columns entero. Por eso el ancho abierto sale de una sola
 * propiedad animable y no de siete transiciones coordinadas.
 *
 * El primer tajo es la excepción: sus columnas exclusivas son la 1 y la 2, y
 * crece por la 1 para que el borde izquierdo quede quieto.
 *
 * Debajo de 900px la MISMA lógica gira noventa grados —filas en vez de
 * columnas— y el acordeón queda vertical. El corte pasa del borde izquierdo
 * al inferior; de eso se encarga el CSS.
 *
 * Los tres datos que distinguen un tajo de otro:
 *   1. La foto de la sucursal, apenas bajada de brillo (no lavada de rosa:
 *      con el velo fuerte las siete se veían iguales).
 *   2. La silueta de la provincia con el pin en la posición real de la
 *      ciudad, que es lo ÚNICO que separa AMBA de Bahía Blanca y Rosario de
 *      Rafaela.
 *   3. Un filete superior cuyo tono agrupa por provincia.
 */

/** Un escalón del degradé de marca por provincia. Agrupa las dos bonaerenses
 *  y las dos santafesinas sin salirse del magenta. */
const PROVINCE_TONE: Record<string, string> = {
  "Buenos Aires": "#ffdfeb",
  "Córdoba": "#fbb6d1",
  "Santa Fe": "#f887b1",
  "Entre Ríos": "#f2578f",
  "Mendoza": "#e42a6d",
};

/** Encuadre de cada foto. No va en branches.ts porque es una decisión de
 *  esta vista: sirve para que los siete recortes no se repitan. */
const CROP: Record<string, string> = {
  amba: "50% 42%",
  "bahia-blanca": "46% 52%",
  cordoba: "54% 40%",
  rosario: "48% 46%",
  rafaela: "52% 50%",
  parana: "44% 44%",
  mendoza: "56% 48%",
};

/** Cuánto engorda la columna exclusiva del tajo abierto. */
const OPEN_FR = 9;

/** Código Postal Argentino, el formato de ocho caracteres: B8000IRB. */
const CPA_RE = /\b([A-Z]\d{4}[A-Z]{3})\b/;

/** Las direcciones vienen como "Israel 34 — B8000IRB — Bahía Blanca": el CPA
 *  sale a su propio chip y el resto se junta con un separador liviano. */
function splitAddress(address: string) {
  const cpa = address.match(CPA_RE)?.[1] ?? null;
  const rest = address
    .split("—")
    .map((p) => p.trim())
    .filter((p) => p && p !== cpa)
    .join(" · ");
  return { cpa, rest };
}

/** El embed ya trae la consulta curada de cada sucursal; se reusa para el
 *  link de "Cómo llegar" en vez de rearmar la dirección. */
function directionsUrl(mapEmbed: string) {
  const q = /[?&]q=([^&]+)/.exec(mapEmbed)?.[1];
  return q
    ? `https://www.google.com/maps/search/?api=1&query=${q}`
    : "https://www.google.com/maps";
}

function Crest({ branch, className }: { branch: Branch; className: string }) {
  return (
    <span className={`slice-crest ${className}`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path className="shape" d={provinceShapes[branch.province.shape]} />
        <circle
          className="halo"
          cx={branch.province.pin.x}
          cy={branch.province.pin.y}
          r={8}
        />
        <circle
          className="pin"
          cx={branch.province.pin.x}
          cy={branch.province.pin.y}
          r={3.6}
        />
      </svg>
    </span>
  );
}

interface SlicesProps extends Props {
  openIndex: number;
  onOpen: (i: number) => void;
}

export default function BranchSlices({
  branches,
  openIndex,
  onOpen,
}: SlicesProps) {
  const n = branches.length;
  const trackCount = 2 * n + 1;

  /* La columna que engorda: la 1 para el primer tajo, la 2k para el resto. */
  const big = openIndex === 0 ? 1 : 2 * (openIndex + 1);
  const tracks = Array.from({ length: trackCount }, (_, i) =>
    i + 1 === big ? `${OPEN_FR}fr` : "1fr"
  ).join(" ");

  const focusSlice = (i: number) => {
    const el = document.querySelectorAll<HTMLButtonElement>(
      "#branch-slices .slice-hit"
    )[(i + n) % n];
    el?.focus();
  };

  return (
    <div>
      <div className="mb-8 md:mb-10 max-w-3xl">
        <span className="eyebrow">Sucursales</span>
        <h2 className="section-title mt-4">Llegamos a todo el país.</h2>
        <p className="lead mt-5">
          Siete puntos logísticos estratégicamente distribuidos. Pasá el mouse,
          tocá o usá las flechas del teclado sobre cada tajo para abrir su
          ficha: dirección, teléfono, correos y horarios.
        </p>
      </div>

      <div
        id="branch-slices"
        className="branch-slices"
        style={{ ["--tracks" as string]: tracks }}
      >
        {branches.map((b, i) => {
          const { cpa, rest } = splitAddress(b.address);
          const isOpen = i === openIndex;
          const span = `${2 * (i + 1) - 1} / span 3`;

          return (
            <div
              key={b.id}
              className={`slice ${isOpen ? "is-open" : ""} ${
                i === openIndex + 1 ? "is-after" : ""
              }`}
              style={{
                ["--c" as string]: span,
                ["--r" as string]: span,
                ["--pv" as string]: PROVINCE_TONE[b.region] ?? "#ffdfeb",
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") onOpen(i);
              }}
            >
              <button
                type="button"
                className="slice-hit"
                aria-expanded={isOpen}
                aria-label={`Sucursal ${b.city}, ${b.region}`}
                onClick={() => onOpen(i)}
                onFocus={() => onOpen(i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    focusSlice(i + 1);
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    focusSlice(i - 1);
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    focusSlice(0);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    focusSlice(n - 1);
                  }
                }}
              >
                <span
                  className="slice-photo"
                  style={{
                    backgroundImage: `url("${b.image}")`,
                    backgroundPosition: CROP[b.id] ?? "50% 45%",
                  }}
                />
                <span className="slice-scrim" />
                <span className="slice-wash" />
                <span className="slice-rule" />

                <Crest branch={b} className="slice-crest-mini" />
                <Crest branch={b} className="slice-crest-big" />

                <span className="slice-tab">
                  <span>{b.city}</span>
                  <span className="slice-tab-prov">{b.region}</span>
                </span>

                <span className="slice-card">
                  <span className="slice-card-top">
                    <span className="slice-prov">{b.region}</span>
                  </span>
                  <span className="slice-city">{b.city}</span>
                  <span className="slice-addr">
                    <span>{rest}</span>
                    {cpa && <span className="slice-cpa">{cpa}</span>}
                  </span>
                  <span className="slice-facts">
                    {b.phone && (
                      <span className="slice-fact">
                        <span className="slice-fact-k">Teléfono</span>
                        <span className="slice-fact-v is-num">{b.phone}</span>
                      </span>
                    )}
                    <span className="slice-fact">
                      <span className="slice-fact-k">
                        {b.emails.length > 1 ? "Correos" : "Correo"}
                      </span>
                      <span className="slice-fact-v">
                        {b.emails.map((e) => (
                          <span key={e}>{e}</span>
                        ))}
                      </span>
                    </span>
                    <span className="slice-fact">
                      <span className="slice-fact-k">
                        {b.hours.length ? "Atención" : "Operación"}
                      </span>
                      <span className="slice-fact-v">
                        {b.hours.length ? (
                          b.hours.map((h) => <span key={h}>{h}</span>)
                        ) : (
                          <span>Centro de distribución</span>
                        )}
                      </span>
                    </span>
                  </span>
                </span>
              </button>

              <a
                className="slice-cta"
                href={directionsUrl(b.mapEmbed)}
                target="_blank"
                rel="noopener"
                tabIndex={isOpen ? 0 : -1}
                aria-label={`Cómo llegar a ${b.city}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
                <span className="slice-cta-label">Cómo llegar</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
