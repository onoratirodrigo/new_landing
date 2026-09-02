# Prompt IA — Caja Etman abriéndose con las marcas

Reemplazo del grid de **flip-cards de categorías** en [`Categories.astro`](src/components/Categories.astro) (las cards que hoy giran al pasar el mouse y muestran las marcas al dorso). En su lugar: una **animación disparada por scroll** — a medida que el usuario baja la página, la caja de Etman se va abriendo y las marcas salen de adentro.

---

## 1. Decisiones ya tomadas

| Aspecto | Decisión |
|---|---|
| Material de la caja | Cartón/packaging realista |
| Qué reemplaza | El grid de flip-cards de `Categories.astro` (sección `#productos`) |
| Disparador de la animación | **Scroll** — la caja se abre progresivamente a medida que se baja, no es un loop ni autoplay |
| Tecnología de animación | **GSAP ScrollTrigger** (ya está en el proyecto, `package.json` → `gsap: ^3.15.0`) |
| Audio | Sin audio |
| Fondo | Transparente (se integra sobre el `bg-brand-600` de la sección) |
| Logos de marca | **No** generados por la IA — se agregan aparte, en código, como elementos reales animados (ver sección 3) |

## 2. Por qué los logos van aparte (respuesta a "¿podés agregar las imágenes después?")

Sí, pero no como edición/composición de video — como **código**. Como esto termina siendo una animación scrubbeada por scroll (no un clip que se reproduce solo), lo que tiene sentido es:

1. La IA genera **solo la caja abriéndose**, vacía por dentro (sin logos, sin tarjetas con texto).
2. Yo tomo ese asset (secuencia de frames o video corto) y escribo un **GSAP ScrollTrigger** que:
   - scrubbea el frame/tiempo de la caja según el progreso del scroll en esa sección,
   - anima los **44 PNG reales** de `public/images/brands/` como elementos separados (DOM o canvas) que "salen" de la boca de la caja en el momento y con la trayectoria que corresponda, con stagger entre marcas.
3. Resultado: la caja se ve como generó la IA, pero los logos quedan **siempre nítidos** (son los PNG reales, no algo que la IA intentó dibujar), y todo es responsive porque es código, no un video horneado a una resolución fija.

Puedo escribir esa parte de GSAP en cuanto tengamos el asset de la caja — no hace falta pedirlo aparte.

## 3. Recomendación técnica: secuencia de PNG, no video comprimido

Para scroll-scrubbing con transparencia, mejor **secuencia de imágenes PNG con alpha** (tipo las páginas de producto de Apple) que un video WebM con alpha:

- WebM con canal alpha **no lo soporta Safari** de forma confiable → rompería en iOS/macOS.
- Un video MP4/H.264 no soporta transparencia.
- Hacer `video.currentTime = x` en cada evento de scroll es poco confiable en varios navegadores (seeks async, frames que no llegan a tiempo).
- La técnica estándar para "objeto que se abre/rota mientras se scrollea" es: **canvas + secuencia de N frames PNG**, se dibuja el frame `Math.floor(scrollProgress * totalFrames)` en cada tick. Funciona igual en todos los navegadores y soporta transparencia real.

→ Al generar con la IA, pedir el resultado como **secuencia de frames** (o un video del que después se extraen frames con `ffmpeg`), no un clip final para reproducir tal cual.

## 4. Cuántos frames pedir

- Recomendado: **60-90 frames** cubriendo desde caja cerrada hasta caja abierta con las solapas totalmente desplegadas (sin logos, eso lo pone el código).
- Si la IA genera video, exportar luego a PNG secuencia con:
  ```
  ffmpeg -i caja-etman.mp4 -vf "fps=30" -vsync 0 frame_%03d.png
  ```

## 5. Prompt — Imagen keyframe (referencia de la caja, punto de partida)

> La herramienta no tiene campo de negative prompt, así que todo lo que hay que evitar va **metido dentro del mismo prompt**, como instrucción explícita en positivo (ej. "the top flaps are plain, with no text or logo on them" en vez de un negative prompt aparte).

> Ajustado tras la primera prueba: el logo solo va en la cara frontal fija (no en la tapa superior), porque esa tapa es la que gira al abrirse y el texto salió espejado/ilegible cuando estaba ahí. Tampoco pedir texto extra tipo "shipping".

> Ajustado de nuevo tras ver una foto de la caja real de Etman: el logo real es un ícono "E" en contorno negro arriba de la palabra "etman" en minúscula, negro, bold, más una franja roja fina debajo. Se usa esto en vez del texto genérico — **sin** copiar el tagline, la lista de ciudades ni los logos de marcas ya impresos en la caja real (son mucho texto chico, la IA los deforma igual que pasó con "shipping"; esas marcas ya las mostramos aparte, volando fuera de la caja).

> Ajustado de nuevo tras v3: el logo salió bien pero **la geometría de la caja estaba rota** — se veía casi de frente, sin la cara lateral completa (recortada en el borde del cuadro), y las líneas de la tapa de arriba no convergían de forma consistente con las de la cara frontal, dando una caja "aplanada"/imposible en vez de un volumen real. Se agregó una descripción explícita de perspectiva y geometría, y se pidió dejar margen alrededor para que no se recorte ninguna cara.

```
A realistic cardboard shipping box, closed, photographed from a three-quarter eye-level angle so that exactly three faces are fully visible and un-cropped within the frame: the front panel, the right side panel, and the top panel. Correct single-point perspective: all vertical edges are perfectly vertical and parallel to each other, the edges receding into depth on the top and side faces converge consistently toward one shared vanishing point, and every corner of the box meets at a geometrically accurate angle — no warped, bent, twisted, or impossible edges anywhere. The box has a roughly cube-like proportion (not stretched, flattened, or skewed), with a small margin of empty space around the whole box so no face or edge is cut off by the frame. Isolated on a fully transparent background, with no floor, no backdrop, no shadow catcher plane, and no props of any kind in frame. The box is kraft brown cardboard. On the front-facing panel only, centered, is a logo: a bold black outlined "E" monogram icon, with the word "etman" in lowercase bold black sans-serif lettering directly below it, and a thin solid red horizontal band running across the box just below that lettering. This branding is upright, clearly legible, and appears only once, only on the front panel — no other text, tagline, or additional logos anywhere on the box. The top panel and the visible side panel are plain unprinted kraft cardboard with absolutely no text, no logos, no extra words, no mirrored or duplicated lettering anywhere. Packing tape seals the top flaps. Clean studio product photography lighting, a soft shadow directly under the box only, high detail cardboard texture, photorealistic packaging, single isolated subject centered in frame.
```

## 6. Prompt — Video / secuencia (caja abriéndose, sin logos en las solapas)

> La herramienta de video tiene un límite de **500 caracteres**, así que esta versión es la misma idea comprimida al hueso (la de imagen, sección 5, no tiene ese límite y se deja completa). Se priorizó lo que realmente causó problemas: geometría correcta, fondo transparente, y el logo solo en la cara frontal.

```
Cardboard box animation, three-quarter view, all three faces visible, uncropped. Correct perspective: parallel vertical edges, one vanishing point, square corners, no warped geometry. Transparent background, no floor, no props. Kraft box opens smoothly, rigid flaps, no bending or melting. Front panel only: black "E" icon, "etman" lowercase wordmark, thin red band, legible, unchanging. Top and side plain, no text or logos. Soft glow inside, nothing emerges. Static camera, 24-30fps.
```
*(485 caracteres)*

## 7. Implementación en el sitio (referencia para cuando tengamos el asset)

- Reemplaza el `<div class="mt-12 grid ...">` de flip-cards en `Categories.astro`.
- `ScrollTrigger` con `scrub: true` atado al alto de la sección `#productos`.
- Canvas dibuja el frame de la caja según progreso de scroll.
- Timeline GSAP secundaria (puede compartir el mismo `scrub`) anima los 44 `<img>` de `public/images/brands/` con opacity/translate/scale, apareciendo escalonados (stagger) desde el centro de la caja hacia sus posiciones finales (podría ser un grid final, como en la marquee actual, o quedar flotando).
- Respetar `prefers-reduced-motion` (el patrón ya existe en el script actual de `Categories.astro`): si está activo, mostrar la caja abierta y los logos en su posición final sin animar.

## 8. Checklist final antes de generar

- [ ] Generar/exportar como secuencia de PNG con alpha (no video comprimido final)
- [ ] Confirmar rango de frames (60-90) cubriendo cerrada → abierta
- [ ] Validar que el fondo sea 100% transparente en cada frame (revisar bordes/antialiasing)
- [ ] Revisar que el logo solo aparezca en la cara frontal fija, legible y sin espejarse en ningún frame
- [ ] Confirmar que las solapas superiores queden lisas, sin texto, en toda la secuencia
- [ ] Una vez con el asset, armar el GSAP ScrollTrigger + animación de los 44 logos reales

## 9. Historial de pruebas

- **v1 (imagen keyframe):** caja cerrada, fondo transparente correcto, logo del frente legible y en el magenta correcto. Problema: la tapa superior tenía "Etman"/"SHIPPING" espejado e ilegible — corregido en el prompt de la sección 5, ahora pidiendo logo solo en la cara frontal y tapas lisas.
- **v2 (imagen keyframe):** con el prompt corregido — logo solo en la cara frontal, legible, tapa superior lisa sin texto, sin "SHIPPING", fondo transparente. Quedó algo de ruido leve en el canal alfa cerca de los bordes.
- **v3 (imagen keyframe, aprobada — logo real):** con el prompt del logo real (ícono "E" + "etman" minúscula + franja roja). Logo nítido y fiel a la marca real, tapa superior lisa, sin tagline ni logos de más, fondo transparente limpio (sin el ruido de v2). **Esta es la keyframe de referencia definitiva para generar la secuencia de apertura (sección 6).**
