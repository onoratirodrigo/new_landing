// Silueta del país para el dibujo de fondo de la card de cobertura en
// Nosotros (ver .plate-art-map en global.css).
//
// Misma cocina que provinceShapes.ts: Natural Earth admin-0 (escala 1:50m —
// a 1:10m el contorno del país entero pesa varias veces más y a 90px de
// ancho no se nota), longitud corregida por el coseno de la latitud media
// —sin eso la Patagonia sale estirada a lo ancho—, simplificado con
// Douglas-Peucker y normalizado.
//
// Lo único que cambia respecto de las provincias es el encuadre: allá todas
// tienen que entrar en la MISMA caja cuadrada, así que se normaliza el lado
// más largo y el corto queda con aire. Acá hay una sola forma, y es flaca y
// alta: una caja cuadrada la dejaría con más de la mitad del ancho vacío y
// el CSS tendría que compensar a ojo. Por eso la caja va ajustada al
// dibujo: alto 100, ancho el que salga.
//
// Son dos subtrazos: el continente y la parte argentina de Tierra del
// Fuego. Las islas chicas no entran: a este tamaño son ruido.
export const ARGENTINA_VIEW_BOX = "0 0 46.54 100";

export const argentinaOutline =
  "M37.65 25.23L35.49 37.6L38.68 40.81L38.2 42.43L39.75 43.9L39.73 45.61L37.79 49L36.3 50.06L29.39 51.73L26.51 51.15L27.17 52.88L26.36 57.44L23.47 58.25L20.06 57.19L20.25 61.09L21.59 62.09L23.06 61.12L23.48 62.88L22.5 63.43L21.43 62.33L20.29 62.79L21.83 63.7L19.63 65.51L18.72 69.83L15.64 70.58L14.09 72.98L16.03 75.85L18.21 76.3L18.39 77.54L17.33 78.32L18.31 78.66L14.41 81.7L13.35 84.81L12.54 85.17L11.57 84.11L10.84 84.87L12.15 85.33L10.93 86.01L9.94 87.95L10.65 89.51L9.69 89.62L10.87 89.9L12.22 91.8L3.91 90.84L2.76 89.49L2.91 86.91L1 87.08L0 83.6L2.27 81.22L3.03 79.53L2.5 78.47L4.42 74.78L4.32 71.55L5.24 70.5L3.57 69.12L5.46 69.1L5.7 68.49L4.14 67.95L4.3 64.51L3.48 63.99L3.38 62.52L4.31 60.92L3.85 57.14L4.38 53.67L6.43 50.37L5.62 45.26L7.48 42.91L7.12 40.46L8.78 37.38L8.86 34.55L8.23 34.3L7.12 28.63L8.8 25.2L8.37 22.63L9.24 19.9L11.15 16.1L12.4 15.56L11.75 14.05L11.82 8.86L14.67 6.71L15.49 3.61L15.05 3.07L17.34 0L18.4 0.89L21.15 1.28L21.81 3.08L22.76 0.68L25.33 0.59L29.58 5.88L37.15 10.03L37.74 11.23L35.3 16.59L40.41 17.31L41.06 16.61L42.12 16.89L44.21 14.59L44.71 11.36L46.41 11.64L46.54 16.01L42.09 19.26L37.65 25.23ZM11.61 99.46L11.66 92.84L12.58 94.13L12 94.67L14.81 97.04L19.8 98.93L16.66 100L11.61 99.46Z";
