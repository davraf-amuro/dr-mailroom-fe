<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { APP_NAME } from '@/utils/appInfo'

withDefaults(
  defineProps<{
    /** Solo il marchio, senza nome: per la testata su schermi stretti. */
    compact?: boolean
  }>(),
  { compact: false },
)
</script>

<template>
  <!-- Marchio originale (design.md, "Marchio dell'applicazione"): stessa geometria di public/favicon.svg -->
  <RouterLink to="/" class="inline-flex items-center gap-3" :aria-label="`${APP_NAME}, home`">
    <svg class="size-10 shrink-0" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <polygon class="mark-panel" points="10,0 64,0 64,54 54,64 0,64 0,10" />
      <polygon class="mark-notch" points="44,5 59,5 59,10 49,10" />
      <g class="mark-letter">
        <rect x="8" y="16" width="5.5" height="28" />
        <rect x="24.5" y="16" width="5.5" height="28" />
        <polygon points="15,16 19,24 23,16 23,23.5 19,31.5 15,23.5" />
        <rect x="34" y="16" width="5.5" height="28" />
        <path d="M41 16 H48 A8 8 0 0 1 48 32 H41 V26.5 H48 A2.5 2.5 0 0 0 48 21.5 H41 Z" />
        <polygon points="43.5,33.5 50,33.5 56,44 49.5,44" />
      </g>
      <rect class="mark-stripe" x="8" y="50" width="22" height="4" />
    </svg>
    <span v-if="!compact" class="font-condensed text-lg leading-none font-bold">
      dr-<span class="text-federal">mailroom</span>
    </span>
  </RouterLink>
</template>

<style scoped>
.mark-panel {
  fill: var(--c-federal);
}

.mark-letter {
  fill: var(--c-on-federal);
}

.mark-stripe {
  fill: var(--c-alert);
}

.mark-notch {
  fill: var(--c-caution);
}
</style>
