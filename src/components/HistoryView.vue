<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useHistory } from "../composables/useHistory.js";
import TrendChart from "./TrendChart.vue";

const { urls, analyses, loading, error, loadUrls, loadHistory } = useHistory();

const selectedUrl = ref("");
const strategy = ref("mobile");
const metric = ref("scores");

const METRICS = [
  { key: "scores", label: "Puntuaciones" },
  { key: "lcp", label: "LCP" },
  { key: "cls", label: "CLS" },
  { key: "tbt", label: "TBT" },
  { key: "fcp", label: "FCP" },
];

const SCORE_SERIES = [
  { key: "perf", label: "Rendimiento", color: "#2dd4bf" },
  { key: "a11y", label: "Accesibilidad", color: "#7c9cff" },
  { key: "best_practices", label: "Buenas prácticas", color: "#ffa400" },
  { key: "seo", label: "SEO", color: "#c084fc" },
];

function parseDate(s) {
  // created_at viene de SQLite en UTC ('YYYY-MM-DD HH:MM:SS')
  return new Date(s.replace(" ", "T") + "Z");
}
const fmtShort = (s) =>
  parseDate(s).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
  });
const fmtFull = (s) =>
  parseDate(s).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtMs = (v) =>
  v == null
    ? "—"
    : v >= 1000
      ? (v / 1000).toFixed(1) + " s"
      : Math.round(v) + " ms";
const fmtCls = (v) => (v == null ? "—" : v.toFixed(2));

const xLabels = computed(() =>
  analyses.value.map((a) => fmtShort(a.created_at)),
);

const chart = computed(() => {
  if (metric.value === "scores") {
    return {
      series: SCORE_SERIES.map((s) => ({
        label: s.label,
        color: s.color,
        values: analyses.value.map((a) => a[s.key]),
      })),
      yMin: 0,
      yMax: 100,
      formatY: (v) => Math.round(v).toString(),
    };
  }
  const key = metric.value;
  const values = analyses.value.map((a) => a[key]);
  const nums = values.filter((v) => v != null && !isNaN(v));
  const max = nums.length ? Math.max(...nums) : 1;
  const isCls = key === "cls";
  return {
    series: [
      {
        label: METRICS.find((m) => m.key === key).label,
        color: "#2dd4bf",
        values,
      },
    ],
    yMin: 0,
    yMax: isCls ? Math.max(0.1, max * 1.2) : Math.max(1, max * 1.2),
    formatY: isCls ? (v) => v.toFixed(2) : (v) => fmtMs(v),
  };
});

// tabla: más reciente arriba
const rows = computed(() => [...analyses.value].reverse());

function refresh() {
  if (selectedUrl.value) loadHistory(selectedUrl.value, strategy.value);
}

watch([selectedUrl, strategy], refresh);

watch(urls, (list) => {
  if (!selectedUrl.value && list.length) selectedUrl.value = list[0].url;
});

onMounted(loadUrls);
</script>

<template>
  <div class="history">
    <div v-if="!urls.length && !loading" class="empty">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </svg>
      <p>
        Todavía no hay análisis guardados. Analiza alguna URL y volverá aquí su
        evolución.
      </p>
    </div>

    <template v-else>
      <div class="controls">
        <div class="ctrl url-ctrl">
          <label class="field-label">URL</label>
          <select v-model="selectedUrl" class="select">
            <option v-for="u in urls" :key="u.url" :value="u.url">
              {{ u.url }} ({{ u.count }})
            </option>
          </select>
        </div>

        <div class="ctrl">
          <label class="field-label">Estrategia</label>
          <div class="seg">
            <button
              :class="{ active: strategy === 'mobile' }"
              @click="strategy = 'mobile'"
            >
              Móvil
            </button>
            <button
              :class="{ active: strategy === 'desktop' }"
              @click="strategy = 'desktop'"
            >
              Escritorio
            </button>
          </div>
        </div>

        <div class="ctrl">
          <label class="field-label">Métrica</label>
          <select v-model="metric" class="select">
            <option v-for="m in METRICS" :key="m.key" :value="m.key">
              {{ m.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="error" class="error"><strong>Error</strong>{{ error }}</div>

      <div v-if="loading" class="muted">Cargando histórico…</div>

      <template v-else-if="analyses.length">
        <TrendChart
          :series="chart.series"
          :x-labels="xLabels"
          :y-min="chart.yMin"
          :y-max="chart.yMax"
          :format-y="chart.formatY"
        />

        <h2 class="section-title">
          Análisis registrados <span class="tag">{{ analyses.length }}</span>
        </h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Perf</th>
                <th>A11y</th>
                <th>BP</th>
                <th>SEO</th>
                <th>LCP</th>
                <th>CLS</th>
                <th>TBT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td class="date">{{ fmtFull(r.created_at) }}</td>
                <td>{{ r.perf ?? "—" }}</td>
                <td>{{ r.a11y ?? "—" }}</td>
                <td>{{ r.best_practices ?? "—" }}</td>
                <td>{{ r.seo ?? "—" }}</td>
                <td>{{ fmtMs(r.lcp) }}</td>
                <td>{{ fmtCls(r.cls) }}</td>
                <td>{{ fmtMs(r.tbt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-else class="muted">
        No hay datos para esta URL en {{ strategy }}.
      </div>
    </template>
  </div>
</template>

<style scoped>
.history {
  margin-top: 8px;
}

.controls {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 22px;
}

.ctrl {
  display: flex;
  flex-direction: column;
}

.url-ctrl {
  flex: 1;
  min-width: 240px;
}

.field-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  margin-bottom: 8px;
}

.select {
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  color: var(--text);
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  padding: 12px 14px;
  cursor: pointer;
}

.select:focus {
  outline: none;
  border-color: var(--accent);
}

.seg {
  display: inline-flex;
  background: var(--bg);
  border: 1px solid var(--border-strong);
  border-radius: 11px;
  padding: 4px;
  gap: 4px;
}

.seg button {
  border: 0;
  background: transparent;
  color: var(--dim);
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.18s;
}

.seg button.active {
  background: var(--accent);
  color: #062722;
  font-weight: 700;
}

.muted {
  color: var(--faint);
  font-size: 14px;
  padding: 30px 0;
  text-align: center;
}

.error {
  border: 1px solid rgba(255, 78, 66, 0.35);
  background: rgba(255, 78, 66, 0.07);
  border-radius: var(--radius);
  padding: 16px 18px;
  color: #ffb4ad;
  font-size: 14px;
  margin-bottom: 18px;
}

.error strong {
  color: var(--poor);
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.empty {
  text-align: center;
  padding: 70px 0;
  color: var(--faint);
}

.empty svg {
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty p {
  font-size: 14px;
  max-width: 360px;
  margin: 0 auto;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  font-family: "JetBrains Mono", monospace;
  color: var(--text);
  white-space: nowrap;
}

tr:last-child td {
  border-bottom: 0;
}

td.date {
  color: var(--dim);
}

tbody tr:hover {
  background: var(--card-2);
}
</style>
