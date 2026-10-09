<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
}>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <!-- Dialog: focus intrappolato, Esc chiude, focus restituito all'elemento d'origine -->
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-ink/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-2rem)] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-panel-line bg-surface shadow-xl"
        v-bind="description ? {} : { 'aria-describedby': undefined }"
      >
        <div class="flex items-start gap-4 border-b border-panel-line px-6 py-4">
          <div class="min-w-0 flex-1">
            <DialogTitle class="text-xl">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="text-ink-muted">
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            class="-m-2 inline-flex size-11 shrink-0 items-center justify-center text-ink-muted"
            aria-label="Chiudi"
          >
            <X :size="20" :stroke-width="1.75" aria-hidden="true" />
          </DialogClose>
        </div>
        <div class="p-6">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex flex-wrap justify-end gap-3 px-6 pb-6">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
