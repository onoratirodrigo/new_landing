// Listado de marcas que comercializa Etman.
// Los logos viven en /public/images/brands/ — se sirven desde este mismo sitio,
// sin depender de etman.com.ar. Para sumar una marca: guardá el PNG en esa
// carpeta con nombre kebab-case y agregá la entrada acá. Ver el README de la
// carpeta para el detalle.

export type Brand = {
  name: string;
  /** Ruta del logo en /public/images/brands/. Si no se provee, se renderiza tipográficamente (fallback). */
  logo?: string;
  /** Marca con logo más ancho que alto (proporción no cuadrada). Se renderiza a menor altura para equiparar peso visual con el resto. */
  wide?: boolean;
};

const logos = "/images/brands";

export const brands: Brand[] = [
  { name: "ACDelco", logo: `${logos}/acdelco.png` },
  { name: "Adon", logo: `${logos}/adon.png` },
  { name: "AG", logo: `${logos}/ag.png` },
  { name: "Aion", logo: `${logos}/aion.png`, wide: true },
  { name: "Armetal", logo: `${logos}/armetal.png` },
  { name: "Capemi", logo: `${logos}/capemi.png` },
  { name: "Champion", logo: `${logos}/champion.png` },
  { name: "Crossmaster", logo: `${logos}/crossmaster.png`, wide: true },
  { name: "CTC", logo: `${logos}/ctc.png` },
  { name: "Driven", logo: `${logos}/driven.png`, wide: true },
  { name: "Etma", logo: `${logos}/etma.png` },
  { name: "Eurorepar", logo: `${logos}/eurorepar.png` },
  { name: "Fremax", logo: `${logos}/fremax.png` },
  { name: "Fremec", logo: `${logos}/fremec.png` },
  { name: "FrenoSilent", logo: `${logos}/frenosilent.png` },
  { name: "Gates", logo: `${logos}/gates.png` },
  { name: "GM", logo: `${logos}/gm.png` },
  { name: "Griffo", logo: `${logos}/griffo.png` },
  { name: "Hankook", logo: `${logos}/hankook.png` },
  { name: "Hella", logo: `${logos}/hella.png` },
  { name: "Hellux", logo: `${logos}/hellux.png` },
  { name: "Kessel", logo: `${logos}/kessel.png` },
  { name: "Liqui Moly", logo: `${logos}/liqui-moly.png` },
  { name: "Locx", logo: `${logos}/locx.png` },
  { name: "Mahle", logo: `${logos}/mahle.png` },
  { name: "Mobil", logo: `${logos}/mobil.png` },
  { name: "Mopar", logo: `${logos}/mopar.png` },
  { name: "Nakata", logo: `${logos}/nakata.png` },
  { name: "NGK", logo: `${logos}/ngk.png` },
  { name: "Omer", logo: `${logos}/omer.png` },
  { name: "Osram", logo: `${logos}/osram.png` },
  { name: "Plasbestos", logo: `${logos}/plasbestos.png` },
  { name: "Raybestos", logo: `${logos}/raybestos.png` },
  { name: "Renault", logo: `${logos}/renault.png` },
  { name: "Sachs", logo: `${logos}/sachs.png` },
  { name: "SKF", logo: `${logos}/skf.png` },
  { name: "Spicer", logo: `${logos}/spicer.png` },
  { name: "Thompson", logo: `${logos}/thompson.png` },
  { name: "Trico", logo: `${logos}/trico.png` },
  { name: "TRW", logo: `${logos}/trw.png` },
  { name: "Valeo", logo: `${logos}/valeo.png` },
  { name: "Vic", logo: `${logos}/vic.png` },
  { name: "VMG", logo: `${logos}/vmg.png` },
  { name: "Wolf", logo: `${logos}/wolf.png` },
];
