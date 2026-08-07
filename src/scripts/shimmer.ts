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
const SPACING_BORDEAUX = 32;
const MAGENTA_DENSITY_FACTOR = 0.6;
const HALO_RADIUS = 163;
const BOOST = 0.45;

// R del brand-600 en cada extremo (ver global.css): sirve para leer, en
// cualquier momento, qué tan lejos está el color actual entre bordeaux y
// magenta — sin importar si lo está moviendo el scroll, el toggle de Modo
// Clásico, o su animación de transición.
const BORDEAUX_600_R = 98;
const MAGENTA_600_R = 216;

function currentBrandT() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--brand-600")
    .trim()
    .split(/\s+/)
    .map(Number);
  const r = raw[0];
  if (!Number.isFinite(r)) return 0;
  return Math.max(0, Math.min(1, (r - BORDEAUX_600_R) / (MAGENTA_600_R - BORDEAUX_600_R)));
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
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
    phase: number;
    freq: number;
    baseR: number;
    baseA: number;
  }[] = [];
  let builtSpacing = -1;
  let builtWidth = -1;
  let builtHeight = -1;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function effectiveSpacing() {
    const t = currentBrandT();
    const spacing =
      SPACING_BORDEAUX - (SPACING_BORDEAUX - SPACING_BORDEAUX * MAGENTA_DENSITY_FACTOR) * t;
    return Math.round(spacing);
  }

  function buildGridIfNeeded(width: number, height: number) {
    const spacing = effectiveSpacing();
    if (spacing === builtSpacing && width === builtWidth && height === builtHeight) return;
    builtSpacing = spacing;
    builtWidth = width;
    builtHeight = height;

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const offsetX = (width - (cols - 1) * spacing) / 2;
    const next: typeof dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        next.push({
          x: offsetX + c * spacing,
          y: r * spacing,
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

    if (mouse.active) {
      const g = ctx!.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        HALO_RADIUS * 1.35
      );
      g.addColorStop(0, "rgba(255,255,255,0.10)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx!.save();
      ctx!.globalCompositeOperation = "lighter";
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, viewportW, viewportH);
      ctx!.restore();
    }

    const t = (now - start) / 1000;
    for (const d of dots) {
      const screenY = d.y + region.top;
      if (screenY < -20 || screenY > viewportH + 20) continue;

      const twinkleMul = canAnimate ? 0.6 + 0.4 * Math.sin(t * d.freq + d.phase) : 1;

      let boostT = 0;
      if (mouse.active) {
        const dx = d.x - mouse.x;
        const dy = screenY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HALO_RADIUS) {
          boostT = smooth(1 - dist / HALO_RADIUS);
        }
      }

      const r = d.baseR * twinkleMul + boostT * 2.4 * BOOST;
      const a = Math.min(1, d.baseA * twinkleMul + boostT * BOOST);

      ctx!.beginPath();
      ctx!.arc(d.x, screenY, Math.max(0.4, r), 0, Math.PI * 2);
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
