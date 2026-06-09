# Faro

Análisis de rendimiento web sobre el motor de **Lighthouse**, vía la **PageSpeed Insights API** de Google. Muestra los mismos scores y Core Web Vitals que PageSpeed y exporta un informe en Markdown listo para pegar en una IA.

Stack: **Vue 3 (Composition API, sin TypeScript) + Vite**.

## Requisitos

- Node.js 18+

## Instalación

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## Uso

1. Ingresa una URL pública y elige estrategia (móvil / escritorio).
2. Pulsa **Analizar**. Lighthouse tarda 10–30 s.
3. Revisa scores, Core Web Vitals (laboratorio), datos reales de CrUX y oportunidades.
4. **Exportar para IA**: descarga el `.md` o copia al portapapeles. El informe incluye un prompt orientado al stack Vue 3 / Vite / Modyo.

## Estructura

```
src/
├── main.js
├── App.vue                      # orquesta flujo, vista móvil/escritorio y secciones
├── assets/
│   └── main.css                 # variables, fondo y utilidades compartidas
├── composables/
│   ├── usePageSpeed.js          # estado + fetch (ambas estrategias) + parseo de Lighthouse
│   └── useReport.js             # informe Markdown (móvil+escritorio), descarga y copia
└── components/
    ├── ControlPanel.vue         # URL, API key, botón analizar
    ├── ScoreGauges.vue          # gauges por categoría
    ├── MetricsGrid.vue          # grilla reutilizable (laboratorio y campo)
    ├── AuditList.vue            # auditorías expandibles con recursos concretos
    └── ExportCard.vue           # exportación para IA
```

## Qué muestra

- **Scores** por categoría (rendimiento, accesibilidad, buenas prácticas, SEO).
- **Core Web Vitals** de laboratorio y **datos reales (CrUX)** si la URL tiene tráfico.
- **Oportunidades** y **diagnósticos** de rendimiento, expandibles: muestran los scripts, recursos y bytes/ms concretos que provocan cada cuello de botella.
- **Accesibilidad / SEO / Buenas prácticas**: las auditorías que fallan, con el conteo de elementos afectados y el detalle al expandir.
- Un solo análisis corre **móvil y escritorio** en paralelo; el selector arriba alterna la vista.

## Producción: proxy con NestJS (opcional)

Para ocultar la API key y cachear resultados, monta un endpoint `GET /analyze?url=&strategy=`
en NestJS que llame a la PSI API con la key guardada en el servidor. En el frontend solo cambias
la URL del `fetch` en `usePageSpeed.js`; el resto queda igual.
