<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

import BaseButton from './BaseButton.vue'
import HazardStripe from './HazardStripe.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    confirmLabel: string
    cancelLabel?: string
    /** danger: azione distruttiva, con strisce d'avvertimento e pulsante rosso. */
    tone?: 'default' | 'danger'
    /** Conferma in corso: la finestra resta aperta finché il chiamante non la chiude. */
    busy?: boolean
  }>(),
  { cancelLabel: 'Annulla', tone: 'default', busy: false },
)

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <!-- AlertDialog: focus intrappolato, Esc chiude, focus restituito all'elemento d'origine -->
  <AlertDialogRoot v-model:open="open">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-ink/50" />
      <AlertDialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-panel-line bg-surface shadow-xl"
      >
        <HazardStripe v-if="tone === 'danger'" />
        <div class="space-y-4 p-6">
          <AlertDialogTitle class="text-xl">{{ title }}</AlertDialogTitle>
          <AlertDialogDescription class="text-ink-muted">{{ description }}</AlertDialogDescription>
          <div class="flex flex-wrap justify-end gap-3 pt-2">
            <AlertDialogCancel as-child>
              <BaseButton variant="secondary" :disabled="busy">{{ cancelLabel }}</BaseButton>
            </AlertDialogCancel>
            <BaseButton
              :variant="tone === 'danger' ? 'danger' : 'primary'"
              :busy="busy"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </BaseButton>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
