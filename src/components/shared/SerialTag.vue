<script setup lang="ts">
defineProps<{
  /** Codice già formattato, per esempio "MR-0003". */
  code: string
  /** Testo per gli screen reader, se il codice da solo non basta. */
  label?: string
}>()
</script>

<template>
  <span class="stencil font-mono tabular text-sm text-ink-muted" :aria-label="label">
    {{ code }}
  </span>
</template>
