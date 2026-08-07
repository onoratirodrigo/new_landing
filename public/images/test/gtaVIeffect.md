# Efecto: texto/logo como "estarcido" de una imagen, con scroll

Origen: landing de GTA VI de midudev (`src/pages/index.astro`). Al hacer scroll, el texto
"GRAND THEFT AUTO" se comporta como un molde/stencil: al principio se ve la imagen de fondo
a pantalla completa (la máscara está tan agrandada que no se nota), y a medida que se scrollea
la máscara se va achicando hasta encajar en la silueta exacta de las letras, dando la sensación
de que la imagen "estaba adentro del texto" todo el tiempo. Al final, toda la capa se desvanece
y aparece el resto de la página.

Se logra combinando: **SVG como máscara CSS** + **imagen escalada** + **GSAP ScrollTrigger con scrub**.

## 1. El "molde": un SVG con el texto/logo como paths sólidos

No es un logo cualquiera: son las letras (o el isotipo) dibujadas como `<path>` rellenos de un
solo color, sin huecos ni detalles — el shape que va a actuar de estarcido.

- Se puede generar convirtiendo texto a curvas/outlines en Illustrator, Figma o Inkscape.
- Cuanto más simple y sólido el shape, mejor funciona como máscara.
- Guardarlo como archivo estático (ej. `public/logo-mask.svg`).

## 2. El contenedor con `mask-image`

```css
#logo-mask {
  background: white; /* color de relleno, poco relevante si la imagen es opaca */
  mask-image: url("/logo-mask.svg");
  mask-position: center 25%; /* dónde se ubica el molde en pantalla */
  mask-repeat: no-repeat;
  mask-size: clamp(5000vh, 3500%, 0vh); /* ver truco abajo */
}
```

`#logo-mask` es un `div` fijo a pantalla completa que **contiene** la imagen. `mask-image` hace
que todo lo de adentro (aunque los hijos sean `position: fixed`) solo se vea a través del "agujero"
con forma del SVG.

### El truco del tamaño inicial gigante

`mask-size: clamp(5000vh, 3500%, 0vh)` es un `clamp(min, ideal, max)` donde el mínimo (5000vh)
es **mayor** que el máximo (0vh). Eso es matemáticamente inválido, y el navegador lo resuelve
devolviendo siempre el mínimo → un tamaño enorme. Con la máscara tan agrandada, el molde ocupa
mucho más que la pantalla, así que al inicio **no se nota que hay una máscara**: se ve la imagen
completa, sin recorte visible. Es la forma de arrancar con "sin máscara aparente" sin tener que
calcular a mano un valor gigante por breakpoint.

## 3. La imagen adentro del contenedor

```html
<div
  id="logo-mask"
  class="fixed top-0 w-full h-screen"
>
  <picture
    id="hero-key"
    class="h-screen scale-125 block overflow-hidden fixed"
  >
    <img
      id="hero-key-logo"
      class="absolute w-full h-full object-cover"
      src="..."
    />
    <img
      id="hero-key-background"
      class="w-full h-full object-cover"
      src="..."
    />
  </picture>
</div>
```

- `scale-125` (o el valor que sea >1) le da margen para animar un zoom-out después.
- Se pueden poner dos imágenes superpuestas (una encima con opacidad animable) para lograr un
  cross-fade entre "imagen A" e "imagen B" mientras se revela el molde. Acá no es obligatorio,
  con una sola imagen el efecto funciona igual.

## 4. La animación con GSAP ScrollTrigger

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
  ease: "power2.out",
  scrollTrigger: { scrub: 1 }, // ata el progreso al scroll, no es un timer
});

tl.to("#hero-key", { duration: 1, scale: 1 }) // zoom-out de la imagen: 1.25 -> 1
  .to("#hero-key-logo", { opacity: 0 }, "<") // capa superior se desvanece
  .to("#hero-footer", { opacity: 0 }, "<") // UI/texto extra desaparece
  .to("#hero-play-button", { opacity: 0 }, "<")
  .to("#logo-mask", { maskSize: "clamp(20vh, 25%, 30vh)" }, 0.15) // <- LA MÁSCARA SE ACHICA
  .to("#hero-key", { opacity: 0, duration: 0.2 }, 0.4); // todo el bloque se desvanece
```

`"<"` significa "arrancar al mismo tiempo que el tween anterior". El tercer argumento numérico en
`.to(target, vars, posicion)` es la posición en la timeline donde arranca ese tween (permite
solapar animaciones en vez de encadenarlas en serie).

Lo que pasa visualmente al bajar el scroll:

1. La imagen hace un leve zoom-out y la capa superior/UI se desvanece.
2. **El paso clave**: `mask-size` pasa de "gigante" a un tamaño normal (20–30% del viewport). El
   área visible de la imagen se contrae hasta encajar exactamente en la silueta del molde SVG.
3. Todo el bloque enmascarado se desvanece (`opacity: 0`), dejando ver el resto de la página real.

## Receta para adaptarlo a otra marca / imagen

1. Conseguir o generar el **SVG del logo/wordmark** de la marca como paths sólidos rellenos.
2. Crear un contenedor fijo a pantalla completa con `mask-image` apuntando a ese SVG, más
   `mask-repeat: no-repeat`, `mask-position` según dónde deba aparecer el texto, y `mask-size`
   inicial con el truco del `clamp(gigante, %, 0)`.
3. Meter adentro la imagen/foto de la marca, `position: fixed`, `object-cover`, con un `scale`
   inicial mayor a 1 para tener margen de zoom-out.
4. Animar con GSAP + ScrollTrigger (`scrub`) en paralelo:
   - `scale` del contenedor de imagen: valor inicial → 1.
   - `opacity` de capas superiores/UI → 0.
   - `maskSize` del contenedor con máscara: de "gigante" a un tamaño final chico (acá es donde
     se revela el texto con forma real).
   - al final, `opacity: 0` de todo el bloque para pasar al resto de la página.

### Parámetros que hay que ajustar por proyecto

- **`viewBox` del SVG**: define el aspect ratio del molde, afecta cómo se ve al centrarlo.
- **`mask-position`**: dónde queda centrado el texto en pantalla (ej. `center 25%` = arriba del centro).
- **Rango final de `mask-size`** (ej. `clamp(20vh, 25%, 30vh)`): qué tan grande queda el texto
  antes de desaparecer del todo.
- **`scale` inicial de la imagen** (ej. `scale-125`): cuánto zoom-out se ve al scrollear.
- **Posiciones de la timeline** (`0`, `0.15`, `0.4`, etc.): controlan el timing relativo entre
  el zoom, el fade de capas y el achique de la máscara.
