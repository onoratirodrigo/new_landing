# Slides del carrusel de Etman Market

**No edites esta carpeta a mano.** Los archivos que hay acá los genera
`npm run images` a partir de las capturas master que viven en `imgs/`.

## Cómo reemplazar o agregar una captura

### 1. Sacar la captura a 3x, no con printscreen

Un printscreen de una pantalla 1080p da un píxel por píxel CSS, y la slide
se muestra hasta a ~1300px CSS de ancho: en cualquier pantalla retina eso
se agranda y se ve blando. La captura hay que pedírsela al navegador a
mayor densidad, que **vuelve a dibujar el texto** con más píxeles en vez de
interpolarlos.

En Chrome:

```
F12  →  Ctrl+Shift+M (device toolbar)  →  "Responsive", 1920 x 1080
⋮ de la barra del dispositivo  →  "Add device pixel ratio"  →  DPR: 3
Ctrl+Shift+P  →  "Capture screenshot"
```

Sale un PNG de 5763x3241. En Firefox el campo DPR ya viene visible en la
barra de Responsive Design Mode, y el ícono de cámara captura.

No sirve abrir Chrome con `--force-device-scale-factor=2` y hacer
printscreen: en un monitor de 1080p eso deja un layout de 960px dibujado a
2x, no un layout de 1920 con el doble de detalle.

### 2. Dejar el master en `imgs/`

Con el nombre que espera `scripts/images.mjs` (`home.png`,
`busqueda_patente.png`, etc.). Esa carpeta está en `.gitignore` y no se
despliega: son varios MB por archivo y solo sirven para poder regenerar
todo cuando cambie el diseño del Market.

**Ojo con los datos.** Las capturas se sacan de una sesión real. Antes de
publicar una, revisá que no queden nombres de clientes, precios de costo ni
datos de contacto de nadie. Para el carrito y las pantallas de gestión,
usar una cuenta de prueba.

### 3. Correr el pipeline

```
npm run images
```

Genera AVIF y WebP en 1280, 1920 y 2560 px, que es lo que se sirve con
`srcset`. Nada de JPEG: son capturas de interfaz, todo texto y bordes
duros, y ahí el JPEG mete ringing alrededor de las letras.

## Cambiar textos, orden o cantidad de slides

En `src/data/marketSlides.ts` (epígrafes, `alt` y orden) y en la lista
`SLIDES` de `scripts/images.mjs` (qué master corresponde a cada slug).
