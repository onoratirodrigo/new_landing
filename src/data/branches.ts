export type Branch = {
  id: string;
  city: string;
  region: string;
  address: string;
  phone?: string;
  emails: string[];
  hours: string[];
  image: string;
  /** URL del embed de Google Maps. */
  mapEmbed: string;
  /** Posición del pin sobre la imagen del mapa de Argentina (porcentajes 0-100). */
  mapPosition: { x: number; y: number };
};

// Datos de los puntos logísticos de Etman (fuente: etman.com.ar/puntos-de-venta).
export const branches: Branch[] = [
  {
    id: "amba",
    city: "AMBA",
    region: "Buenos Aires",
    address:
      "Gral. Martín de Gainza 1900, Trujui, Parque Industrial Rivadavia, Moreno",
    emails: ["ventas@etman.com.ar"],
    hours: [],
    image: "/images/branches/pilar.png",
    mapEmbed:
      "https://maps.google.com/maps?q=Gral.%20Mart%C3%ADn%20de%20Gainza%202060%2C%20B1664%20Trujui%2C%20Provincia%20de%20Buenos%20Aires&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 49.8, y: 36.3 },
  },
  {
    id: "bahia-blanca",
    city: "Bahía Blanca",
    region: "Buenos Aires",
    address: "Israel 34 — B8000IRB — Bahía Blanca",
    phone: "(0291) 456-5000",
    emails: ["ventas@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 18:00 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image:
      "/images/branches/casa-central.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=Israel%2034%20Bah%C3%ADa%20Blanca%20Buenos%20Aires&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 56.5, y: 48.1 },
  },
  {
    id: "cordoba",
    city: "Córdoba",
    region: "Córdoba",
    address: "Av. Gdor. Sabattini 3030 — X5014AUY — Córdoba",
    phone: "(0351) 554-3000",
    emails: ["ventascordoba@etman.com.ar", "cordoba@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 18:00 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image: "/images/branches/cordoba.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=Av.%20Gdor.%20Sabattini%203030%20cordoba&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 37.8, y: 38.9 },
  },
  {
    id: "rosario",
    city: "Rosario",
    region: "Santa Fe",
    address: "9 de Julio 2361/69 — S2000PJC — Rosario",
    phone: "(0341) 425-3500",
    emails: ["ventasrosario@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 18:00 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image: "/images/branches/rosario.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=9%20de%20Julio%202361%20rosario&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 44.0, y: 34.5 },
  },
  {
    id: "rafaela",
    city: "Rafaela",
    region: "Santa Fe",
    address: "Bvar. Lehmann 1687 — S2300GTD — Rafaela",
    phone: "(03492) 29-0620",
    emails: ["ventasrafaela@etman.com.ar", "sucursalrafaela@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 17:00 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image: "/images/branches/rafaela.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=Bvar.%20Lehmann%201687%20santa%20fe&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 34.3, y: 23.8 },
  },
  {
    id: "parana",
    city: "Paraná",
    region: "Entre Ríos",
    address: "Av. Ramirez 4753 — E3104MHE — Paraná",
    phone: "(0343) 435-0537",
    emails: ["ventasparana@etman.com.ar", "parana@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 12:30 hs. y 15:30 a 19:30 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image: "/images/branches/parana.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=Av.%20Ramirez%204753%20Paran%C3%A1%20Entre%20R%C3%ADos&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 40.3, y: 27.6 },
  },
  {
    id: "mendoza",
    city: "Mendoza",
    region: "Mendoza",
    address: "Luis Pasteur 897 — M5519EPA — San José, Guaymallén",
    phone: "(0261) 432-7400",
    emails: ["ventasmendoza@etman.com.ar", "sucursalmendoza@etman.com.ar"],
    hours: [
      "Lunes a Viernes de 08:00 a 17:00 hs.",
      "Sábados de 08:30 a 12:30 hs.",
    ],
    image: "/images/branches/mendoza.jpg",
    mapEmbed:
      "https://maps.google.com/maps?q=pasteur%20897%20guaymallen%20mendoza&t=m&z=15&output=embed&iwloc=near",
    mapPosition: { x: 30.7, y: 51.2 },
  },
];
