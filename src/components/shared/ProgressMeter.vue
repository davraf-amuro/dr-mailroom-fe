<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  value?: number
  /** Assente finché il totale non è noto: la barra resta indeterminata. */
  max?: number
  /** Testo accanto alla barra, per esempio "1.204 mail lette". */
  valueText?: string
}>()

const labelId = useId()
</script>

<template>
  <div class="space-y-1">
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span :id="labelId" class="text-ink-muted">{{ label }}</span>
      <span v-if="valueText" class="font-mono tabular">{{ valueText }}</span>
    </div>
    <progress
      class="progress-meter"
      :aria-labelledby="labelId"
      :aria-valuetext="valueText"
      v-bind="max !== undefined ? { max, value: value ?? 0 } : {}"
    />
  </div>
</template>

<style scoped>
.progress-meter {
  display: block;
  width: 100%;
  height: 8px;
  appearance: none;
  border: 1px solid var(--c-control-border);
  background: var(--c-bg);
  color: var(--c-federal);
}

.progress-meter::-webkit-progress-bar {
  background: var(--c-bg);
}

.progress-meter::-webkit-progress-value {
  background: var(--c-federal);
}

.progress-meter::-moz-progress-bar {
  background: var(--c-federal);
}
</style>
