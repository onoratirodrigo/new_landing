// Configuración general del sitio. Centralizar acá facilita el mantenimiento.

export const site = {
  name: "Etman",
  tagline: "La distribuidora mayorista de mayor cobertura nacional",
  phone: "0800-222-1111",
  phoneHref: "tel:08002221111",
  email: "contacto@etman.com.ar",
  // Hero: video embebido desde YouTube (autoplay + muted + loop).
  // Cuando se quiera usar un mp4 propio, intercambiar a heroVideo en Hero.astro.
  heroYoutubeId: "Y7SmF4_aZjg",
  heroVideo: "/videos/hero.mp4",
  heroPoster: "/images/hero-poster.jpg",
  // Assets locales servidos desde /public/images/
  logoUrl: "/images/logo-etman.png",
  // % de descuento por pronto pago, fijo para todos los clientes.
  prontoPagoDescuentoPct: 5,
  mapUrl: "https://etman.com.ar/wp-content/uploads/HomeMapaArgentina02.png",
  social: {
    facebook: "https://www.facebook.com/EtmanDistribuidorNacionaldeAutopartes",
    instagram: "https://www.instagram.com/etman.oficial/",
    twitter: "https://x.com/Etman_Oficial",
    linkedin: "https://www.linkedin.com/company/3759984",
    youtube: "https://www.youtube.com/user/EtmanOficial",
  },
} as const;
