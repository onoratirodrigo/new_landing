// Categorías destacadas del portafolio.
// Iconos manejados como nombres de SVG para mantener el componente desacoplado.
// Cada categoría incluye las marcas que se muestran al hacer flip de la card.

export type CategoryBrand = {
  name: string;
  /** URL del logo. Los logos viven en etman.com.ar; bajarlos local en /public/images/brands/ si se quiere autonomía. */
  logo: string;
};

export type Category = {
  id: string;
  title: string;
  description: string;
  icon: "engine" | "brakes" | "filters" | "lubricants" | "lighting" | "tools";
  href: string;
  brands: CategoryBrand[];
};

const cdn = "https://etman.com.ar/wp-content/uploads";

export const categories: Category[] = [
  {
    id: "motor",
    title: "Motor & Transmisión",
    description:
      "Correas, bombas, embragues y componentes esenciales para el corazón del vehículo.",
    icon: "engine",
    href: "#productos",
    brands: [
      { name: "Gates", logo: `${cdn}/Gates-1-300x300.png` },
      { name: "Sachs", logo: `${cdn}/Sachs-1-300x300.png` },
      { name: "SKF", logo: `${cdn}/SKF-3-300x300.png` },
      { name: "Mahle", logo: `${cdn}/Mahle-1-300x300.png` },
      { name: "Spicer", logo: `${cdn}/Spicer-1-300x300.png` },
      { name: "VMG", logo: `${cdn}/VMG-1-300x300.png` },
    ],
  },
  {
    id: "frenos",
    title: "Frenos & Suspensión",
    description:
      "Pastillas, discos, amortiguadores y partes críticas para una conducción segura.",
    icon: "brakes",
    href: "#productos",
    brands: [
      { name: "Nakata", logo: `${cdn}/Nakata-1-300x300.png` },
      { name: "Raybestos", logo: `${cdn}/Raybestos-1-300x300.png` },
      { name: "Fremax", logo: `${cdn}/Fremax-2-300x300.png` },
      { name: "FrenoSilent", logo: `${cdn}/FrenoSilent-300x300.png` },
      { name: "TRW", logo: `${cdn}/TRW-1-300x300.png` },
      { name: "Plasbestos", logo: `${cdn}/Plasbestos-1-300x300.png` },
    ],
  },
  {
    id: "filtros",
    title: "Filtración",
    description:
      "Filtros de aire, aceite, combustible y habitáculo de las marcas líderes del mercado.",
    icon: "filters",
    href: "#productos",
    brands: [
      { name: "Mahle", logo: `${cdn}/Mahle-1-300x300.png` },
      { name: "Fremec", logo: `${cdn}/Fremec-1-300x300.png` },
      { name: "Hellux", logo: `${cdn}/Hellux-1-300x300.png` },
      { name: "Mopar", logo: `${cdn}/Mopar-1-300x300.png` },
    ],
  },
  {
    id: "lubricantes",
    title: "Lubricantes & Químicos",
    description:
      "Aceites, aditivos y químicos de performance para todas las aplicaciones.",
    icon: "lubricants",
    href: "#productos",
    brands: [
      { name: "Mobil", logo: `${cdn}/Mobil-1-300x300.png` },
      { name: "Liqui Moly", logo: `${cdn}/LiquiMoly-300x300.png` },
      { name: "Wolf", logo: `${cdn}/Wolf-1-300x300.png` },
      { name: "Champion", logo: `${cdn}/Champion-300x300.png` },
    ],
  },
  {
    id: "iluminacion",
    title: "Iluminación & Eléctrico",
    description:
      "Lámparas, encendido, baterías y sistemas eléctricos completos.",
    icon: "lighting",
    href: "#productos",
    brands: [
      { name: "Hella", logo: `${cdn}/Hella-1-300x300.png` },
      { name: "Osram", logo: `${cdn}/Osram-1-300x300.png` },
      { name: "NGK", logo: `${cdn}/NGK-1-300x300.png` },
      { name: "Valeo", logo: `${cdn}/Valeo-1-300x300.png` },
      { name: "ACDelco", logo: `${cdn}/ACDelco-1-300x300.png` },
      { name: "Trico", logo: `${cdn}/Trico-300x300.png` },
    ],
  },
  {
    id: "herramientas",
    title: "Herramientas & Accesorios",
    description:
      "Una nueva línea de soluciones que excede el rubro autopartista.",
    icon: "tools",
    href: "#etman-market",
    brands: [
      { name: "Crossmaster", logo: `${cdn}/Crossmaster-300x101.png` },
      { name: "Driven", logo: `${cdn}/Driven-300x173.png` },
      { name: "Aion", logo: `${cdn}/Aion-300x173.png` },
    ],
  },
];
