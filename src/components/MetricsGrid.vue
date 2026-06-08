<script setup>
defineProps({
  title: { type: String, required: true },
  tag: { type: String, default: '' },
  note: { type: String, default: '' },
  metrics: { type: Array, required: true },
  delay: { type: String, default: '0.1s' },
})
</script>

<template>
  <h2 class="section-title">
    {{ title }}
    <span v-if="tag" class="tag">{{ tag }}</span>
  </h2>
  <p v-if="note" class="field-note">{{ note }}</p>
  <div class="metrics reveal" :style="{ animationDelay: delay }">
    <div class="metric" :class="m.band" v-for="m in metrics" :key="m.abbr">
      <div class="m-head">
        <span class="m-name">{{ m.name }}</span>
        <span class="m-abbr">{{ m.abbr }}</span>
      </div>
      <div class="m-val">{{ m.display }}</div>
    </div>
  </div>
</template>

<style scoped>
.field-note {
  font-size: 12.5px;
  color: var(--faint);
  margin: -4px 0 14px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.metric {
  background: var(--card);
  border: 1px solid var(--border);
  border-left-width: 3px;
  border-radius: 12px;
  padding: 16px 18px;
}

.metric.good {
  border-left-color: var(--good);
}
.metric.avg {
  border-left-color: var(--avg);
}
.metric.poor {
  border-left-color: var(--poor);
}

.m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-name {
  font-size: 12.5px;
  color: var(--dim);
  font-weight: 500;
}

.m-abbr {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--faint);
}

.m-val {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 700;
  font-size: 26px;
  margin-top: 6px;
  letter-spacing: -0.02em;
}

.metric.good .m-val {
  color: var(--good);
}
.metric.avg .m-val {
  color: var(--avg);
}
.metric.poor .m-val {
  color: var(--poor);
}
</style>
