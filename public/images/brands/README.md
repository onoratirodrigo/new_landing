# Logos de marcas

Carpeta para sumar logos adicionales que **no están publicados** en el CDN de etman.com.ar (o cuya URL exacta no conocemos).

## Cómo sumar una marca

1. Guardá el archivo del logo acá, ideal en PNG con fondo transparente.  
   Sugerencia de nombre: kebab-case basado en el nombre comercial.  
   Ejemplos: `bosch.png`, `delphi.png`, `federal-mogul.png`, `wix.png`.
2. Abrí `src/data/brands.ts` y sumá una entrada nueva:

   ```ts
   { name: "Bosch", logo: "/images/brands/bosch.png" },
   ```

3. Las marcas se ordenan alfabéticamente (no es estricto, podés ponerlas en
   cualquier orden — el marquee las pasa todas).

## Marcas pendientes de logo

Listadas en el catálogo de Etman pero que no encontré en el CDN público:

- Ajusa
- Bosch
- BTA
- CTC
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
