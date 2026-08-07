# Logos de marcas

Acá viven **todos** los logos del showcase de marcas y de las cards de categoría.
Se sirven desde este mismo sitio: el proyecto ya no depende de que las imágenes
sigan publicadas en el WordPress de etman.com.ar.

Los archivos originales salieron del CDN de WP (`/wp-content/uploads/`), en su
recorte de 300px. Los nombres se normalizaron a kebab-case, sin los sufijos que
agrega WordPress (`-1`, `-2`, `-300x300`).

## Cómo sumar una marca

1. Guardá el archivo acá, ideal PNG con fondo transparente y ~300px de lado.
   Nombre en kebab-case según el nombre comercial: `bosch.png`, `federal-mogul.png`.
2. Abrí `src/data/brands.ts` y sumá la entrada:

   ```ts
   { name: "Bosch", logo: `${logos}/bosch.png` },
   ```

   Si el logo es notoriamente más ancho que alto, agregá `wide: true` para que
   se renderice a menor altura y no desbalancee la fila.
3. Si además tiene que aparecer dentro de una card de categoría, sumala también
   en `src/data/categories.ts`.

Las marcas se ordenan alfabéticamente (no es estricto — el marquee las pasa todas).

## Marcas pendientes de logo

Listadas en el catálogo de Etman pero sin archivo todavía:

- Ajusa
- Bosch
- BTA
- Delphi
- Denso
- Federal Mogul
- K78
- Lemförder
- Moog
- Petronas
- Sabo
- Tridon
- Wabco
- Wagner
- Wahler
- Wix
- (entre otras del filtro de productos)

Cuando me pases los archivos, los copio acá y los sumo al marquee.
