<script setup>
import { ref } from "vue";
import { usePageSpeed } from "./composables/usePageSpeed.js";
import ControlPanel from "./components/ControlPanel.vue";
import ScoreGauges from "./components/ScoreGauges.vue";
import MetricsGrid from "./components/MetricsGrid.vue";
import AuditList from "./components/AuditList.vue";
import ExportCard from "./components/ExportCard.vue";
import HistoryView from "./components/HistoryView.vue";

const tab = ref("analyze");

const {
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
} = usePageSpeed();
</script>

<template>
  <header>
    <div class="brand">
      <span class="brand-mark">Faro</span>
      <span class="brand-dot"></span>
    </div>
    <p class="tagline">
      Análisis de rendimiento web sobre el motor de Lighthouse vía
      <code>PageSpeed Insights API</code>. Mismos scores y Core Web Vitals que
      ves en PageSpeed, con exportación lista para pegar en una IA.
    </p>
  </header>

  <nav class="tabs">
    <button :class="{ active: tab === 'analyze' }" @click="tab = 'analyze'">
      Analizar
    </button>
    <button :class="{ active: tab === 'history' }" @click="tab = 'history'">
      Histórico
    </button>
  </nav>

  <template v-if="tab === 'analyze'">
    <ControlPanel v-model:url="url" :loading="loading" @run="run" />

    <!-- cargando -->
    <div v-if="loading" class="loading">
      <div class="scanner">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="rgba(120,140,165,0.18)"
            stroke-width="4"
          />
          <path
            d="M32 4 a28 28 0 0 1 28 28"
            stroke="var(--accent)"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <p>
        Auditando <span class="target">{{ url }}</span> · móvil y escritorio…
      </p>
      <p style="margin-top: 8px; color: var(--faint)">
        Lighthouse tarda 10–30 s. en correr todas las auditorías
      </p>
    </div>

    <!-- error general (URL inválida o ambas estrategias fallidas) -->
    <div v-if="!loading && generalError && !hasAny" class="error">
      <strong>No se pudo completar</strong>
      {{ generalError }}
    </div>
    <div
      v-if="
        !loading &&
        !generalError &&
        !hasAny &&
        (errors.mobile || errors.desktop)
      "
      class="error"
    >
      <strong>No se pudo completar</strong>
      {{ errors.mobile || errors.desktop }}
    </div>

    <!-- vacío -->
    <div
      v-if="
        !loading &&
        !hasAny &&
        !generalError &&
        !errors.mobile &&
        !errors.desktop
      "
      class="empty"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </svg>
      <p>Ingresa una URL pública y pulsa Analizar para empezar.</p>
    </div>

    <!-- resultados -->
    <div v-if="!loading && hasAny" class="results">
      <div class="meta-bar reveal">
        <div class="view-toggle">
          <button
            :class="{ active: view === 'mobile' }"
            :disabled="!results.mobile"
            @click="view = 'mobile'"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" />
            </svg>
            Móvil
          </button>
          <button
            :class="{ active: view === 'desktop' }"
            :disabled="!results.desktop"
            @click="view = 'desktop'"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
            </svg>
            Escritorio
          </button>
        </div>
        <span class="spacer"></span>
        <template v-if="activeResult">
          <span class="url">{{ activeResult.url }}</span>
          <span>· Lighthouse {{ activeResult.lhVersion }}</span>
        </template>
      </div>

      <!-- esta estrategia falló pero la otra existe -->
      <div v-if="!activeResult && activeError" class="error">
        <strong
          >{{ view === "mobile" ? "Móvil" : "Escritorio" }} no
          disponible</strong
        >
        {{ activeError }}
      </div>

      <template v-if="activeResult">
        <ScoreGauges
          :key="view + '-gauges'"
          :categories="activeResult.categories"
        />

        <MetricsGrid
          :key="view + '-lab'"
          title="Core Web Vitals"
          tag="laboratorio"
          :metrics="activeResult.metrics"
          delay="0.1s"
        />

        <MetricsGrid
          v-if="activeResult.field.length"
          :key="view + '-field'"
          title="Datos reales de usuarios"
          tag="CrUX · 28 días"
          note="Percentil 75 de usuarios reales de Chrome en los últimos 28 días."
          :metrics="activeResult.field"
          delay="0.12s"
        />

        <template v-if="activeResult.opportunities.length">
          <h2 class="section-title">
            Oportunidades de rendimiento
            <span class="tag">{{ activeResult.opportunities.length }}</span>
          </h2>
          <p class="sec-note">
            Toca una fila para ver los recursos concretos que la provocan.
          </p>
          <AuditList
            :key="view + '-opp'"
            :audits="activeResult.opportunities"
            delay="0.15s"
          />
        </template>

        <template v-if="activeResult.diagnostics.length">
          <h2 class="section-title">
            Diagnósticos <span class="tag">qué consume recursos</span>
          </h2>
          <AuditList
            :key="view + '-diag'"
            :audits="activeResult.diagnostics"
            delay="0.16s"
          />
        </template>

        <template v-if="activeResult.issues.accessibility.length">
          <h2 class="section-title">
            Accesibilidad
            <span class="tag"
              >{{ activeResult.issues.accessibility.length }} por revisar</span
            >
          </h2>
          <AuditList
            :key="view + '-a11y'"
            :audits="activeResult.issues.accessibility"
            delay="0.17s"
          />
        </template>

        <template v-if="activeResult.issues.seo.length">
          <h2 class="section-title">
            SEO
            <span class="tag"
              >{{ activeResult.issues.seo.length }} por revisar</span
            >
          </h2>
          <AuditList
            :key="view + '-seo'"
            :audits="activeResult.issues.seo"
            delay="0.18s"
          />
        </template>

        <template v-if="activeResult.issues['best-practices'].length">
          <h2 class="section-title">
            Buenas prácticas
            <span class="tag"
              >{{ activeResult.issues["best-practices"].length }} por
              revisar</span
            >
          </h2>
          <AuditList
            :key="view + '-bp'"
            :audits="activeResult.issues['best-practices']"
            delay="0.19s"
          />
        </template>
      </template>

      <ExportCard :results="results" />
    </div>
  </template>

  <HistoryView v-if="tab === 'history'" />

  <footer>
    <p>
      Faro · datos de
      <a
        href="https://developers.google.com/speed/docs/insights/v5/about"
        target="_blank"
        rel="noopener"
        >PageSpeed Insights API</a
      >
      (Lighthouse)
    </p>
  </footer>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
  margin-bottom: 28px;
}

.tabs button {
  border: 0;
  background: transparent;
  color: var(--dim);
  font-family: "Hanken Grotesk", sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 9px 22px;
  border-radius: 9px;
  cursor: pointer;
  transition: 0.18s;
}

.tabs button.active {
  background: var(--accent);
  color: #062722;
}

.tabs button:not(.active):hover {
  color: var(--text);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 6px;
}

.brand-mark {
  font-family: "Bricolage Grotesque", sans-serif;
  font-weight: 800;
  font-size: 38px;
  letter-spacing: -0.03em;
  line-height: 1;
  background: linear-gradient(180deg, #fff, #9fb2c4);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 14px var(--accent);
  align-self: center;
}

.tagline {
  color: var(--dim);
  font-size: 14px;
  max-width: 560px;
  margin-bottom: 32px;
}

.tagline code {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 1px 6px;
  border-radius: 5px;
}

.loading {
  text-align: center;
  padding: 70px 0;
}

.scanner {
  width: 64px;
  height: 64px;
  margin: 0 auto 22px;
}

.scanner svg {
  animation: spin 1.4s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  color: var(--dim);
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
}

.loading .target {
  color: var(--accent);
}

.error {
  margin-top: 28px;
  border: 1px solid rgba(255, 78, 66, 0.35);
  background: rgba(255, 78, 66, 0.07);
  border-radius: var(--radius);
  padding: 18px 20px;
  color: #ffb4ad;
  font-size: 14px;
}

.error strong {
  color: var(--poor);
  font-family: "JetBrains Mono", monospace;
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--faint);
}

.empty svg {
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty p {
  font-size: 14px;
}

.results {
  margin-top: 40px;
}

.meta-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: var(--dim);
  margin-bottom: 26px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.meta-bar .url {
  color: var(--text);
}

.meta-bar .spacer {
  flex: 1;
}

.view-toggle {
  display: inline-flex;
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  padding: 4px;
  gap: 4px;
}

.view-toggle button {
  border: 0;
  background: transparent;
  color: var(--dim);
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.view-toggle button.active {
  background: var(--accent);
  color: #062722;
  font-weight: 700;
}

.view-toggle button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.view-toggle button:not(.active):not(:disabled):hover {
  color: var(--text);
}

.sec-note {
  font-size: 12.5px;
  color: var(--faint);
  margin: -8px 0 14px;
}

footer {
  margin-top: 60px;
  text-align: center;
  color: var(--faint);
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
}

footer a {
  color: var(--dim);
  text-decoration: none;
}
</style>
