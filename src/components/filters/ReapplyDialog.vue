<script setup lang="ts">
import { useId } from 'vue'
import { History } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BaseDialog from '@/components/shared/BaseDialog.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import { processLabels } from '@/composables/filters/filterPresentation'
import type { FilterDto, ProcessType } from '@/services/filtersService'

defineProps<{
  filter: FilterDto | null
  busy: boolean
  error: string | null
}>()

const open = defineModel<boolean>('open', { required: true })
const selected = defineModel<ProcessType[]>('selected', { required: true })

const emit = defineEmits<{ confirm: [] }>()

const uid = useId()
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="`Riapplica «${filter?.name ?? 'filtro'}»`"
    description="Lavora le mail già indicizzate. Rilanciarla non duplica né allegati né allerte."
  >
    <fieldset class="m-0 border-0 p-0">
      <legend class="mb-2 text-sm font-semibold">Processi da riapplicare</legend>
      <div v-for="process in filter?.processes ?? []" :key="process">
        <label
          :for="`${uid}-${process}`"
          class="inline-flex min-h-11 items-center gap-3 font-semibold"
        >
          <input
            :id="`${uid}-${process}`"
            v-model="selected"
            type="checkbox"
            :value="process"
            class="size-5 accent-federal"
          />
          {{ processLabels[process] }}
        </label>
      </div>
    </fieldset>
    <p class="mt-3 text-sm text-ink-muted">
      Per un filtro valido su tutte le caselle parte un giro per ogni casella attiva.
    </p>
    <InlineNotice class="mt-4" :tone="error ? 'warning' : null" :text="error" @dismiss="() => {}" />

    <template #footer>
      <BaseButton variant="secondary" :disabled="busy" @click="open = false">Annulla</BaseButton>
      <BaseButton :busy="busy" @click="emit('confirm')">
        <template #icon><History :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Avvia
      </BaseButton>
    </template>
  </BaseDialog>
</template>
