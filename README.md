# Faro

Análisis de rendimiento web sobre el motor de **Lighthouse**, vía la **PageSpeed Insights API** de Google. Muestra los mismos scores y Core Web Vitals que PageSpeed (móvil y escritorio a la vez) y exporta un informe en Markdown listo para pegar en una IA.

Stack: **Vue 3 (Composition API, sin TypeScript) + Vite**, desplegado en **Cloudflare Workers** (la SPA + un Worker que actúa de API).

## Arquitectura

- El frontend (`src/`) nunca llama a Google directo: pega a `/api/analyze`.
- El Worker (`worker/index.js`) recibe esa petición, llama a PageSpeed Insights añadiendo la **API key** desde un _secret_ (`env.PSI_KEY`) y devuelve el JSON. Así la key nunca viaja al navegador ni queda en el bundle.
- En producción, el mismo Worker sirve la SPA (binding `ASSETS`) y el endpoint `/api/analyze`.

## Requisitos

- Node.js 18+
- Una API key de [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started) (gratuita)

## Desarrollo local

```bash
npm install                      # instala vue, vite, wrangler y el plugin de Cloudflare
cp .dev.vars.example .dev.vars   # pega tu API key dentro (PSI_KEY=...)
npm run dev                      # Vite con HMR + el Worker en el runtime de Cloudflare
```

El plugin de Cloudflare corre el Worker junto al dev server, así que `/api/analyze` funciona en local leyendo `PSI_KEY` de `.dev.vars`. Ese archivo está en `.gitignore`: no se sube nunca.

## Despliegue en Cloudflare

### Secret de producción (una sola vez)

```bash
npx wrangler secret put PSI_KEY
# pega la key cuando lo pida
```

O desde el dashboard: Worker → Settings → Variables and Secrets → Add → tipo _Secret_.

### Deploy

- **Manual:** `npm run deploy` (hace `vite build` + `wrangler deploy`).
- **CI/CD (Workers Builds):** conecta el repo en el dashboard. Build command `npm run build`, deploy command `npx wrangler deploy`. Cada push a `main` redespliega. El secret se configura en el Worker (no en el repo).

## Histórico (base de datos D1)

Cada análisis se guarda automáticamente en una base **D1** (SQLite de Cloudflare), y la pestaña _Histórico_ muestra la evolución de scores y Core Web Vitals en el tiempo, con gráfico y tabla.

Configuración inicial (una vez):

```bash
# 1. crear la base
npx wrangler d1 create faro-db
# copia el database_id que imprime y pégalo en wrangler.jsonc (campo database_id)

# 2. crear la tabla, en local y en producción
npx wrangler d1 execute faro-db --local  --file=./schema.sql
npx wrangler d1 execute faro-db --remote --file=./schema.sql
```

En desarrollo (`npm run dev`) el plugin de Cloudflare emula D1 en local, así que el histórico funciona sin tocar la base remota. El guardado ocurre en el Worker con `ctx.waitUntil`, sin frenar la respuesta del análisis.

## Estructura

```
faro/
├── index.html
├── package.json
├── vite.config.js          # incluye el plugin de Cloudflare
├── wrangler.jsonc          # main → worker, binding ASSETS, SPA fallback
├── .dev.vars.example       # plantilla del secret local
├── worker/
│   └── index.js            # API: /api/analyze + sirve la SPA
└── src/
    ├── main.js
    ├── App.vue
    ├── assets/main.css
    ├── composables/
    │   ├── usePageSpeed.js  # estado + fetch a /api/analyze + parseo
    │   └── useReport.js     # informe Markdown (móvil+escritorio)
    └── components/
        ├── ControlPanel.vue
        ├── ScoreGauges.vue
        ├── MetricsGrid.vue
        ├── AuditList.vue
        └── ExportCard.vue
```

## Qué muestra

- Scores por categoría (rendimiento, accesibilidad, buenas prácticas, SEO).
- Core Web Vitals de laboratorio y datos reales (CrUX) si la URL tiene tráfico.
- Oportunidades y diagnósticos de rendimiento, expandibles, con los recursos concretos (scripts, URLs, bytes/ms) que provocan cada cuello de botella.
- Auditorías que fallan en accesibilidad / SEO / buenas prácticas, con elementos afectados.
- Un análisis corre móvil y escritorio en paralelo; el selector arriba alterna la vista.
