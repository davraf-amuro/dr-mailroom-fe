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
    <!-- Il valore non si spezza: se non c'è spazio va intero sulla riga sotto -->
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
      <span :id="labelId" class="text-ink-muted">{{ label }}</span>
      <span v-if="valueText" class="font-mono tabular whitespace-nowrap">{{ valueText }}</span>
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

/*
 * Indeterminata: con appearance none Chrome la lascia vuota e ferma.
 * Una fascia che scorre dice "sto lavorando"; con reduced-motion resta una trama fissa, mai vuota.
 */
.progress-meter:indeterminate,
.progress-meter:indeterminate::-webkit-progress-bar {
  background-color: var(--c-bg);
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    var(--c-federal) 35%,
    var(--c-federal) 65%,
    transparent 100%
  );
  background-repeat: no-repeat;
  background-size: 40% 100%;
  animation: progress-sweep 1.6s ease-in-out infinite;
}

.progress-meter:indeterminate::-moz-progress-bar {
  background: transparent;
}

@keyframes progress-sweep {
  0% {
    background-position: -40% 0;
  }
  100% {
    background-position: 140% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-meter:indeterminate,
  .progress-meter:indeterminate::-webkit-progress-bar {
    animation: none;
    background-image: repeating-linear-gradient(
      135deg,
      var(--c-federal) 0 4px,
      transparent 4px 10px
    );
    background-size: auto;
  }
}
</style>
