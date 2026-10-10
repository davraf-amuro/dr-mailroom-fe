<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'

import BaseButton from './BaseButton.vue'

defineProps<{
  page: number
  pages: number
  /** Nome di ciò che si sfoglia, per il nome accessibile: "Pagine dei mittenti". */
  label: string
  busy?: boolean
}>()

const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav :aria-label="label" class="flex flex-wrap items-center justify-between gap-3">
    <BaseButton variant="secondary" :disabled="page <= 1 || busy" @click="emit('change', page - 1)">
      <template #icon><ChevronLeft :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
      Precedente
    </BaseButton>
    <p class="font-mono tabular text-sm" aria-live="polite">Pagina {{ page }} di {{ pages }}</p>
    <BaseButton
      variant="secondary"
      :disabled="page >= pages || busy"
      @click="emit('change', page + 1)"
    >
      Successiva
      <ChevronRight :size="20" :stroke-width="1.75" aria-hidden="true" />
    </BaseButton>
  </nav>
</template>
