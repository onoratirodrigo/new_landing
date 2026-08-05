// Slides del carrusel del bloque "Etman Market".
// Las imágenes se sirven desde /public/images/etman-market/.
// Reemplazá los archivos manteniendo los nombres o ajustá `src` acá.

export type MarketSlide = {
  src: string;
  alt: string;
  caption?: string;
};

export const marketSlides: MarketSlide[] = [
  {
    src: "/images/etman-market/slide-1.png",
    alt: "Home de Etman Market con banner del Mundial y especiales del mes",
  },
  {
    src: "/images/etman-market/slide-2.png",
    alt: "Listado de productos por patente con filtros por categoría y marca",
  },
  {
    src: "/images/etman-market/slide-3.png",
    alt: "Sección de promociones vigentes de Etman Market",
  },
];
