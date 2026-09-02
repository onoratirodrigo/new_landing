// Grilla de puntitos blancos que "brillan" cerca del mouse y parpadean solos.
//
// Vive acá y no dentro de un componente porque la usan dos lugares distintos:
// la franja Nosotros → Contacto (ShimmerGrid.astro), donde los puntos siguen a
// una región concreta del documento, y la intro del estarcido
// (IntroStencil.astro), donde la "región" es simplemente el viewport. La única
// diferencia entre los dos casos es de dónde sale el rectángulo a dibujar y si
// hay un fundido global encima, así que eso se pasa por parámetro y el resto
// del dibujo es idéntico.

export interface ShimmerRegion {
  /** Borde superior del área a dibujar, en coordenadas de viewport. */
  top: number;
  /** Alto del área. La grilla se construye con esta altura. */
  height: number;
}

export interface ShimmerOptions {
  canvas: HTMLCanvasElement;
  /** Devolver null para no dibujar nada en este frame. */
  getRegion: () => ShimmerRegion | null;
  /** Multiplicador global de opacidad (0..1). Por defecto, siempre 1. */
  getAlpha?: () => number;
}

// Valores probados y aprobados en el test standalone original; no tocar sin
// volver a mirarlos en pantalla.
//
// La separación entre puntos es fija: antes achicaba con el degradé de
// scroll bordeaux -> magenta (leyendo --brand-600, ver Header.astro), pero
// eso hacía que la grilla se viera cada vez más densa a medida que se
// bajaba la página, sin que tuviera que ver con el efecto del mouse.
const SPACING = 32;
const BOOST = 0.45;

// Antes había además un halo: un círculo de luz dibujado en la posición del
// mouse, encima de todo. Se sacó porque se leía como una luz propia del
// cursor, no como que los puntos reaccionaran. Ahora la única fuente de luz
// son los puntos: los cercanos crecen/brillan (BOOST) y además se corren un
// poco lejos del mouse (repulsión), y esa reacción cae de forma gaussiana
// con la distancia (SIGMA) en vez de cortar de golpe en un radio — un corte
// duro es justo lo que se leía como el borde de un círculo.
const SIGMA = 150;
const MAX_DISPLACEMENT = 16;
const DISPLACEMENT_EASE = 0.16;

// Sin corte: nunca llega a un radio exacto donde el brillo se apague de
// golpe, sólo se vuelve imperceptible de a poco.
function gaussianBoost(dist: number) {
  return Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA));
}

export function createShimmer({ canvas, getRegion, getAlpha }: ShimmerOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const canAnimate = !prefersReducedMotion;
  const canTrackMouse = !prefersReducedMotion && hasFinePointer;

  let dots: {
    x: number;
    y: number;
    // Desplazamiento actual por repulsión (no la posición: ver draw()).
    // Se anima con su propio ease, separado de x/y, para que no dependa
    // de la posición de scroll de la región — si no, cada scroll "tironea"
    // el desplazamiento en vez de dejarlo asentarse solo.
    dx: number;
    dy: number;
    phase: number;
    freq: number;
    baseR: number;
    baseA: number;
  }[] = [];
  let builtWidth = -1;
  let builtHeight = -1;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function buildGridIfNeeded(width: number, height: number) {
    if (width === builtWidth && height === builtHeight) return;
    builtWidth = width;
    builtHeight = height;

    const cols = Math.ceil(width / SPACING) + 1;
    const rows = Math.ceil(height / SPACING) + 1;
    const offsetX = (width - (cols - 1) * SPACING) / 2;
    const next: typeof dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        next.push({
          x: offsetX + c * SPACING,
          y: r * SPACING,
          dx: 0,
          dy: 0,
          phase: Math.random() * Math.PI * 2,
          freq: 0.5 + Math.random() * 0.9,
          baseR: 1.0 + Math.random() * 0.6,
          baseA: 0.28 + Math.random() * 0.22,
        });
      }
    }
    dots = next;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const mouse = { x: -9999, y: -9999, active: false };
  if (canTrackMouse) {
    window.addEventListener(
      "mousemove",
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      },
      { passive: true }
    );
    window.addEventListener("mouseleave", () => {
      mouse.active = false;
    });
  }

  const start = performance.now();
  function draw(now: number) {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const region = getRegion();
    const alpha = getAlpha ? getAlpha() : 1;

    // Fuera de la región (o con el fundido en cero) no hay nada que dibujar.
    if (!region || alpha <= 0.001 || region.top + region.height <= 0 || region.top >= viewportH) {
      ctx!.clearRect(0, 0, viewportW, viewportH);
      requestAnimationFrame(draw);
      return;
    }

    buildGridIfNeeded(viewportW, region.height);
    ctx!.clearRect(0, 0, viewportW, viewportH);
    ctx!.save();
    ctx!.globalAlpha = alpha;

    const t = (now - start) / 1000;
    for (const d of dots) {
      const screenY = d.y + region.top;
      if (screenY < -20 || screenY > viewportH + 20) continue;

      const twinkleMul = canAnimate ? 0.6 + 0.4 * Math.sin(t * d.freq + d.phase) : 1;

      let boostT = 0;
      let targetDx = 0;
      let targetDy = 0;
      if (mouse.active) {
        const dx = d.x - mouse.x;
        const dy = screenY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        boostT = gaussianBoost(dist);
        if (boostT > 0.003) {
          const mag = MAX_DISPLACEMENT * boostT;
          targetDx = (dx / dist) * mag;
          targetDy = (dy / dist) * mag;
        }
      }
      d.dx += (targetDx - d.dx) * DISPLACEMENT_EASE;
      d.dy += (targetDy - d.dy) * DISPLACEMENT_EASE;

      const r = d.baseR * twinkleMul + boostT * 2.4 * BOOST;
      const a = Math.min(1, d.baseA * twinkleMul + boostT * BOOST);

      ctx!.beginPath();
      ctx!.arc(d.x + d.dx, screenY + d.dy, Math.max(0.4, r), 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      if (boostT > 0.05) {
        ctx!.shadowColor = `rgba(255,255,255,${(boostT * 0.9).toFixed(3)})`;
        ctx!.shadowBlur = 10 * boostT;
      } else {
        ctx!.shadowBlur = 0;
      }
      ctx!.fill();
    }

    ctx!.restore();
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    builtWidth = -1; // fuerza a re-medir en el próximo frame
  });
  resizeCanvas();
  requestAnimationFrame(draw);
}
