import { useEffect, useRef, useState } from "react";

interface Props {
  /** Valor final a mostrar (ej: "65", "24.000", "7"). Solo dígitos + separadores. */
  value: string;
  /** Delay inicial antes de arrancar la animación (para stagger entre stats). */
  delay?: number;
  /** Duración de la rotación de cada dígito. */
  duration?: number;
}

// Cuántas rotaciones completas hace cada dígito antes de aterrizar.
// Más ciclos = más "recorrido" visual, más impactante.
const CYCLES = 3;

// Stagger entre dígitos dentro del mismo número: el primero arranca en 0,
// el segundo 100ms después, etc. Genera el efecto de cascada izq → der.
const DIGIT_STAGGER = 110;

/**
 * Contador estilo odómetro mecánico.
 * - Cada posición de dígito tiene una tira vertical con los números 0-9
 *   repetidos varias veces.
 * - Al entrar en viewport, cada tira se traslada verticalmente hasta que el
 *   dígito objetivo queda visible en el "slot".
 * - Los dígitos aterrizan en cascada de izquierda a derecha.
 * - Al terminar el último, hace un micro-bounce por overshoot easing.
 */
export default function StatCounter({
  value,
  delay = 0,
  duration = 1600,
}: Props) {
  const chars = value.split("");
  const [inView, setInView] = useState(false);
  const [landed, setLanded] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Tira de dígitos que renderizamos en cada slot: 0-9 repetido CYCLES veces.
  const strip = Array.from({ length: CYCLES * 10 }, (_, i) => i % 10);

  // Se dispara cada vez que el contador entra en el viewport, y se
  // resetea al salir — así la animación se reproduce de nuevo si se
  // scrollea hacia arriba y se vuelve a bajar, en vez de quedar fija
  // después de la primera vez.
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) setLanded(false);
      },
      { threshold: 0.35 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Bounce cuando termina el último dígito
  useEffect(() => {
    if (!inView) return;
    const numChars = chars.length;
    const totalMs =
      delay + (numChars - 1) * DIGIT_STAGGER + duration + 60;
    const timer = window.setTimeout(() => setLanded(true), totalMs);
    return () => window.clearTimeout(timer);
  }, [inView, delay, duration, chars.length]);

  return (
    <span
      ref={ref}
      className={`stat-counter ${landed ? "is-landed" : ""}`}
      aria-label={value}
    >
      {chars.map((c, i) => {
        if (!/\d/.test(c)) {
          return (
            <span key={i} className="stat-counter-sep" aria-hidden="true">
              {c}
            </span>
          );
        }
        const target = parseInt(c, 10);
        const perDigitDelay = delay + i * DIGIT_STAGGER;
        // Aterrizamos en el último ciclo, posición `target`
        const landingOffset = (CYCLES - 1) * 10 + target;
        return (
          <span key={i} className="stat-counter-slot" aria-hidden="true">
            <span
              className="stat-counter-strip"
              style={{
                transform: inView
                  ? `translateY(-${landingOffset}em)`
                  : "translateY(0)",
                transitionDelay: `${perDigitDelay}ms`,
                transitionDuration: `${duration}ms`,
              }}
            >
              {strip.map((d, j) => (
                <span key={j} className="stat-counter-digit">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
