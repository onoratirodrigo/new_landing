// Datos de la demo viva del bloque "Etman Market".
//
// La demo reconstruye la pantalla de búsqueda del Market TAL CUAL es (misma
// barra rosa, misma card de producto, mismo carrito) para que quien entre
// después no se encuentre con algo distinto. El markup y los estilos salen
// calcados del sitio real; ver src/components/EtmanMarket.astro y el motor
// en src/scripts/marketDemo.ts.
//
// Los productos, imágenes, logos y códigos son REALES (los mismos que
// sirve el Market), descargados a public/images/market-demo/. Lo único
// ficticio son los precios y el estado de stock —por eso la placa "datos
// de ejemplo" en la ventana—: así la demo no muestra precios de costo ni
// datos de ninguna cuenta, que era el problema de la captura del carrito.

export type StockEstado = "sucursal" | "cinco-dias";

export type DemoProducto = {
  marca: string;
  /** Logo de la marca en public/images/market-demo/. */
  logo: string;
  /** Nombre tal como lo lista el Market. */
  nombre: string;
  /** Código de referencia real del catálogo. */
  codigo: string;
  /** Imagen del producto en public/images/market-demo/. */
  img: string;
  /** Precio de ejemplo, ya formateado (no es el precio real). */
  precio: string;
  stock: StockEstado;
};

export const demoBusqueda = {
  /** Patente ficticia, formato Mercosur (AA 000 AA). */
  patente: "PD 337 HG",
  /** Lo que el Market resuelve solo a partir de la patente. */
  vehiculo: { automotriz: "FIAT", modelo: "PALIO", motor: "1.4 8V" },
  /** Pieza buscada. */
  pieza: "Amortiguador",
};

// Tres resultados reales de la marca SACHS. Se mezclan los dos estados de
// stock a propósito: es el diferencial del Market —te dice, pieza por
// pieza, si está en tu sucursal hoy o llega en unos días.
export const demoResultados: DemoProducto[] = [
  {
    marca: "SACHS",
    logo: "/images/market-demo/logo-sachs.png",
    nombre: "AMORTIGUADOR DELANTERO",
    codigo: "315 562",
    img: "/images/market-demo/amort-315562.jpg",
    precio: "$ 148.500",
    stock: "sucursal",
  },
  {
    marca: "SACHS",
    logo: "/images/market-demo/logo-sachs.png",
    nombre: "AMORTIGUADOR TRASERO",
    codigo: "315 957",
    img: "/images/market-demo/amort-315957.jpg",
    precio: "$ 152.900",
    stock: "cinco-dias",
  },
  {
    marca: "SACHS",
    logo: "/images/market-demo/logo-sachs.png",
    nombre: "AMORTIGUADOR DELANTERO",
    codigo: "316 918",
    img: "/images/market-demo/amort-316918.jpg",
    precio: "$ 161.200",
    stock: "sucursal",
  },
  {
    marca: "SACHS",
    logo: "/images/market-demo/logo-sachs.png",
    nombre: "AMORTIGUADOR DELANTERO",
    codigo: "316 919",
    img: "/images/market-demo/amort-316919.jpg",
    precio: "$ 159.700",
    stock: "sucursal",
  },
];

// Métodos de entrega del modal, calcados del Market real (checkout.aspx).
export const metodosEntrega = [
  {
    nombre: "Logística Etman",
    desc: "Entregará su producto en su Local/Sucursal asociada con transporte Etman.",
  },
  { nombre: "Retiro en Mostrador", desc: "Solo para clientes locales." },
  { nombre: "Logística Propia", desc: "Transporte privado (homologado) por Etman." },
  {
    nombre: "Retiro Comisionista / Cliente",
    desc: "Retiro despacho sucursal.",
  },
];

// Carrito de la demo (los tres primeros resultados). TODO es de ejemplo:
// los precios de costo son inventados para no exponer márgenes reales en
// una página pública, y se omiten las columnas internas "bo"/"test3".
export const demoCarrito = {
  sucursal: "Bahía Blanca",
  sucursales: 3,
  items: [
    { ...demoResultados[0], cantidad: 2, costo: "$ 92.100", subtotal: "$ 297.000" },
    { ...demoResultados[1], cantidad: 1, costo: "$ 94.800", subtotal: "$ 152.900" },
    { ...demoResultados[2], cantidad: 1, costo: "$ 99.900", subtotal: "$ 161.200" },
  ],
  cantidadTotal: 4,
  totalEtman: "$ 611.100",
  totalCosto: "$ 379.800",
  articulos: 4,
  pedido: "0034512",
  // Método que el ciclo elige en el modal.
  entregaElegida: "Logística Etman",
};

export const STOCK_LABEL: Record<StockEstado, string> = {
  // Texto calcado del Market real, que es donde vive el diferencial.
  sucursal: "En tu sucursal",
  "cinco-dias": "En 5 días",
};
