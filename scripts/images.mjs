/*
  Genera los derivados del carrusel de Etman Market.

  De un lado los masters: capturas PNG sin pérdida, tomadas con DevTools a
  DPR 3 (1920x1080 emulado => 5763x3241 reales). Viven en imgs/, que está
  en .gitignore, y NO se despliegan: pesan varios MB cada una y solo sirven
  para poder regenerar todo cuando cambie el diseño del Market.

  Del otro lado lo que sí se sube: AVIF y WebP en tres anchos, servidos con
  srcset para que cada pantalla baje el archivo que le corresponde.

  Dos decisiones que importan:

  - Nunca se agranda. Si un master viene con menos ancho que la variante
    pedida, esa variante se saltea: escalar hacia arriba no inventa
    detalle, solo interpola y pesa más.
  - Nada de JPEG. Son capturas de interfaz, todo texto y bordes duros, y
    ahí el JPEG mete ringing alrededor de las letras justo donde más se
    nota. AVIF y WebP conservan el filo. El <img> de fallback es WebP, que
    soportan todos los navegadores que nos importan.

  Uso: npm run images
*/
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "imgs";
const OUT = "public/images/etman-market";
const WIDTHS = [1280, 1920, 2560];

// master (sin extensión) -> slug del archivo publicado
const SLIDES = [
  ["home", "market-home"],
  ["busqueda_patente", "market-patente"],
  ["promociones", "market-promociones"],
  ["carrito", "market-carrito"],
  ["gerenciarusuarios", "market-usuarios"],
  ["gerenciarlistas1", "market-listas"],
  ["gerenciarlistas2", "market-coeficientes"],
];

const kb = (n) => (n / 1024).toFixed(0).padStart(4) + " KB";

async function main() {
  await mkdir(OUT, { recursive: true });
  const disponibles = await readdir(SRC);

  let total = 0;

  for (const [master, slug] of SLIDES) {
    const file = disponibles.find((f) => path.parse(f).name === master);
    if (!file) {
      console.warn(`  falta el master "${master}" en ${SRC}/ — se saltea`);
      continue;
    }

    const src = path.join(SRC, file);
    const meta = await sharp(src).metadata();
    console.log(`\n${slug}  (master ${meta.width}x${meta.height})`);

    for (const w of WIDTHS) {
      if (meta.width < w) {
        console.warn(`  ${w}px  — el master no llega, se saltea`);
        continue;
      }

      // sharpen compensa el ablandamiento propio del remuestreo al
      // reducir; sin esto las variantes chicas salen lavadas.
      const base = sharp(src).resize({ width: w }).sharpen({ sigma: 0.6 });

      const avif = await base.clone().avif({ quality: 58 }).toBuffer();
      const webp = await base.clone().webp({ quality: 78 }).toBuffer();

      await sharp(avif).toFile(path.join(OUT, `${slug}-${w}.avif`));
      await sharp(webp).toFile(path.join(OUT, `${slug}-${w}.webp`));

      total += avif.length + webp.length;
      console.log(`  ${w}px   avif ${kb(avif.length)}   webp ${kb(webp.length)}`);
    }
  }

  console.log(`\nTotal publicado: ${(total / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
