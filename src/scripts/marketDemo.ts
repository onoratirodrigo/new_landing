/*
  Demo viva del bloque "Etman Market".

  Reproduce el flujo real del Market sobre una reconstrucción fiel de su
  interfaz (ver el markup y los estilos calcados en EtmanMarket.astro):

    1. Se tipea una patente en la barra rosa "Por patente".
    2. El Market resuelve el vehículo solo (Automotriz / Modelo / Motor) y
       la pieza.
    3. Entran las cards de resultado, iguales a las del sitio.
    4. Se resuelve la disponibilidad: el botón "Ver Disponibilidad" de cada
       card pasa a mostrar el stock en la sucursal (el diferencial).
    5. Se agrega la primera al carrito: salta el toast y el contador del
       carrito marca 1.

  Reglas de comportamiento:

  - Sólo corre en pantalla (IntersectionObserver): arranca al entrar al
    viewport y se frena al salir, como scrollReveal.ts.
  - prefers-reduced-motion: se pinta el estado final resuelto, sin tipeo
    ni cascada, y no loopea.
  - Los timers se guardan y se limpian en cada reinicio, así dos ciclos
    nunca se solapan.

  Los datos salen de src/data/marketDemo.ts (productos reales, precios y
  stock de ejemplo).
*/

import { demoBusqueda } from "../data/marketDemo";

// --- Tiempos del ciclo (ms). Se tocan todos desde acá. -------------------
const CARET_LETRA = 95; // cadencia del tipeo de la patente
const TRAS_PATENTE = 420; // respiro antes de que aparezca el vehículo
const CHIP_STAGGER = 160; // separación entre Automotriz / Modelo / Motor
const TRAS_VEHICULO = 300; // respiro antes de la pieza
const PIEZA_LETRA = 46; // el nombre de la pieza se escribe más rápido
const TRAS_PIEZA = 320; // respiro antes del primer resultado
const CARD_STAGGER = 150; // separación entre cards de resultado
const TRAS_CARDS = 520; // respiro antes de resolver la disponibilidad
const TRAS_AVAIL = 720; // respiro antes de agregar al carrito
const ADDED_HOLD = 1500; // tiempo mirando el toast antes de ir al carrito
const CART_HOLD = 2100; // tiempo en la pantalla del carrito
const REALIZAR_HOLD = 800; // "Realizar pedido" resaltado antes de avanzar
const ORDER_VER = 1300; // mirando "Información del pedido"
const MODAL_OPEN = 1300; // modal de entrega abierto antes de elegir
const MODAL_SEL = 900; // opción elegida dentro del modal
const METODO_HOLD = 1000; // filas con el método de entrega ya aplicado
const CONFIRM_BTN = 800; // "Finalice la compra" resaltado antes de cerrar
const CONFIRM_HOLD = 2400; // tiempo en la confirmación del pedido
const FADE = 440; // duración del apagado antes del loop

type Refs = {
  root: HTMLElement;
  typed: HTMLElement;
  chips: HTMLElement[];
  pieza: HTMLElement;
  cards: HTMLElement[];
  steps: HTMLElement[];
};

export function initMarketDemo(root: HTMLElement) {
  const typed = root.querySelector<HTMLElement>("[data-typed]");
  const pieza = root.querySelector<HTMLElement>("[data-pieza]");
  const chips = Array.from(root.querySelectorAll<HTMLElement>("[data-chip]"));
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-card]"));
  const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
  if (!typed || !pieza || chips.length === 0 || cards.length === 0) return;

  const refs: Refs = { root, typed, chips, pieza, cards, steps };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    pintarEstadoFinal(refs);
    return;
  }

  let timers: number[] = [];
  let corriendo = false;

  const limpiar = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };
  const after = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };

  // Reinicia el DOM al punto de partida: input vacío, vehículo, resultados,
  // disponibilidad y carrito apagados, paso "Busco" activo.
  const reset = () => {
    refs.typed.textContent = "";
    refs.pieza.textContent = "";
    refs.root.setAttribute("data-screen", "0");
    refs.root.removeAttribute("data-veh");
    refs.root.removeAttribute("data-piezalista");
    refs.root.removeAttribute("data-avail");
    refs.root.removeAttribute("data-added");
    refs.root.removeAttribute("data-realizar");
    refs.root.removeAttribute("data-modal");
    refs.root.removeAttribute("data-optsel");
    refs.root.removeAttribute("data-metodo");
    refs.root.removeAttribute("data-confirm");
    refs.chips.forEach((c) => c.removeAttribute("data-on"));
    refs.cards.forEach((c) => c.removeAttribute("data-on"));
    marcarPaso(refs, 0);
  };

  const ciclo = () => {
    reset();

    const patente = demoBusqueda.patente;
    // 1) Tipeo de la patente, letra por letra.
    for (let i = 1; i <= patente.length; i++) {
      after(CARET_LETRA * i, () => {
        refs.typed.textContent = patente.slice(0, i);
      });
    }
    let t = CARET_LETRA * patente.length + TRAS_PATENTE;

    // 2) El vehículo se resuelve solo: entran Automotriz / Modelo / Motor.
    after(t, () => refs.root.setAttribute("data-veh", ""));
    refs.chips.forEach((chip, i) => {
      after(t + CHIP_STAGGER * i, () => chip.setAttribute("data-on", ""));
    });
    t += CHIP_STAGGER * refs.chips.length + TRAS_VEHICULO;

    // 3) La pieza se escribe en su campo.
    const pieza = demoBusqueda.pieza;
    for (let i = 1; i <= pieza.length; i++) {
      after(t + PIEZA_LETRA * i, () => {
        refs.pieza.textContent = pieza.slice(0, i);
      });
    }
    t += PIEZA_LETRA * pieza.length + TRAS_PIEZA;
    after(t, () => {
      refs.root.setAttribute("data-piezalista", "");
      marcarPaso(refs, 1);
    });

    // 4) Los resultados entran en cascada.
    refs.cards.forEach((card, i) => {
      after(t + CARD_STAGGER * (i + 1), () => card.setAttribute("data-on", ""));
    });
    t += CARD_STAGGER * (refs.cards.length + 1) + TRAS_CARDS;

    // 5) Se resuelve la disponibilidad: los botones "Ver Disponibilidad"
    //    pasan a mostrar el stock por sucursal. El escalón lo da el CSS.
    after(t, () => refs.root.setAttribute("data-avail", ""));
    t += TRAS_AVAIL;

    // 6) Se agrega la primera al carrito: toast + contador.
    after(t, () => refs.root.setAttribute("data-added", ""));
    t += ADDED_HOLD;

    // 7) Se desliza a la pantalla del carrito.
    after(t, () => {
      refs.root.setAttribute("data-screen", "1");
      marcarPaso(refs, 1);
    });
    t += CART_HOLD;

    // 8) Se resalta "Realizar pedido" y se desliza a "Información del pedido".
    after(t, () => refs.root.setAttribute("data-realizar", ""));
    t += REALIZAR_HOLD;
    after(t, () => refs.root.setAttribute("data-screen", "2"));
    t += ORDER_VER;

    // 9) Se abre el modal de método de entrega.
    after(t, () => refs.root.setAttribute("data-modal", ""));
    t += MODAL_OPEN;

    // 10) Se elige una opción dentro del modal.
    after(t, () => refs.root.setAttribute("data-optsel", ""));
    t += MODAL_SEL;

    // 11) Se confirma el modal: se cierra y las filas muestran el método.
    after(t, () => {
      refs.root.removeAttribute("data-modal");
      refs.root.setAttribute("data-metodo", "");
    });
    t += METODO_HOLD;

    // 12) Se resalta "Finalice la compra" y se desliza a la confirmación.
    after(t, () => refs.root.setAttribute("data-confirm", ""));
    t += CONFIRM_BTN;
    after(t, () => {
      refs.root.setAttribute("data-screen", "3");
      marcarPaso(refs, 2);
    });
    t += CONFIRM_HOLD;

    // 13) Se apaga y se vuelve a empezar el flujo completo.
    after(t, () => refs.root.setAttribute("data-fade", ""));
    t += FADE;
    after(t, () => {
      refs.root.removeAttribute("data-fade");
      ciclo();
    });
  };

  const arrancar = () => {
    if (corriendo) return;
    corriendo = true;
    ciclo();
  };
  const frenar = () => {
    corriendo = false;
    limpiar();
    refs.root.removeAttribute("data-fade");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) arrancar();
        else frenar();
      });
    },
    { threshold: 0.35 }
  );
  observer.observe(root);
}

// Estado con todo resuelto, sin animación: lo que ve quien pidió reducir
// el movimiento.
function pintarEstadoFinal(refs: Refs) {
  refs.typed.textContent = demoBusqueda.patente;
  refs.pieza.textContent = demoBusqueda.pieza;
  refs.root.setAttribute("data-veh", "");
  refs.root.setAttribute("data-piezalista", "");
  refs.root.setAttribute("data-avail", "");
  refs.root.setAttribute("data-added", "");
  refs.chips.forEach((c) => c.setAttribute("data-on", ""));
  refs.cards.forEach((c) => c.setAttribute("data-on", ""));
  marcarPaso(refs, 2);
}

// Marca activos los pasos 0..idx del indicador (Busco · Encuentro · Pido).
function marcarPaso(refs: Refs, idx: number) {
  refs.steps.forEach((step, i) => {
    step.toggleAttribute("data-on", i <= idx);
  });
}
