// Secuencia de frames (caja Etman abriéndose) dibujada en un <canvas> y
// scrubbeada por scroll con GSAP ScrollTrigger. El "freeze" de scroll lo
// hace CSS puro (.box-scrub-wrap es position:sticky, ver global.css) — acá
// sólo hace falta traducir el progreso del scroll dentro de ese alto al
// frame que corresponde, igual que hace IntroStencil con su render(t).
//
// gsap/ScrollTrigger van importados estático (no dynamic import): Intro
// Stencil ya los carga estático y de entrada, así que iría al mismo chunk
// igual — un import dinámico acá no ahorra nada y sólo agrega una promesa
// de más.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface BoxScrubOptions {
  space: HTMLElement;
  wrap: HTMLElement;
  canvas: HTMLCanvasElement;
  frameCount: number;
  framePath: (index: number) => string;
}

export function initBoxScrub({
  space,
  wrap,
  canvas,
  frameCount,
  framePath,
}: BoxScrubOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const images: HTMLImageElement[] = [];
  const loaded: boolean[] = new Array(frameCount).fill(false);
  let lastDrawn = -1;

  function loadFrame(i: number): HTMLImageElement {
    if (images[i]) return images[i];
    const img = new Image();
    img.decoding = "async";
    img.src = framePath(i);
    img.onload = () => {
      loaded[i] = true;
    };
    images[i] = img;
    return img;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(index: number) {
    // Si el frame pedido todavía no cargó, se dibuja el último disponible
    // más cercano en vez de dejar el canvas en blanco un instante.
    let i = index;
    if (!loaded[i]) {
      let back = i;
      while (back >= 0 && !loaded[back]) back--;
      i = back >= 0 ? back : i;
    }
    if (!loaded[i] || i === lastDrawn) return;
    lastDrawn = i;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx!.clearRect(0, 0, w, h);
    ctx!.drawImage(images[i], 0, 0, w, h);
  }

  // Frame 0 se pide ya mismo: es el "poster" que se ve apenas la sección
  // entra en pantalla, antes de que arranque el scrub.
  loadFrame(0).addEventListener("load", () => {
    resizeCanvas();
    draw(0);
  });

  if (prefersReducedMotion) {
    // Sin animación: se muestra directamente la caja abierta (último frame),
    // sin pedir el resto de la secuencia.
    const last = frameCount - 1;
    loadFrame(last).addEventListener("load", () => {
      resizeCanvas();
      draw(last);
    });
    window.addEventListener("resize", () => {
      resizeCanvas();
      lastDrawn = -1;
      draw(last);
    });
    return;
  }

  // El resto de la secuencia se pide cuando la sección está por llegar, no
  // antes: son ~80 frames y no tiene sentido bajarlos si el usuario nunca
  // scrollea hasta acá.
  let requested = false;
  const preloadObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting || requested) return;
      requested = true;
      for (let i = 1; i < frameCount; i++) loadFrame(i);
      preloadObserver.disconnect();
    },
    { rootMargin: "800px 0px" }
  );
  preloadObserver.observe(space);

  function headerOffset() {
    return window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
  }

  // "end" tiene que ser función (no un string fijo): con el wrap a alto de
  // contenido (ver .box-scrub-wrap en global.css) el punto donde el sticky
  // se despega depende de wrap.offsetHeight, que cambia con el ancho de
  // pantalla. Recalculado así, coincide siempre con el momento real en que
  // CSS lo suelta — si no, la secuencia terminaría de "empujar" scroll
  // después de que la caja ya se fue de la vista, o quedaría a mitad de
  // abrir cuando se suelta.
  const progress = { t: 0 };
  const trigger = ScrollTrigger.create({
    trigger: space,
    start: () => `top ${headerOffset()}`,
    end: () => `bottom ${headerOffset() + wrap.offsetHeight}`,
    scrub: 0.4,
    onUpdate: (self) => {
      progress.t = self.progress;
      draw(Math.min(frameCount - 1, Math.floor(self.progress * frameCount)));
    },
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    lastDrawn = -1;
    draw(Math.min(frameCount - 1, Math.floor(progress.t * frameCount)));
    trigger.refresh();
  });
}
