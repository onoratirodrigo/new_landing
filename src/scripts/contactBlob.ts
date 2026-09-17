// Las dos burbujas que sostienen el formulario de Contacto.
//
// Es el efecto del pen de Fabio Ottaviani (codepen.io/supah/pen/PoZrzQx):
// un contorno cerrado de 9 puntos cuyo radio late entre un mínimo y un
// máximo, cada punto con su propia duración y desfasado del resto, unidos
// con bezier. Se mantienen sus números (9 segmentos, 300→380 y 320→400
// sobre 400, duraciones de 1 a 3 y de 2 a 3 segundos, ease sine.inOut) y
// su forma de desfasar: cada tween entra al timeline en la posición
// -duration, así ninguno arranca en fase con el anterior.
//
// Dos diferencias con el original, ambas por el mismo motivo — allá la
// burbuja recorta fotos cuadradas en un lienzo fijo de 800x800 y acá tiene
// que contener un formulario rectangular:
//
//   1. Se anima el radio en vez de x/y. Es equivalente (el punto se mueve
//      sobre su propio rayo) pero permite escalar la burbuja al alto y
//      ancho reales del panel sin rehacer los tweens en cada resize.
//   2. El radio va como fracción del semieje, no en pixeles.
//
// La burbuja de adelante no se pinta: se usa como clipPath del div que
// hace de panel, igual que el original recorta las imágenes.

import gsap from "gsap";

interface BlobOpts {
  el: SVGPathElement;
  segments?: number;
  /** Radio en fracción del semieje (0.75 = los 300 sobre 400 del pen). */
  minRadius?: number;
  maxRadius?: number;
  minDuration?: number;
  maxDuration?: number;
  /** Elemento recortado por este contorno, si hace de máscara. */
  maskEl?: HTMLElement | null;
  maskID?: string | null;
}

// El repintado forzado del clipPath sólo hace falta en Safari; en el resto
// es un reflow por frame al pedo.
const NECESITA_PATADA =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

class SupahBlob {
  private el: SVGPathElement;
  private segments: number;
  private minRadius: number;
  private maxRadius: number;
  private minDuration: number;
  private maxDuration: number;
  private maskEl: HTMLElement | null;
  private maskID: string | null;
  private points: { angle: number; r: number }[] = [];
  private w = 0;
  private h = 0;
  private tl: gsap.core.Timeline | null = null;

  constructor(opts: BlobOpts) {
    this.el = opts.el;
    this.segments = opts.segments ?? 9;
    this.minRadius = opts.minRadius ?? 0.75;
    this.maxRadius = opts.maxRadius ?? 0.95;
    this.minDuration = opts.minDuration ?? 1;
    this.maxDuration = opts.maxDuration ?? 3;
    this.maskEl = opts.maskEl ?? null;
    this.maskID = opts.maskID ?? null;
    this.init();
  }

  private init() {
    const slice = (Math.PI * 2) / this.segments;
    const tl = gsap.timeline({ onUpdate: () => this.update() });

    for (let i = 0; i < this.segments; i++) {
      const angle = slice * i;
      const duration = gsap.utils.random(this.minDuration, this.maxDuration);
      const p = { angle, r: this.minRadius };

      const tween = gsap.to(p, {
        duration,
        r: this.maxRadius,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      tl.add(tween, -duration);
      this.points.push(p);
    }

    this.tl = tl;
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.update();
  }

  /** Congela la forma a mitad de camino (para prefers-reduced-motion). */
  freeze() {
    this.tl?.pause();
    const medio = (this.minRadius + this.maxRadius) / 2;
    this.points.forEach((p) => {
      p.r = medio;
    });
    this.update();
  }

  update() {
    if (!this.w) return;
    this.el.setAttribute("d", this.createPath());

    if (this.maskEl && this.maskID && NECESITA_PATADA) {
      this.maskEl.style.clipPath = "none";
      (this.maskEl.style as any).webkitClipPath = "none";
      void this.maskEl.offsetWidth;
      this.maskEl.style.clipPath = `url("${this.maskID}")`;
      (this.maskEl.style as any).webkitClipPath = `url("${this.maskID}")`;
    }
  }

  private createPath() {
    const cx = this.w / 2;
    const cy = this.h / 2;
    const data = this.points.map((p) => ({
      x: cx + Math.cos(p.angle) * p.r * cx,
      y: cy + Math.sin(p.angle) * p.r * cy,
    }));
    const size = data.length;

    let path = `M${data[0].x} ${data[0].y} C`;
    for (let i = 0; i < size; i++) {
      const p0 = data[(i - 1 + size) % size];
      const p1 = data[i];
      const p2 = data[(i + 1) % size];
      const p3 = data[(i + 2) % size];

      const x1 = p1.x + (p2.x - p0.x) * 0.15;
      const y1 = p1.y + (p2.y - p0.y) * 0.15;
      const x2 = p2.x - (p3.x - p1.x) * 0.15;
      const y2 = p2.y - (p3.y - p1.y) * 0.15;

      path += ` ${x1} ${y1} ${x2} ${y2} ${p2.x} ${p2.y}`;
    }
    return `${path}z`;
  }
}

export function initContactBlob(stage: HTMLElement) {
  const svg = stage.querySelector<SVGSVGElement>("[data-blob-svg]");
  const frente = stage.querySelector<SVGPathElement>("[data-blob-front]");
  const fondo = stage.querySelector<SVGPathElement>("[data-blob-back]");
  const cara = stage.querySelector<HTMLElement>("[data-blob-face]");
  if (!svg || !frente || !fondo || !cara) return;

  // Máscara del formulario (300 → 380 sobre 400 en el pen).
  const adelante = new SupahBlob({
    el: frente,
    minRadius: 0.75,
    maxRadius: 0.95,
    minDuration: 1,
    maxDuration: 3,
    maskEl: cara,
    maskID: "#contacto-blob-mask",
  });

  // Burbuja de atrás: más grande y más lenta (320 → 400), asoma por
  // detrás de la de adelante.
  const atras = new SupahBlob({
    el: fondo,
    minRadius: 0.8,
    maxRadius: 1,
    minDuration: 2,
    maxDuration: 3,
  });

  const medir = () => {
    const r = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    adelante.resize(r.width, r.height);
    atras.resize(r.width, r.height);
  };

  new ResizeObserver(medir).observe(stage);
  medir();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    adelante.freeze();
    atras.freeze();
  }
}
