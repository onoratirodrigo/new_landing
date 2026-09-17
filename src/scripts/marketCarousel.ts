/*
  Carrusel con paralaje del bloque Etman Market.

  Portado del pen "Parallax Carousel — No Libraries" de MOZZARELLA
  (https://codepen.io/TheMOZZARELLA/pen/QwyQGaG), adaptado a la sección:
  la composición acá está centrada (sin el corrimiento a la izquierda que
  el pen usa para dejarle aire al texto lateral), el alto sale de la
  relación de las capturas en vez de medirse contra el viewport, y el
  arrastre no secuestra el scroll vertical en mobile.

  Nitidez: las capturas son la razón de ser de este bloque, así que hay
  varias decisiones tomadas para que no se ablanden. Todas apuntan a lo
  mismo — adentro de un contexto 3D el navegador dibuja el contenido a una
  textura UNA vez y después la proyecta, sin volver a dibujarlo a la
  resolución final. Ver los comentarios en render() y en el <style> de
  EtmanMarket.astro.
*/

type Breakpoint = {
  mq: string;
  gap: number;
  rotateY: number;
  zDepth: number;
  scaleDrop: number;
};

type Options = {
  gap: number;
  rotateY: number;
  zDepth: number;
  scaleDrop: number;
  blurMax: number;
  interval: number;
  transitionMs: number;
  breakpoints: Breakpoint[];
};

const DEFAULTS: Options = {
  gap: 28,
  rotateY: 34,
  zDepth: 150,
  scaleDrop: 0.09,
  blurMax: 2,
  // 3s quieta + 700ms de viaje. Con 7 slides el ciclo entero da ~26s.
  interval: 3000,
  transitionMs: 700,
  breakpoints: [
    { mq: "(max-width: 1200px)", gap: 24, rotateY: 28, zDepth: 120, scaleDrop: 0.08 },
    { mq: "(max-width: 1000px)", gap: 18, rotateY: 22, zDepth: 90, scaleDrop: 0.07 },
    { mq: "(max-width: 768px)", gap: 14, rotateY: 16, zDepth: 70, scaleDrop: 0.06 },
    { mq: "(max-width: 560px)", gap: 12, rotateY: 12, zDepth: 60, scaleDrop: 0.05 },
  ],
};

export function initMarketCarousel(root: HTMLElement, dots: HTMLElement) {
  const viewport = root.querySelector<HTMLElement>(".em-viewport");
  const slides = Array.from(root.querySelectorAll<HTMLElement>(".em-slide"));
  const prevBtn = root.querySelector<HTMLButtonElement>(".em-prev");
  const nextBtn = root.querySelector<HTMLButtonElement>(".em-next");
  if (!viewport || !prevBtn || !nextBtn || slides.length === 0) return;
  // Capturado después del guard: TypeScript no conserva el estrechamiento
  // a no-nulo dentro de las funciones declaradas más abajo.
  const vp = viewport;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const opts: Options = { ...DEFAULTS };
  if (reduced) {
    opts.rotateY = 0;
    opts.zDepth = 0;
    opts.blurMax = 0;
    opts.transitionMs = 220;
  }

  const n = slides.length;
  let index = 0;
  let pos = 0;
  let slideW = 0;
  let gap = opts.gap;
  let animating = false;
  let dragging = false;
  let hovering = false;
  let pointerId: number | null = null;
  let x0 = 0;
  let y0 = 0;
  let axis: "x" | "y" | null = null;
  let velocity = 0;
  let t0 = 0;
  let startTime = 0;
  let pausedAt = 0;
  let tiltX = 0;
  let tiltY = 0;

  const mod = (i: number, m: number) => ((i % m) + m) % m;

  /** Distancia con signo del slide i al centro, envuelta en el ciclo. */
  const delta = (i: number) => {
    let d = i - pos;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  const measure = () => {
    slideW = slides[0].getBoundingClientRect().width;
    gap = opts.gap;
  };

  const resumeClock = () => {
    if (pausedAt) {
      startTime += performance.now() - pausedAt;
      pausedAt = 0;
    }
  };

  function renderParallax() {
    // Con el carrusel quieto el desplazamiento del fondo se redondea a
    // píxel entero: medio píxel de traslación remuestrea la captura
    // entera. Mientras algo se mueve se deja fraccionario, que ahí sí
    // importa la suavidad por encima de la nitidez.
    const still = !animating && !dragging;
    const snap = (v: number) => (still ? Math.round(v) : v);

    for (let i = 0; i < n; i++) {
      const d = delta(i);
      const base = Math.max(-1, Math.min(1, -d));
      const parX = base * 48 + tiltY * 2;
      const parY = tiltX * -1.5;
      const bgX = base * -52 + tiltY * -2.4;
      const card = slides[i].querySelector<HTMLElement>(".em-card");
      if (!card) continue;
      card.style.setProperty("--parX", parX.toFixed(2) + "px");
      card.style.setProperty("--parY", parY.toFixed(2) + "px");
      card.style.setProperty("--parBgX", snap(bgX) + "px");
      card.style.setProperty("--parBgY", snap(parY * 0.35) + "px");
    }
  }

  function render(markActive = false) {
    const span = slideW + gap;
    const still = !animating && !dragging;

    for (let i = 0; i < n; i++) {
      const d = delta(i);
      const tx = d * span;
      const s = slides[i];

      // Solo la slide del centro, y solo cuando ya frenó, sale del 3D:
      // sin rotación ni escala su transform es la identidad, así que se
      // la sacamos del todo y el navegador vuelve a rasterizar la captura
      // a resolución nativa en vez de proyectar la textura vieja. Las
      // vecinas siguen en 3D — van rotadas y borrosas igual.
      if (still && Math.abs(d) < 0.002) {
        s.style.transform = "none";
        s.style.filter = "none";
      } else {
        const depth = -Math.abs(d) * opts.zDepth;
        const rot = -d * opts.rotateY;
        const scale = 1 - Math.min(Math.abs(d) * opts.scaleDrop, 0.42);
        const blur = Math.min(Math.abs(d) * opts.blurMax, opts.blurMax);
        s.style.transform = `translate3d(${tx}px,0,${depth}px) rotateY(${rot}deg) scale(${scale})`;
        s.style.filter = blur ? `blur(${blur.toFixed(2)}px)` : "none";
      }

      s.style.zIndex = String(Math.round(1000 - Math.abs(d) * 10));
      if (markActive) s.dataset.state = index === i ? "active" : "rest";
    }

    renderParallax();

    const active = mod(Math.round(pos), n);
    dotList.forEach((dot, i) =>
      dot.setAttribute("aria-selected", i === active ? "true" : "false"),
    );
  }

  const nearest = (from: number, target: number) => {
    let d = target - Math.round(from);
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return Math.round(from) + d;
  };

  function afterSnap() {
    index = mod(Math.round(pos), n);
    pos = index;
    animating = false;
    // Antes del render: así el will-change ya está apagado cuando la
    // slide del centro vuelve a pintarse plana y nítida.
    delete root.dataset.moving;
    render(true);
    startTime = performance.now();
  }

  function goTo(i: number, animate = true) {
    const start = pos || index;
    const end = nearest(start, i);
    const dur = animate ? opts.transitionMs : 0;
    const from = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 4);
    animating = true;
    root.dataset.moving = "1";

    const step = (now: number) => {
      const t = dur ? Math.min(1, (now - from) / dur) : 1;
      pos = start + (end - start) * ease(t);
      render();
      if (t < 1) requestAnimationFrame(step);
      else afterSnap();
    };
    requestAnimationFrame(step);
  }

  const prev = () => goTo(mod(index - 1, n));
  const next = () => goTo(mod(index + 1, n));

  // --- Dots ---------------------------------------------------------
  dots.innerHTML = "";
  const dotList = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "em-dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Ir al slide ${i + 1}`);
    b.addEventListener("click", () => goTo(i));
    dots.appendChild(b);
    return b;
  });

  // --- Interacción --------------------------------------------------
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  });

  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    axis = e.pointerType === "mouse" ? "x" : null;
    pointerId = e.pointerId;
    x0 = e.clientX;
    y0 = e.clientY;
    t0 = performance.now();
    velocity = 0;
    pausedAt = performance.now();
    root.dataset.moving = "1";
    if (e.pointerType === "mouse") {
      e.preventDefault();
      viewport.setPointerCapture(e.pointerId);
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pointerId) {
      // Tilt del mouse sobre las tarjetas.
      if (!dragging && !reduced) {
        const r = viewport.getBoundingClientRect();
        tiltX = ((e.clientY - r.top) / r.height - 0.5) * -6;
        tiltY = ((e.clientX - r.left) / r.width - 0.5) * 6;
        renderParallax();
      }
      return;
    }

    const dx = e.clientX - x0;
    const dy = e.clientY - y0;

    // En touch el eje se decide en el primer tramo: si el gesto es
    // vertical se suelta el carrusel y la página sigue scrolleando.
    if (axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis === "x") viewport.setPointerCapture(e.pointerId);
      else {
        endDrag(e);
        return;
      }
    }

    const dt = Math.max(16, performance.now() - t0);
    velocity = dx / dt;
    pos = mod(index - dx / (slideW + gap), n);
    render();
  });

  function endDrag(e?: PointerEvent) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    const wasX = axis === "x";
    dragging = false;
    // Si el gesto resultó vertical no hay goTo que lo vuelva a poner;
    // si fue horizontal, goTo lo reactiva enseguida.
    delete root.dataset.moving;
    try {
      if (pointerId != null) vp.releasePointerCapture(pointerId);
    } catch {
      /* el pointer ya se soltó solo */
    }
    pointerId = null;
    resumeClock();
    if (!wasX) return;

    const threshold = 0.18;
    const target = Math.round(
      pos - Math.sign(velocity) * (Math.abs(velocity) > threshold ? 0.5 : 0),
    );
    goTo(mod(target, n));
  }

  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  root.addEventListener("mouseenter", () => {
    hovering = true;
    pausedAt = performance.now();
  });
  root.addEventListener("mouseleave", () => {
    resumeClock();
    hovering = false;
  });

  new ResizeObserver(() => {
    measure();
    render();
  }).observe(viewport);

  opts.breakpoints.forEach((bp) => {
    const m = window.matchMedia(bp.mq);
    const apply = () => {
      opts.gap = bp.gap;
      opts.rotateY = reduced ? 0 : bp.rotateY;
      opts.zDepth = reduced ? 0 : bp.zDepth;
      opts.scaleDrop = bp.scaleDrop;
      measure();
      render();
    };
    m.addEventListener("change", apply);
    if (m.matches) apply();
  });

  // --- Autoplay -----------------------------------------------------
  // rAF y no setInterval: así el reloj se congela solo mientras se
  // arrastra, hay hover o la pestaña no está visible.
  function loop() {
    const step = (t: number) => {
      if (!dragging && !hovering && !animating && !document.hidden) {
        if (t - startTime >= opts.interval) next();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  measure();
  goTo(0, false);
  startTime = performance.now();
  loop();
}
