<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Testo sempre presente: lo stato non è mai affidato al solo colore. */
    label: string
    tone?: 'ok' | 'alert' | 'neutral' | 'federal' | 'caution'
  }>(),
  { tone: 'neutral' },
)

const toneClass = computed(
  () =>
    ({
      ok: 'border-ok text-ok',
      alert: 'border-alert text-alert',
      neutral: 'border-neutral text-neutral',
      federal: 'border-federal text-federal',
      caution: 'border-caution bg-caution text-on-caution',
    })[props.tone],
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
    :class="toneClass"
  >
    <slot name="icon" />
    {{ label }}
  </span>
</template>
