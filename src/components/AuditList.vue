<script setup>
import { ref } from 'vue'

defineProps({
  audits: { type: Array, required: true },
  delay: { type: String, default: '0.15s' },
})

const open = ref({})
const toggle = (id) => (open.value[id] = !open.value[id])
</script>

<template>
  <div class="audits reveal" :style="{ animationDelay: delay }">
    <div class="audit" :class="a.band" v-for="a in audits" :key="a.id">
      <div class="row" :class="{ clickable: a.items && a.items.length }" @click="a.items && a.items.length && toggle(a.id)">
        <span class="dot"></span>
        <div class="body">
          <div class="a-title">
            {{ a.title }}
            <span v-if="a.items && a.items.length" class="caret" :class="{ open: open[a.id] }">▸</span>
          </div>
          <div class="a-desc">{{ a.desc }}</div>
        </div>
        <span v-if="a.badge" class="badge" :class="a.badgeTone">
          <template v-if="a.badgeTone === 'save'">−{{ a.badge }}</template>
          <template v-else>{{ a.badge }}</template>
        </span>
      </div>

      <div v-if="a.items && a.items.length && open[a.id]" class="items">
        <div class="item" v-for="(it, i) in a.items" :key="i">
          <span class="i-label">{{ it.label }}</span>
          <span v-if="it.value" class="i-value">{{ it.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audits {
  display: grid;
  gap: 10px;
}

.audit {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.audit:hover {
  border-color: var(--border-strong);
}

.row {
  padding: 15px 18px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.row.clickable {
  cursor: pointer;
  user-select: none;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 7px;
  flex-shrink: 0;
}

.audit.avg .dot {
  background: var(--avg);
}
.audit.poor .dot {
  background: var(--poor);
}
.audit.info .dot {
  background: var(--dim);
}

.body {
  flex: 1;
  min-width: 0;
}

.a-title {
  font-weight: 600;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.caret {
  color: var(--faint);
  font-size: 11px;
  transition: transform 0.2s;
  display: inline-block;
}

.caret.open {
  transform: rotate(90deg);
}

.a-desc {
  font-size: 12.5px;
  color: var(--dim);
  margin-top: 4px;
  line-height: 1.45;
}

.badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 1px;
}

.badge.save {
  color: var(--avg);
}
.badge.count {
  color: var(--poor);
}
.badge.info {
  color: var(--dim);
}

.items {
  border-top: 1px solid var(--border);
  background: var(--card-2);
  padding: 6px 18px 10px 42px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.item:last-child {
  border-bottom: 0;
}

.i-label {
  color: var(--dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.i-value {
  color: var(--text);
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
