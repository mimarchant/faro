import { ref, computed } from 'vue'

// --- umbrales (idénticos a Lighthouse / PageSpeed) ---
export const bandColor = (score) =>
  score >= 90 ? 'var(--good)' : score >= 50 ? 'var(--avg)' : 'var(--poor)'

const auditBand = (s) => (s === null ? 'good' : s >= 0.9 ? 'good' : s >= 0.5 ? 'avg' : 'poor')

const CAT_LABELS = {
  performance: 'Rendimiento',
  accessibility: 'Accesibilidad',
  'best-practices': 'Buenas prácticas',
  seo: 'SEO',
}

const STRATEGIES = ['mobile', 'desktop']

// métricas de laboratorio que mostramos, en orden
const LAB_METRICS = [
  { id: 'largest-contentful-paint', name: 'Largest Contentful Paint', abbr: 'LCP' },
  { id: 'first-contentful-paint', name: 'First Contentful Paint', abbr: 'FCP' },
  { id: 'total-blocking-time', name: 'Total Blocking Time', abbr: 'TBT' },
  { id: 'cumulative-layout-shift', name: 'Cumulative Layout Shift', abbr: 'CLS' },
  { id: 'speed-index', name: 'Speed Index', abbr: 'SI' },
  { id: 'interactive', name: 'Time to Interactive', abbr: 'TTI' },
]

// métricas de campo (CrUX)
const FIELD_METRICS = [
  { key: 'LARGEST_CONTENTFUL_PAINT_MS', name: 'LCP (real)', abbr: 'LCP', unit: 'ms' },
  { key: 'INTERACTION_TO_NEXT_PAINT', name: 'INP (real)', abbr: 'INP', unit: 'ms' },
  { key: 'CUMULATIVE_LAYOUT_SHIFT_SCORE', name: 'CLS (real)', abbr: 'CLS', unit: 'cls' },
  { key: 'FIRST_CONTENTFUL_PAINT_MS', name: 'FCP (real)', abbr: 'FCP', unit: 'ms' },
  { key: 'EXPERIMENTAL_TIME_TO_FIRST_BYTE', name: 'TTFB (real)', abbr: 'TTFB', unit: 'ms' },
]

// ---------- helpers de formato ----------
function fmtBytes(b) {
  if (b == null || isNaN(b)) return ''
  if (b < 1024) return Math.round(b) + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KiB'
  return (b / 1024 / 1024).toFixed(1) + ' MiB'
}

function fmtMs(ms) {
  if (ms == null || isNaN(ms) || ms === 0) return ''
  return ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : Math.round(ms) + ' ms'
}

function shortUrl(u) {
  try {
    const url = new URL(u)
    const path = url.pathname.length > 30 ? '…' + url.pathname.slice(-30) : url.pathname
    return url.hostname.replace(/^www\./, '') + path
  } catch {
    return String(u).slice(0, 50)
  }
}

const cleanDesc = (s) =>
  (s || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

function normalizeUrl(raw) {
  if (!raw) return ''
  return /^https?:\/\//i.test(raw) ? raw : 'https://' + raw
}

const typeOf = (h) => h.valueType || h.itemType

// Extrae los recursos/elementos concretos que provocan un problema.
function extractItems(audit, max = 6) {
  const d = audit.details
  if (!d || !Array.isArray(d.items) || !d.items.length) return []
  const headings = d.headings || []

  const labelH =
    headings.find((h) => typeOf(h) === 'url') ||
    headings.find((h) => typeOf(h) === 'node') ||
    headings.find((h) => typeOf(h) === 'source-location') ||
    headings.find((h) => typeOf(h) === 'text') ||
    headings[0]

  const valueH =
    headings.find((h) => typeOf(h) === 'bytes') ||
    headings.find((h) => typeOf(h) === 'ms' || typeOf(h) === 'timespanMs') ||
    headings.find((h) => typeOf(h) === 'numeric' && h !== labelH)

  const labelKey = labelH ? labelH.key : null
  const labelType = labelH ? typeOf(labelH) : null
  const valueKey = valueH ? valueH.key : null
  const valueType = valueH ? typeOf(valueH) : null

  return d.items
    .slice(0, max)
    .map((it) => {
      let label = ''
      const raw = labelKey != null ? it[labelKey] : null
      if (raw && typeof raw === 'object') {
        label =
          (labelType === 'url' && raw.url && shortUrl(raw.url)) ||
          raw.snippet ||
          raw.selector ||
          raw.nodeLabel ||
          raw.url ||
          raw.value ||
          ''
      } else if (typeof raw === 'string') {
        label = labelType === 'url' ? shortUrl(raw) : raw
      } else if (raw != null) {
        label = String(raw)
      }

      let value = ''
      if (valueKey != null) {
        const v = it[valueKey]
        if (valueType === 'bytes') value = fmtBytes(v)
        else if (valueType === 'ms' || valueType === 'timespanMs') value = fmtMs(v)
        else if (typeof v === 'number') value = Math.round(v).toString()
        else if (v != null) value = String(v)
      }

      return { label: String(label || '').trim().slice(0, 100), value }
    })
    .filter((x) => x.label)
}

// Auditorías fallidas de una categoría (accesibilidad, seo, buenas prácticas).
function categoryIssues(lh, catId) {
  const cat = lh.categories[catId]
  if (!cat || !cat.auditRefs) return []
  const out = []
  cat.auditRefs.forEach((ref) => {
    const a = lh.audits[ref.id]
    if (!a) return
    const fails =
      a.score !== null &&
      a.score < 0.9 &&
      (a.scoreDisplayMode === 'binary' || a.scoreDisplayMode === 'numeric')
    if (!fails) return
    const affected = a.details && Array.isArray(a.details.items) ? a.details.items.length : 0
    out.push({
      id: ref.id,
      title: a.title,
      desc: cleanDesc(a.description),
      band: a.score < 0.5 ? 'poor' : 'avg',
      badge: affected ? affected + (affected === 1 ? ' elemento' : ' elementos') : '',
      badgeTone: 'count',
      items: extractItems(a),
    })
  })
  return out
}

function parse(data, target, strategy) {
  const lh = data.lighthouseResult
  const audits = lh.audits

  const categories = Object.keys(CAT_LABELS)
    .filter((id) => lh.categories[id])
    .map((id) => ({
      id,
      label: CAT_LABELS[id],
      score: Math.round((lh.categories[id].score ?? 0) * 100),
    }))

  const metrics = LAB_METRICS.filter((m) => audits[m.id]).map((m) => ({
    name: m.name,
    abbr: m.abbr,
    display: audits[m.id].displayValue || '—',
    band: auditBand(audits[m.id].score),
  }))

  // datos de campo (CrUX): preferimos la página, caemos al origen
  const exp = data.loadingExperience?.metrics
    ? data.loadingExperience
    : data.originLoadingExperience
  const field = []
  if (exp?.metrics) {
    FIELD_METRICS.forEach((fm) => {
      const met = exp.metrics[fm.key]
      if (!met) return
      let display
      if (fm.unit === 'cls') {
        display = (met.percentile / 100).toFixed(2)
      } else {
        display =
          met.percentile >= 1000
            ? (met.percentile / 1000).toFixed(1) + ' s'
            : met.percentile + ' ms'
      }
      const band =
        met.category === 'FAST' ? 'good' : met.category === 'AVERAGE' ? 'avg' : 'poor'
      field.push({ name: fm.name, abbr: fm.abbr, display, band })
    })
  }

  // oportunidades (con ahorro estimado) + recursos concretos
  const opportunities = []
  const oppIds = new Set()
  Object.keys(audits).forEach((id) => {
    const a = audits[id]
    const savingMsRaw = a.details?.overallSavingsMs
    const isOpp = a.details?.type === 'opportunity'
    if (isOpp || (savingMsRaw && a.score !== null && a.score < 0.9)) {
      oppIds.add(id)
      opportunities.push({
        id,
        title: a.title,
        desc: cleanDesc(a.description),
        savingMsRaw: savingMsRaw || 0,
        band: a.score !== null && a.score < 0.5 ? 'poor' : 'avg',
        badge: fmtMs(savingMsRaw),
        badgeTone: 'save',
        items: extractItems(a),
      })
    }
  })
  opportunities.sort((a, b) => b.savingMsRaw - a.savingMsRaw)

  // diagnósticos de rendimiento (qué está consumiendo recursos)
  const diagnostics = []
  const perfCat = lh.categories.performance
  if (perfCat && perfCat.auditRefs) {
    perfCat.auditRefs.forEach((ref) => {
      if (ref.group !== 'diagnostics' || oppIds.has(ref.id)) return
      const a = lh.audits[ref.id]
      if (!a) return
      const items = extractItems(a)
      const fails = a.score !== null && a.score < 0.9
      if (!items.length && !fails) return
      diagnostics.push({
        id: ref.id,
        title: a.title,
        desc: cleanDesc(a.description),
        band: a.score === null ? 'info' : a.score < 0.5 ? 'poor' : 'avg',
        badge: a.displayValue || '',
        badgeTone: 'info',
        items,
      })
    })
  }

  return {
    url: target,
    strategy,
    lhVersion: lh.lighthouseVersion,
    timestamp: new Date(lh.fetchTime || Date.now()).toLocaleString('es-CL'),
    categories,
    metrics,
    field,
    opportunities: opportunities.slice(0, 14),
    diagnostics: diagnostics.slice(0, 12),
    issues: {
      accessibility: categoryIssues(lh, 'accessibility'),
      'best-practices': categoryIssues(lh, 'best-practices'),
      seo: categoryIssues(lh, 'seo'),
    },
  }
}

function friendly(err) {
  const msg = String(err && err.message ? err.message : err)
  if (msg.includes('429'))
    return 'Cuota de la API superada (429). Espera un momento o agrega tu propia API key.'
  if (msg.toLowerCase().includes('failed to fetch'))
    return 'No se pudo conectar con la API. Revisa la URL y tu conexión.'
  return msg
}

export function usePageSpeed() {
  const url = ref('')
  const view = ref('mobile') // estrategia que se está mostrando
  const loading = ref(false)
  const generalError = ref('')
  const results = ref({ mobile: null, desktop: null })
  const errors = ref({ mobile: '', desktop: '' })

  const activeResult = computed(() => results.value[view.value])
  const activeError = computed(() => errors.value[view.value])
  const hasAny = computed(() => !!(results.value.mobile || results.value.desktop))

  async function fetchStrategy(target, strat) {
    // Llamamos a nuestro propio Worker, que añade la API key (secret) del lado servidor.
    const endpoint = new URL('/api/analyze', window.location.origin)
    endpoint.searchParams.set('url', target)
    endpoint.searchParams.set('strategy', strat)

    const res = await fetch(endpoint)
    const data = await res.json()
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || `HTTP ${res.status}`)
    }
    return parse(data, target, strat)
  }

  async function run() {
    const target = normalizeUrl(url.value.trim())
    if (!target) {
      generalError.value = 'Ingresa una URL válida.'
      return
    }
    url.value = target
    loading.value = true
    generalError.value = ''
    results.value = { mobile: null, desktop: null }
    errors.value = { mobile: '', desktop: '' }

    const settled = await Promise.allSettled(STRATEGIES.map((s) => fetchStrategy(target, s)))
    STRATEGIES.forEach((s, i) => {
      const r = settled[i]
      if (r.status === 'fulfilled') results.value[s] = r.value
      else errors.value[s] = friendly(r.reason)
    })

    // si la vista actual no tiene datos, salta a una que sí
    if (!results.value[view.value]) {
      view.value = results.value.mobile ? 'mobile' : results.value.desktop ? 'desktop' : view.value
    }
    loading.value = false
  }

  return {
    url,
    view,
    loading,
    generalError,
    results,
    errors,
    activeResult,
    activeError,
    hasAny,
    run,
  }
}
