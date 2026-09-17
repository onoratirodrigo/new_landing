// Slides del carrusel del bloque "Etman Market".
//
// Los archivos los genera `npm run images` a partir de las capturas
// master que viven en imgs/ (PNG sin pérdida, tomadas con DevTools a
// DPR 3). Se publican en /images/etman-market/ como <slug>-<ancho>.avif
// y .webp en 1280, 1920 y 2560 px.
//
// Para cambiar una captura: sacala de nuevo con DevTools, dejala en
// imgs/ con el mismo nombre de master que espera scripts/images.mjs y
// corré `npm run images`. Acá no hay que tocar nada salvo que cambie el
// texto o el orden.

export type MarketSlide = {
  /** Base del archivo en /images/etman-market/, sin ancho ni extensión. */
  slug: string;
  alt: string;
  /** Epígrafe sobre la captura. */
  title: string;
  kicker: string;
};

/** Anchos generados por scripts/images.mjs, para armar el srcset. */
export const MARKET_WIDTHS = [1280, 1920, 2560] as const;

export const marketSlides: MarketSlide[] = [
  {
    slug: "market-home",
    alt: "Home de Etman Market con el banner de campaña y los especiales del mes",
    title: "Tu home, tu sucursal",
    kicker: "Campañas por marca y condiciones del mes",
  },
  {
    slug: "market-patente",
    alt: "Búsqueda por patente con marca, modelo y motor completados automáticamente",
    title: "Buscá por patente",
    kicker: "Trae marca, modelo y motor solo",
  },
  {
    slug: "market-promociones",
    alt: "Grilla de promociones vigentes con sus fechas de inicio y cierre",
    title: "Promociones vigentes",
    kicker: "Con fecha de inicio y de cierre a la vista",
  },
  {
    slug: "market-carrito",
    alt: "Carrito de compras con precio, costo y stock de cada producto",
    title: "Carrito de compras",
    kicker: "Precio, costo y stock línea por línea",
  },
  {
    slug: "market-usuarios",
    alt: "Pantalla de administración de usuarios con perfiles y permisos",
    title: "Administrá tus usuarios",
    kicker: "Un perfil y permisos para cada persona",
  },
  {
    slug: "market-listas",
    alt: "Creación de listas de precios con márgenes y descuentos sobre el costo",
    title: "Armá tus listas de precios",
    kicker: "Márgenes y descuentos sobre el costo",
  },
  {
    slug: "market-coeficientes",
    alt: "Tabla de coeficientes por marca con excepciones por línea de producto",
    title: "Coeficientes por marca",
    kicker: "Excepciones por marca y por línea",
  },
];
