<script setup>
import { computed } from "vue";

const props = defineProps({
  series: { type: Array, required: true }, // [{ label, color, values: [num|null] }]
  xLabels: { type: Array, required: true }, // fechas como strings
  yMin: { type: Number, default: 0 },
  yMax: { type: Number, default: 100 },
  formatY: { type: Function, default: (v) => Math.round(v).toString() },
});

const W = 720;
const H = 280;
const PAD = { l: 48, r: 18, t: 18, b: 30 };
const px0 = PAD.l;
const px1 = W - PAD.r;
const py0 = PAD.t;
const py1 = H - PAD.b;

const n = computed(() => props.xLabels.length);

const xAt = (i) =>
  n.value <= 1 ? (px0 + px1) / 2 : px0 + (i / (n.value - 1)) * (px1 - px0);

const yAt = (v) => {
  const span = props.yMax - props.yMin || 1;
  return py1 - ((v - props.yMin) / span) * (py1 - py0);
};

// path que rompe en valores nulos
const pathFor = (values) => {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null || isNaN(v)) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `;
    pen = true;
  });
  return d.trim();
};

const pointsFor = (values) =>
  values
    .map((v, i) => (v == null || isNaN(v) ? null : { x: xAt(i), y: yAt(v) }))
    .filter(Boolean);

const yTicks = computed(() => {
  const out = [];
  for (let i = 0; i <= 4; i++) {
    const v = props.yMin + (i / 4) * (props.yMax - props.yMin);
    out.push({ v, y: yAt(v) });
  }
  return out;
});

// hasta ~5 etiquetas en el eje X, sin encimar
const xTicks = computed(() => {
  const total = n.value;
  if (total === 0) return [];
  const step = Math.max(1, Math.ceil(total / 5));
  const out = [];
  for (let i = 0; i < total; i += step)
    out.push({ i, x: xAt(i), label: props.xLabels[i] });
  const last = total - 1;
  if (out.length && out[out.length - 1].i !== last)
    out.push({ i: last, x: xAt(last), label: props.xLabels[last] });
  return out;
});
</script>

<template>
  <div class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet">
      <!-- grid + eje Y -->
      <g v-for="(t, i) in yTicks" :key="'y' + i">
        <line
          :x1="px0"
          :y1="t.y"
          :x2="px1"
          :y2="t.y"
          stroke="rgba(120,140,165,0.12)"
          stroke-width="1"
        />
        <text :x="px0 - 8" :y="t.y + 4" text-anchor="end" class="axis">
          {{ formatY(t.v) }}
        </text>
      </g>

      <!-- eje X -->
      <text
        v-for="(t, i) in xTicks"
        :key="'x' + i"
        :x="t.x"
        :y="H - 10"
        text-anchor="middle"
        class="axis"
      >
        {{ t.label }}
      </text>

      <!-- series -->
      <g v-for="s in series" :key="s.label">
        <path
          :d="pathFor(s.values)"
          fill="none"
          :stroke="s.color"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle
          v-for="(p, i) in pointsFor(s.values)"
          :key="i"
          :cx="p.x"
          :cy="p.y"
          r="3"
          :fill="s.color"
        />
      </g>
    </svg>

    <div class="legend">
      <span v-for="s in series" :key="s.label" class="legend-item">
        <span class="swatch" :style="{ background: s.color }"></span
        >{{ s.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 18px 10px;
}

svg {
  width: 100%;
  height: auto;
  display: block;
}

.axis {
  fill: var(--faint);
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--dim);
  font-weight: 500;
}

.swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  display: inline-block;
}
</style>
