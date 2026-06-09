import { ref } from 'vue'

export function useHistory() {
    const urls = ref([])
    const analyses = ref([])
    const loading = ref(false)
    const error = ref('')

    async function loadUrls() {
        try {
            const res = await fetch('/api/history/urls')
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`)
            urls.value = data.urls || []
        } catch (e) {
            error.value = e.message
        }
    }

    async function loadHistory(url, strategy) {
        loading.value = true
        error.value = ''
        analyses.value = []
        try {
            const ep = new URL('/api/history', window.location.origin)
            ep.searchParams.set('url', url)
            ep.searchParams.set('strategy', strategy)
            const res = await fetch(ep)
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`)
            analyses.value = data.analyses || []
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    return { urls, analyses, loading, error, loadUrls, loadHistory }
}
