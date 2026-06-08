<script setup>
import { bandColor } from '../composables/usePageSpeed.js'

defineProps({
  categories: { type: Array, required: true },
})

const R = 46
const circ = 2 * Math.PI * R
const ringOffset = (score) => circ - (score / 100) * circ
</script>

<template>
  <div class="gauges reveal" style="animation-delay: 0.05s">
    <div class="gauge" v-for="cat in categories" :key="cat.id">
      <div class="gauge-ring">
        <svg width="104" height="104" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="46" fill="none" stroke="rgba(120,140,165,0.12)" stroke-width="8" />
          <circle
            cx="52"
            cy="52"
            r="46"
            fill="none"
            :stroke="bandColor(cat.score)"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circ"
            :stroke-dashoffset="ringOffset(cat.score)"
            style="transition: stroke-dashoffset 1.1s cubic-bezier(0.2, 0.7, 0.3, 1)"
          />
        </svg>
        <span class="val" :style="{ color: bandColor(cat.score) }">{{ cat.score }}</span>
      </div>
      <div class="gauge-name">{{ cat.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.gauges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.gauge {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 22px 16px;
  text-align: center;
  transition:
    border-color 0.2s,
    transform 0.2s;
}

.gauge:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.gauge-ring {
  position: relative;
  width: 104px;
  height: 104px;
  margin: 0 auto 14px;
}

.gauge-ring svg {
  transform: rotate(-90deg);
}

.gauge-ring .val {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 700;
  font-size: 30px;
}

.gauge-name {
  font-size: 13px;
  color: var(--dim);
  font-weight: 500;
}
</style>
