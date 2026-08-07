// Configuración general del sitio. Centralizar acá facilita el mantenimiento.

export const site = {
  name: "Etman",
  tagline: "La distribuidora mayorista de mayor cobertura nacional",
  phone: "0800-222-1111",
  phoneHref: "tel:08002221111",
  email: "contacto@etman.com.ar",
  // Hero: mp4 propio servido desde /public/videos (autoplay + muted + loop).
  // Original en Drive: 16KV9RcKQ56yooG9S2P25MzBwcFE96TT0 (65 aniversario,
  // "Así vivimos la semana"); acá va recomprimido y sin audio para web.
  // Lo usa la intro del estarcido (IntroStencil.astro).
  heroVideo: "/videos/hero.mp4",
  heroPoster: "/images/hero-poster.jpg",
  // Assets locales servidos desde /public/images/
  logoUrl: "/images/logo-etman.png",
  // % de descuento por pronto pago, fijo para todos los clientes.
  prontoPagoDescuentoPct: 5,
  mapUrl: "/images/mapa-argentina.png",
  social: {
    facebook: "https://www.facebook.com/EtmanDistribuidorNacionaldeAutopartes",
    instagram: "https://www.instagram.com/etman.oficial/",
    twitter: "https://x.com/Etman_Oficial",
    linkedin: "https://www.linkedin.com/company/3759984",
    youtube: "https://www.youtube.com/user/EtmanOficial",
  },
} as const;
