// Backend del Worker. Sirve la SPA (binding ASSETS) y expone /api/analyze,
// que llama a PageSpeed Insights usando la API key guardada como secret (env.PSI_KEY).

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/api/analyze') {
      const target = url.searchParams.get('url')
      const strategy = url.searchParams.get('strategy') || 'mobile'

      if (!target) {
        return Response.json({ error: { message: 'Falta el parámetro "url".' } }, { status: 400 })
      }

      const psi = new URL(PSI_ENDPOINT)
      psi.searchParams.set('url', target)
      psi.searchParams.set('strategy', strategy)
      CATEGORIES.forEach((c) => psi.searchParams.append('category', c))
      if (env.PSI_KEY) psi.searchParams.set('key', env.PSI_KEY)

      // cacheamos 5 min en el edge para no quemar cuota en URLs repetidas
      const res = await fetch(psi, { cf: { cacheTtl: 300, cacheEverything: true } })
      return new Response(res.body, {
        status: res.status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }

    // cualquier otra ruta: la SPA
    return env.ASSETS.fetch(request)
  },
}
