# Etman — Landing institucional

Nueva landing institucional de **Etman**, construida con **Astro + React + Tailwind CSS**. Inspirada en la estructura de dayco.com, adaptada a la identidad de marca y los productos del grupo Etman, con la paleta del nuevo Etman Market.

## Stack

- **Astro 4** — renderizado estático ultra rápido, output limpio.
- **React 18** — disponible como integración para componentes interactivos (Astro carga JS solo donde se usa, así que el bundle queda mínimo).
- **Tailwind CSS** — sistema de utilidades; tokens de marca configurados en `tailwind.config.mjs`.
- **TypeScript** — todo el código está tipado.

## Estructura

```
new_landing/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.svg
│   ├── images/              # logos, fotos, posters
│   └── videos/              # hero.mp4
└── src/
    ├── env.d.ts
    ├── styles/
    │   └── global.css       # tokens + utilidades base
    ├── data/                # contenido editable sin tocar markup
    │   ├── site.ts
    │   ├── nav.ts
    │   ├── categories.ts
    │   ├── branches.ts
    │   ├── stats.ts
    │   └── brands.ts
    ├── layouts/
    │   └── BaseLayout.astro
    ├── components/
    │   ├── Header.astro
    │   ├── Footer.astro
    │   ├── Logo.astro
    │   ├── Hero.astro
    │   ├── Stats.astro
    │   ├── About.astro
    │   ├── Categories.astro
    │   ├── CategoryIcon.astro
    │   ├── EtmanMarket.astro
    │   ├── Branches.astro
    │   └── Contact.astro
    └── pages/
        └── index.astro
```

## Configuración de entorno

El sitio incluye un portal de clientes que se conecta a una base MySQL. Copiá
`.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`: credenciales de la
  base de datos (en desarrollo se accede vía túnel SSH, por eso `DB_HOST` es
  `127.0.0.1`).
- `SESSION_SECRET`: clave para firmar las cookies de sesión. Generar una nueva con
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `DB_TUNNEL_REMOTE` / `DB_TUNNEL_SSH_HOST`: datos del túnel SSH hacia la base
  (host:puerto real de la base, y el alias de `~/.ssh/config` a usar). `npm run dev`
  abre este túnel automáticamente si no está activo.

`.env` nunca se sube al repositorio (está en `.gitignore`).

## Cómo correr el proyecto

```bash
npm install
npm run dev          # http://localhost:4321 (abre el túnel SSH a la DB si hace falta)
npm run build        # genera /dist con la build estática
npm run preview      # previsualiza la build
```

## Personalización rápida

| Necesito cambiar...           | Archivo                              |
| ----------------------------- | ------------------------------------ |
| Texto de navegación           | `src/data/nav.ts`                    |
| Teléfono, email, redes        | `src/data/site.ts`                   |
| Categorías de producto        | `src/data/categories.ts`             |
| Sucursales                    | `src/data/branches.ts`               |
| Stats del bloque numérico     | `src/data/stats.ts`                  |
| Marcas en el marquee          | `src/data/brands.ts`                 |
| Paleta de colores             | `tailwind.config.mjs` (sección `brand`) |
| Estilos globales / utilidades | `src/styles/global.css`              |
| Video del hero                | poner `hero.mp4` en `public/videos/` |

## Secciones incluidas

1. **Hero** con video de fondo y CTA primario/secundario.
2. **Stats** — 4 métricas clave en formato compacto.
3. **Nosotros** — bloque editorial con tarjetas de cobertura y portafolio.
4. **Productos** — grilla de 6 categorías + marquee de marcas.
5. **Etman Market** — sección destacada (full bleed magenta) con mockup del e-commerce, features y CTAs.
6. **Sucursales** — mapa estilizado de Argentina con los 7 puntos logísticos.
7. **Contacto** — formulario completo con tipo de consulta.
8. **Footer** — navegación, sucursales, contacto y redes sociales.

## Notas

- El video del hero está referenciado en `src/data/site.ts` (campo `heroVideo`). Ver `public/videos/README.md`.
- El logo es una marca tipográfica temporal en `src/components/Logo.astro` — reemplazar por el SVG oficial cuando esté disponible.
- Las imágenes de respaldo en About y Branches son SVGs decorativos generados inline; cambiarlos por fotos reales cuando estén.
