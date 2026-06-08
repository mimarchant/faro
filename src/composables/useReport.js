// Utilidades para exportar el resultado en un formato legible por una IA.
// Recibe el objeto { mobile, desktop } y genera un informe con ambas estrategias.

const estado = (band) =>
  band === 'good' ? 'Bueno' : band === 'avg' ? 'Mejorable' : band === 'info' ? 'Informativo' : 'Deficiente'

const estadoScore = (s) => (s >= 90 ? 'Bueno' : s >= 50 ? 'Mejorable' : 'Deficiente')

function auditBlock(L, title, audits) {
  if (!audits || !audits.length) return
  L.push(`### ${title}`)
  audits.forEach((a) => {
    const badge = a.badge ? ` (${a.badgeTone === 'save' ? 'ahorro estimado: ' + a.badge : a.badge})` : ''
    L.push(`- **${a.title}**${badge}`)
    if (a.desc) L.push(`  - ${a.desc}`)
    if (a.items && a.items.length) {
      a.items.forEach((it) => {
        L.push(`  - \`${it.label}\`${it.value ? ' → ' + it.value : ''}`)
      })
    }
  })
  L.push('')
}

function strategyReport(L, r, heading) {
  L.push(`## ${heading}`)
  L.push('')
  L.push(`- **URL:** ${r.url}`)
  L.push(`- **Fecha:** ${r.timestamp}`)
  L.push(`- **Versión de Lighthouse:** ${r.lhVersion}`)
  L.push('')

  L.push('### Puntuaciones por categoría')
  L.push('| Categoría | Score (0–100) | Estado |')
  L.push('|---|---|---|')
  r.categories.forEach((c) => L.push(`| ${c.label} | ${c.score} | ${estadoScore(c.score)} |`))
  L.push('')

  L.push('### Core Web Vitals (laboratorio)')
  L.push('| Métrica | Valor | Estado |')
  L.push('|---|---|---|')
  r.metrics.forEach((m) => L.push(`| ${m.name} (${m.abbr}) | ${m.display} | ${estado(m.band)} |`))
  L.push('')

  if (r.field.length) {
    L.push('### Datos reales de usuarios (CrUX, percentil 75, 28 días)')
    L.push('| Métrica | Valor | Estado |')
    L.push('|---|---|---|')
    r.field.forEach((f) => L.push(`| ${f.name} (${f.abbr}) | ${f.display} | ${estado(f.band)} |`))
    L.push('')
  }

  auditBlock(L, 'Oportunidades de rendimiento (con recursos concretos)', r.opportunities)
  auditBlock(L, 'Diagnósticos de rendimiento (qué consume recursos)', r.diagnostics)
  auditBlock(L, 'Accesibilidad — por revisar', r.issues.accessibility)
  auditBlock(L, 'SEO — por revisar', r.issues.seo)
  auditBlock(L, 'Buenas prácticas — por revisar', r.issues['best-practices'])
}

export function buildReport(results) {
  if (!results) return ''
  const L = []
  L.push('# Informe de rendimiento web — Faro / PageSpeed Insights')
  L.push('')

  if (results.mobile) strategyReport(L, results.mobile, 'Estrategia: Móvil')
  if (results.desktop) strategyReport(L, results.desktop, 'Estrategia: Escritorio')

  L.push('---')
  L.push('## Instrucciones para la IA')
  L.push('')
  L.push(
    'Eres un ingeniero senior de rendimiento web frontend. Mi stack es **Vue 3 (Composition API, sin TypeScript) + Vite**, con componentes desplegados en **Modyo CMS** mediante plantillas Liquid y un design system de web components con prefijo `cns-` usando Shadow DOM.',
  )
  L.push('')
  L.push('A partir del informe anterior (que incluye móvil y escritorio):')
  L.push(
    '1. Prioriza los problemas por impacto real en Core Web Vitals y esfuerzo de implementación (matriz impacto/esfuerzo). Indica si un problema es específico de móvil o escritorio.',
  )
  L.push(
    '2. Para cada problema relevante, explica la causa probable en mi stack y da una solución concreta con ejemplos de código aplicables a Vue 3 / Vite / Modyo Liquid cuando corresponda. Usa los recursos concretos listados (URLs, scripts, bytes, ms) para apuntar dónde mirar.',
  )
  L.push('3. Señala qué quick wins puedo aplicar hoy y qué requiere cambios estructurales.')
  L.push(
    '4. En accesibilidad y SEO, agrupa los hallazgos por tipo de arreglo (ej. textos alternativos, contraste, etiquetas, metadatos) y dame una checklist accionable.',
  )
  L.push(
    '5. Si detectas problemas típicos de Shadow DOM, code splitting en CDN de Modyo, o carga de fuentes/imágenes, abórdalos explícitamente.',
  )
  L.push('')
  return L.join('\n')
}

export function downloadReport(results) {
  const text = buildReport(results)
  const ref = results.mobile || results.desktop
  const slug = ref
    ? ref.url
        .replace(/^https?:\/\//, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/-+$/, '')
    : 'reporte'
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `faro-${slug}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(a.href), 1500)
}

export async function copyReport(results) {
  const text = buildReport(results)
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    document.body.removeChild(ta)
    return ok
  }
}
