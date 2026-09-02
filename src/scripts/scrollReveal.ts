// Revela con fade + movimiento sutil los elementos marcados con
// data-reveal (ver variantes en global.css) cada vez que entran en el
// viewport, y los vuelve a ocultar al salir — así el efecto se repite si
// el usuario sube y vuelve a bajar, en vez de gastarse a la primera. Un
// observer compartido para toda la página en vez de que cada sección arme
// el suyo — mismo patrón que ya se había probado en las flip-cards de
// categorías, ahora reusado.
export function initScrollReveal() {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>("[data-reveal]")
  );
  if (els.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) {
    els.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-revealed", entry.isIntersecting);
      });
    },
    { threshold: 0.2 }
  );
  els.forEach((el) => observer.observe(el));
}
