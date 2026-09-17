/*
  Microinteracción del botón "Ingresar a Etman Market".

  La flecha espera a la izquierda y al hacer hover cruza el botón por
  debajo del texto, mientras cada letra salta a su paso. Al salir del
  hover no vuelve sobre sus pasos: sigue de largo, se va por la derecha y
  reaparece por la izquierda, como si hubiera dado la vuelta.

  Va por Web Animations API y no por transiciones CSS por dos motivos:

  1. Una transición solo interpola entre dos valores, así que siempre
     desanda el camino. No puede sacar la flecha por un borde y meterla
     por el otro — eso son cuatro keyframes, dos de ellos en el mismo
     instante (el corte invisible de una punta a la otra).
  2. Deja arrancar desde donde esté la flecha si se suelta el hover a
     mitad de camino, en lugar de saltar a una posición fija.

  La sincronía entre la flecha y los saltos necesita dos condiciones que
  no son obvias: que la flecha vaya a velocidad CONSTANTE (con easing, el
  instante en que llega a cada letra deja de ser proporcional a la
  distancia) y que el retardo de cada letra salga de su posición MEDIDA y
  no de su índice (una "I" y una "M" no ocupan lo mismo, así que repartir
  el tiempo en partes iguales desalinea la ola contra el medio del texto).
*/

const TRAVEL = 0.8; // segundos de punta a punta
const HOP = 0.3; // duración del salto de una letra
const HOP_PEAK = 0.42; // en qué punto del salto la letra está más alta
const HOP_EASE = "cubic-bezier(0.3, 0.8, 0.4, 1)";
const ARROW_W = 14;
const OUT = 13; // cuánto se pasa de largo para salir de cuadro

type Letter = { el: HTMLElement; x: number };
type Geom = { arrow: HTMLElement; end: number; speed: number; letters: Letter[] };

export function initMarketCta(btn: HTMLElement) {
  const label = btn.querySelector<HTMLElement>(".em-btn-label");
  const arrow = btn.querySelector<HTMLElement>(".em-btn-arrow");
  const track = btn.querySelector<HTMLElement>(".em-btn-track");
  if (!label || !arrow || !track || !btn.animate) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Marca que el script tomó el control: el CSS apaga con esto su
  // recorrido de respaldo, que es una transición simple de ida y vuelta.
  btn.dataset.js = "1";

  // El texto queda escrito en el HTML y se parte recién acá, así que si
  // este módulo no corre el botón se ve igual, solo sin la ola. El <a>
  // lleva aria-label para que el lector de pantalla anuncie la frase
  // entera y no letra por letra.
  const text = label.textContent ?? "";
  label.textContent = "";
  const spans = Array.from(text).map((chr) => {
    const span = document.createElement("span");
    span.textContent = chr;
    // Inline y no por CSS: Astro scopea sus estilos con un atributo que
    // los elementos creados en runtime no tienen, así que una regla
    // `.em-btn-label span` no llegaría a alcanzarlos.
    span.style.display = "inline-block";
    label.appendChild(span);
    return span;
  });

  let hops: Animation[] = [];
  let arrowAnim: Animation | null = null;

  /** Posición actual de la flecha, en píxeles de translateX. */
  function currentX(): number {
    const t = getComputedStyle(arrow!).transform;
    if (!t || t === "none") return 0;
    try {
      return new DOMMatrixReadOnly(t).m41;
    } catch {
      return 0;
    }
  }

  /** Mide el riel y traduce cada letra a la coordenada de la flecha: el
      valor de translateX en el que la flecha le queda justo abajo. */
  function measure(): Geom | null {
    const box = track!.getBoundingClientRect();
    const end = box.width - ARROW_W;
    if (end <= 0) return null;
    return {
      arrow: arrow!,
      end,
      speed: end / TRAVEL,
      letters: spans.map((el) => {
        const b = el.getBoundingClientRect();
        return { el, x: b.left + b.width / 2 - box.left - ARROW_W / 2 };
      }),
    };
  }

  /** Cancela lo que todavía no arrancó y deja terminar lo que está en el
      aire: cortar un salto a mitad de vuelo se ve como un tirón. */
  function clearPending() {
    hops = hops.filter((a) => {
      if (a.effect?.getComputedTiming().progress === null) {
        a.cancel();
        return false;
      }
      return true;
    });
  }

  /** Programa el salto de cada letra que quede en el tramo que la flecha
      está por recorrer. Al retardo se le descuenta lo que la letra tarda
      en llegar arriba, para que el pico coincida con el paso. */
  function scheduleHops(g: Geom, from: number, to: number) {
    const lead = HOP * HOP_PEAK;
    g.letters.forEach(({ el, x }) => {
      if (x < from || x > to) return;
      const delay = Math.max(0, (x - from) / g.speed - lead);
      hops.push(
        el.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-5px)", offset: HOP_PEAK },
            { transform: "translateY(0)" },
          ],
          { duration: HOP * 1000, delay: delay * 1000, easing: HOP_EASE },
        ),
      );
    });
  }

  function runArrow(frames: Keyframe[], seconds: number) {
    arrowAnim?.cancel();
    const anim = arrow!.animate(frames, {
      duration: seconds * 1000,
      easing: "linear",
      fill: "forwards",
    });
    // commitStyles + cancel deja la posición final escrita en el style en
    // lugar de acumular animaciones con fill:forwards colgadas del nodo.
    anim.finished
      .then(() => {
        try {
          anim.commitStyles();
          anim.cancel();
        } catch {
          /* el nodo puede haber quedado fuera del árbol */
        }
      })
      .catch(() => {
        /* cancelada por otra interacción */
      });
    arrowAnim = anim;
  }

  function onEnter() {
    const g = measure();
    if (!g) return;
    clearPending();

    if (reduced) {
      arrow!.style.transform = `translateX(${g.end}px)`;
      return;
    }

    const x0 = currentX();
    const dist = g.end - x0;
    if (dist <= 0.5) return;

    runArrow(
      [{ transform: `translateX(${x0}px)` }, { transform: `translateX(${g.end}px)` }],
      dist / g.speed,
    );
    scheduleHops(g, x0, g.end);
  }

  function onLeave() {
    const g = measure();
    if (!g) return;
    clearPending();

    if (reduced) {
      arrow!.style.transform = "translateX(0px)";
      return;
    }

    const x0 = currentX();
    const exit = g.end + OUT;
    const entry = -(OUT + ARROW_W);
    const d1 = exit - x0;
    const total = d1 - entry;
    const cut = d1 / total;

    // Los dos keyframes en el mismo offset son el corte: el salto
    // invisible del borde derecho al izquierdo, a velocidad pareja.
    runArrow(
      [
        { transform: `translateX(${x0}px)`, offset: 0 },
        { transform: `translateX(${exit}px)`, offset: cut },
        { transform: `translateX(${entry}px)`, offset: cut },
        { transform: "translateX(0px)", offset: 1 },
      ],
      total / g.speed,
    );

    // Las letras que le quedan por delante también saltan a su paso.
    scheduleHops(g, x0, exit);
  }

  btn.addEventListener("mouseenter", onEnter);
  btn.addEventListener("mouseleave", onLeave);
  btn.addEventListener("focus", onEnter);
  btn.addEventListener("blur", onLeave);
}
