<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from '@lucide/vue'

const props = defineProps<{
  /** null: regione vuota ma presente, così lo screen reader la conosce già. */
  tone: 'ok' | 'warning' | 'error' | 'info' | null
  text: string | null
}>()

const emit = defineEmits<{ dismiss: [] }>()

const presentation = computed(() => {
  switch (props.tone) {
    case 'ok':
      return { icon: CircleCheck, frame: 'border-ok', iconClass: 'text-ok', label: 'Fatto' }
    case 'warning':
      return {
        icon: TriangleAlert,
        frame: 'border-caution',
        iconClass: 'text-ink',
        label: 'Attenzione',
      }
    case 'error':
      return { icon: CircleX, frame: 'border-alert', iconClass: 'text-alert', label: 'Errore' }
    default:
      return {
        icon: Info,
        frame: 'border-federal',
        iconClass: 'text-federal',
        label: 'Informazione',
      }
  }
})
</script>

<template>
  <div role="status" aria-live="polite" aria-atomic="true">
    <div
      v-if="tone !== null && text"
      class="flex items-start gap-3 border border-l-4 bg-surface px-4 py-3"
      :class="presentation.frame"
    >
      <component
        :is="presentation.icon"
        :size="20"
        :stroke-width="1.75"
        class="mt-0.5 shrink-0"
        :class="presentation.iconClass"
        aria-hidden="true"
      />
      <p class="min-w-0 flex-1">
        <span class="visually-hidden">{{ presentation.label }}: </span>{{ text }}
      </p>
      <button
        type="button"
        class="-m-2 inline-flex size-11 shrink-0 items-center justify-center text-ink-muted"
        aria-label="Chiudi avviso"
        @click="emit('dismiss')"
      >
        <X :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
