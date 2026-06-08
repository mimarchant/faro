<script setup>
import { ref } from 'vue'
import { downloadReport, copyReport } from '../composables/useReport.js'

const props = defineProps({
  results: { type: Object, required: true },
})

const copied = ref(false)

function onDownload() {
  downloadReport(props.results)
}

async function onCopy() {
  await copyReport(props.results)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="export-card reveal" style="animation-delay: 0.2s">
    <h3>Exportar para IA</h3>
    <p>
      Genera un informe Markdown con móvil y escritorio: métricas, oportunidades, diagnósticos y
      hallazgos de accesibilidad/SEO, con los recursos concretos de cada problema, más un prompt
      orientado a Vue 3 + Vite + Modyo. Pégalo en cualquier asistente para un plan priorizado.
    </p>
    <div class="export-actions">
      <button class="btn-ghost" @click="onDownload">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Descargar informe .md
      </button>
      <button class="btn-ghost" :class="{ copied }" @click="onCopy">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        {{ copied ? '¡Copiado!' : 'Copiar para IA' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.export-card {
  margin-top: 40px;
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.07), rgba(56, 120, 200, 0.05));
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  padding: 26px;
}

.export-card h3 {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.export-card p {
  color: var(--dim);
  font-size: 13.5px;
  margin: 8px 0 18px;
  max-width: 640px;
}

.export-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-ghost {
  background: var(--bg-elev);
  border: 1px solid var(--border-strong);
  color: var(--text);
  border-radius: 11px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 22px;
  cursor: pointer;
  transition: 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-ghost.copied {
  border-color: var(--good);
  color: var(--good);
}
</style>
