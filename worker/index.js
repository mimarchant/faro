const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

// Extrae las columnas indexables del JSON de Lighthouse.
function extractRow(data, url, strategy) {
  const lh = data.lighthouseResult
  const cat = lh.categories
  const a = lh.audits
  const score = (c) => (cat[c] && cat[c].score != null ? Math.round(cat[c].score * 100) : null)
  const num = (id) => (a[id] && a[id].numericValue != null ? a[id].numericValue : null)
  return {
    url,
    strategy,
    perf: score('performance'),
    a11y: score('accessibility'),
    best_practices: score('best-practices'),
    seo: score('seo'),
    lcp: num('largest-contentful-paint'),
    fcp: num('first-contentful-paint'),
    cls: num('cumulative-layout-shift'),
    tbt: num('total-blocking-time'),
    si: num('speed-index'),
    tti: num('interactive'),
  }
}

async function saveAnalysis(env, r) {
  await env.DB.prepare(
    `INSERT INTO analyses (url, strategy, perf, a11y, best_practices, seo, lcp, fcp, cls, tbt, si, tti)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(r.url, r.strategy, r.perf, r.a11y, r.best_practices, r.seo, r.lcp, r.fcp, r.cls, r.tbt, r.si, r.tti)
    .run()
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // --- analizar (y registrar en el histórico) ---
    if (url.pathname === '/api/analyze') {
      const target = url.searchParams.get('url')
      const strategy = url.searchParams.get('strategy') || 'mobile'
      if (!target) return json({ error: { message: 'Falta el parámetro "url".' } }, 400)

      const psi = new URL(PSI_ENDPOINT)
      psi.searchParams.set('url', target)
      psi.searchParams.set('strategy', strategy)
      CATEGORIES.forEach((c) => psi.searchParams.append('category', c))
      if (env.PSI_KEY) psi.searchParams.set('key', env.PSI_KEY)

      const psiRes = await fetch(psi, { cf: { cacheTtl: 300, cacheEverything: true } })
      const data = await psiRes.json()

      // guardado en segundo plano: no bloquea la respuesta al cliente
      if (psiRes.ok && data.lighthouseResult && env.DB) {
        ctx.waitUntil(saveAnalysis(env, extractRow(data, target, strategy)).catch(() => { }))
      }

      return json(data, psiRes.status)
    }

    // --- histórico de una URL+estrategia (orden cronológico) ---
    if (url.pathname === '/api/history') {
      const target = url.searchParams.get('url')
      const strategy = url.searchParams.get('strategy') || 'mobile'
      if (!target) return json({ error: { message: 'Falta el parámetro "url".' } }, 400)
      const { results } = await env.DB.prepare(
        `SELECT * FROM analyses WHERE url = ? AND strategy = ? ORDER BY created_at ASC LIMIT 200`,
      )
        .bind(target, strategy)
        .all()
      return json({ analyses: results })
    }

    // --- lista de URLs analizadas ---
    if (url.pathname === '/api/history/urls') {
      const { results } = await env.DB.prepare(
        `SELECT url, COUNT(*) AS count, MAX(created_at) AS last_at
         FROM analyses GROUP BY url ORDER BY last_at DESC LIMIT 50`,
      ).all()
      return json({ urls: results })
    }

    // resto: la SPA
    return env.ASSETS.fetch(request)
  },
}
