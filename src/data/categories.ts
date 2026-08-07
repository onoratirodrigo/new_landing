// Categorías destacadas del portafolio.
// Iconos manejados como nombres de SVG para mantener el componente desacoplado.
// Cada categoría incluye las marcas que se muestran al hacer flip de la card.

export type CategoryBrand = {
  name: string;
  /** Ruta del logo en /public/images/brands/. Ver src/data/brands.ts para el listado completo. */
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

const logos = "/images/brands";

export const categories: Category[] = [
  {
    id: "motor",
    title: "Motor & Transmisión",
    description:
      "Correas, bombas, embragues y componentes esenciales para el corazón del vehículo.",
    icon: "engine",
    href: "#productos",
    brands: [
      { name: "Gates", logo: `${logos}/gates.png` },
      { name: "Sachs", logo: `${logos}/sachs.png` },
      { name: "SKF", logo: `${logos}/skf.png` },
      { name: "Mahle", logo: `${logos}/mahle.png` },
      { name: "Spicer", logo: `${logos}/spicer.png` },
      { name: "VMG", logo: `${logos}/vmg.png` },
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
      { name: "Nakata", logo: `${logos}/nakata.png` },
      { name: "Raybestos", logo: `${logos}/raybestos.png` },
      { name: "Fremax", logo: `${logos}/fremax.png` },
      { name: "FrenoSilent", logo: `${logos}/frenosilent.png` },
      { name: "TRW", logo: `${logos}/trw.png` },
      { name: "Plasbestos", logo: `${logos}/plasbestos.png` },
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
      { name: "Mahle", logo: `${logos}/mahle.png` },
      { name: "Fremec", logo: `${logos}/fremec.png` },
      { name: "Hellux", logo: `${logos}/hellux.png` },
      { name: "Mopar", logo: `${logos}/mopar.png` },
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
      { name: "Mobil", logo: `${logos}/mobil.png` },
      { name: "Liqui Moly", logo: `${logos}/liqui-moly.png` },
      { name: "Wolf", logo: `${logos}/wolf.png` },
      { name: "Champion", logo: `${logos}/champion.png` },
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
      { name: "Hella", logo: `${logos}/hella.png` },
      { name: "Osram", logo: `${logos}/osram.png` },
      { name: "NGK", logo: `${logos}/ngk.png` },
      { name: "Valeo", logo: `${logos}/valeo.png` },
      { name: "ACDelco", logo: `${logos}/acdelco.png` },
      { name: "Trico", logo: `${logos}/trico.png` },
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
      { name: "Crossmaster", logo: `${logos}/crossmaster.png` },
      { name: "Driven", logo: `${logos}/driven.png` },
      { name: "Aion", logo: `${logos}/aion.png` },
    ],
  },
];
