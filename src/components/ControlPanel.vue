<script setup>
const url = defineModel('url')
const apiKey = defineModel('apiKey')

defineProps({
  loading: Boolean,
})

const emit = defineEmits(['run'])
</script>

<template>
  <div class="panel">
    <div>
      <label class="field-label">URL a analizar</label>
      <div class="url-row">
        <input
          class="input"
          v-model="url"
          @keyup.enter="emit('run')"
          placeholder="https://www.consorcio.cl"
          autocomplete="off"
          spellcheck="false"
        />
        <button class="run-btn" @click="emit('run')" :disabled="loading">
          {{ loading ? 'Analizando…' : 'Analizar' }}
        </button>
      </div>
      <p class="hint">Se analizan móvil y escritorio a la vez.</p>
    </div>

    <details class="keyfield">
      <summary>API key (opcional, recomendada)</summary>
      <div class="key-body">
        <input
          class="input"
          v-model="apiKey"
          placeholder="AIza…  ·  se guarda solo en memoria de esta pestaña"
          autocomplete="off"
          spellcheck="false"
          style="width: 100%"
        />
        <p>
          Sin key funciona, pero Google limita mucho la cuota (errores 429 frecuentes). Crea una
          gratis en
          <a
            href="https://developers.google.com/speed/docs/insights/v5/get-started"
            target="_blank"
            rel="noopener"
            >Google Cloud → PageSpeed Insights API</a
          >.
        </p>
      </div>
    </details>
  </div>
</template>

<style scoped>
.panel {
  background: linear-gradient(180deg, var(--card), var(--card-2));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px;
  display: grid;
  gap: 16px;
}

.field-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 8px;
  display: block;
}

.url-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.input {
  flex: 1;
  min-width: 260px;
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  padding: 14px 16px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input::placeholder {
  color: var(--faint);
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.hint {
  font-size: 12px;
  color: var(--faint);
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.run-btn {
  background: var(--accent);
  color: #062722;
  border: 0;
  border-radius: 11px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-weight: 700;
  font-size: 15px;
  padding: 14px 30px;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.2s,
    opacity 0.2s;
  box-shadow: 0 6px 24px rgba(45, 212, 191, 0.22);
}

.run-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 30px rgba(45, 212, 191, 0.3);
}

.run-btn:active:not(:disabled) {
  transform: translateY(0);
}

.run-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.keyfield summary {
  cursor: pointer;
  color: var(--faint);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  list-style: none;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.keyfield summary::-webkit-details-marker {
  display: none;
}

.keyfield summary::before {
  content: '▸';
  transition: transform 0.2s;
  display: inline-block;
}

.keyfield[open] summary::before {
  transform: rotate(90deg);
}

.keyfield .key-body {
  margin-top: 12px;
}

.keyfield p {
  font-size: 12.5px;
  color: var(--dim);
  margin-top: 8px;
}

.keyfield a {
  color: var(--accent);
  text-decoration: none;
}

.keyfield a:hover {
  text-decoration: underline;
}

@media (max-width: 560px) {
  .run-btn {
    width: 100%;
  }
}
</style>
