// Listado de marcas que comercializa Etman.
// URLs verificadas en el HTML del sitio actual de Etman (showcase de marcas
// + sección "Innovamos"). Para sumar marcas adicionales, lo más seguro es
// guardar los archivos localmente en /public/images/brands/ y referenciarlos
// con ruta relativa, en vez de adivinar nombres en el CDN de WordPress.

export type Brand = {
  name: string;
  /** URL del logo. Si no se provee, se renderiza tipográficamente (fallback). */
  logo?: string;
  /** Marca con logo más ancho que alto (proporción no cuadrada). Se renderiza a menor altura para equiparar peso visual con el resto. */
  wide?: boolean;
};

const cdn = "https://etman.com.ar/wp-content/uploads";

export const brands: Brand[] = [
  { name: "ACDelco", logo: `${cdn}/ACDelco-1-300x300.png` },
  { name: "Adon", logo: `${cdn}/Adon-1-300x300.png` },
  { name: "AG", logo: `${cdn}/AG-1-300x300.png` },
  { name: "Aion", logo: `${cdn}/Aion-300x173.png`, wide: true },
  { name: "Armetal", logo: `${cdn}/Armetal-1-300x300.png` },
  { name: "Capemi", logo: `${cdn}/Capemi-1-300x300.png` },
  { name: "Champion", logo: `${cdn}/Champion-300x300.png` },
  { name: "Crossmaster", logo: `${cdn}/Crossmaster-300x101.png`, wide: true },
  { name: "CTC", logo: "/images/brands/ctc.png" },
  { name: "Driven", logo: `${cdn}/Driven-300x173.png`, wide: true },
  { name: "Etma", logo: `${cdn}/Etma-1-300x300.png` },
  { name: "Eurorepar", logo: `${cdn}/Eurorepar-1-300x300.png` },
  { name: "Fremax", logo: `${cdn}/Fremax-2-300x300.png` },
  { name: "Fremec", logo: `${cdn}/Fremec-1-300x300.png` },
  { name: "FrenoSilent", logo: `${cdn}/FrenoSilent-300x300.png` },
  { name: "Gates", logo: `${cdn}/Gates-1-300x300.png` },
  { name: "GM", logo: `${cdn}/GM-1-300x300.png` },
  { name: "Griffo", logo: `${cdn}/Griffo-1-300x300.png` },
  { name: "Hankook", logo: `${cdn}/Hankook-1-300x300.png` },
  { name: "Hella", logo: `${cdn}/Hella-1-300x300.png` },
  { name: "Hellux", logo: `${cdn}/Hellux-1-300x300.png` },
  { name: "Kessel", logo: `${cdn}/Kessel-1-300x300.png` },
  { name: "Liqui Moly", logo: `${cdn}/LiquiMoly-300x300.png` },
  { name: "Locx", logo: `${cdn}/Locx-300x300.png` },
  { name: "Mahle", logo: `${cdn}/Mahle-1-300x300.png` },
  { name: "Mobil", logo: `${cdn}/Mobil-1-300x300.png` },
  { name: "Mopar", logo: `${cdn}/Mopar-1-300x300.png` },
  { name: "Nakata", logo: `${cdn}/Nakata-1-300x300.png` },
  { name: "NGK", logo: `${cdn}/NGK-1-300x300.png` },
  { name: "Omer", logo: `${cdn}/Omer-300x300.png` },
  { name: "Osram", logo: `${cdn}/Osram-1-300x300.png` },
  { name: "Plasbestos", logo: `${cdn}/Plasbestos-1-300x300.png` },
  { name: "Raybestos", logo: `${cdn}/Raybestos-1-300x300.png` },
  { name: "Renault", logo: `${cdn}/Renault-300x300.png` },
  { name: "Sachs", logo: `${cdn}/Sachs-1-300x300.png` },
  { name: "SKF", logo: `${cdn}/SKF-3-300x300.png` },
  { name: "Spicer", logo: `${cdn}/Spicer-1-300x300.png` },
  { name: "Thompson", logo: `${cdn}/Thompson-1-300x300.png` },
  { name: "Trico", logo: `${cdn}/Trico-300x300.png` },
  { name: "TRW", logo: `${cdn}/TRW-1-300x300.png` },
  { name: "Valeo", logo: `${cdn}/Valeo-1-300x300.png` },
  { name: "Vic", logo: `${cdn}/Vic-300x300.png` },
  { name: "VMG", logo: `${cdn}/VMG-1-300x300.png` },
  { name: "Wolf", logo: `${cdn}/Wolf-1-300x300.png` },
];
