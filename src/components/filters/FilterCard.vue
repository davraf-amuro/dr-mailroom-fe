<script setup lang="ts">
import { computed, useId } from 'vue'
import { Bell, CircleCheck, CirclePause, History, Paperclip, Pencil, Trash2 } from '@lucide/vue'

import BaseBadge from '@/components/shared/BaseBadge.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import {
  filterSentence,
  hasProcess,
  subjectCondition,
} from '@/composables/filters/filterPresentation'
import { ProcessTypeValue, type FilterDto } from '@/services/filtersService'

const props = defineProps<{
  filter: FilterDto
  /** Casella in chiaro ("tutte le caselle" oppure l'indirizzo). */
  mailbox: string
  deleting?: boolean
}>()

const emit = defineEmits<{ edit: []; reapply: []; remove: [] }>()

const titleId = useId()
const subject = computed(() => subjectCondition(props.filter))
const extracts = computed(() => hasProcess(props.filter, ProcessTypeValue.AttachmentExtraction))
const alerts = computed(() => hasProcess(props.filter, ProcessTypeValue.Alert))
const sentence = computed(() => filterSentence(props.filter, props.mailbox))
</script>

<template>
  <BasePanel as="article" :aria-labelledby="titleId" :class="{ 'opacity-80': !filter.isEnabled }">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <h3 :id="titleId" class="text-lg [overflow-wrap:anywhere]">{{ filter.name }}</h3>
      <BaseBadge v-if="filter.isEnabled" label="Attivo" tone="ok">
        <template #icon
          ><CircleCheck :size="16" :stroke-width="1.75" aria-hidden="true"
        /></template>
      </BaseBadge>
      <BaseBadge v-else label="Disattivato" tone="neutral">
        <template #icon
          ><CirclePause :size="16" :stroke-width="1.75" aria-hidden="true"
        /></template>
      </BaseBadge>
    </div>

    <!-- Card-frase: la frase visibile è spezzata per lo stile, quella per gli screen reader è intera. -->
    <p class="visually-hidden">{{ sentence }}</p>
    <p class="mt-3 leading-relaxed" aria-hidden="true">
      Quando scrive
      <strong class="font-mono text-sm [overflow-wrap:anywhere]">{{ filter.senderAddress }}</strong>
      su <strong>{{ mailbox }}</strong>
      <template v-if="subject">
        e l'oggetto {{ subject.verb }}
        <strong class="[overflow-wrap:anywhere]">«{{ subject.value }}»</strong>
      </template>
      <span class="text-ink-muted"> → </span>
      <template v-if="extracts">
        estrai gli allegati in
        <code class="font-mono text-sm [overflow-wrap:anywhere]">{{
          filter.attachmentSubfolder
        }}</code>
      </template>
      <template v-if="extracts && alerts"> e </template>
      <template v-if="alerts">crea un'allerta</template>
    </p>

    <ul class="mt-3 flex flex-wrap gap-2" aria-label="Processi del filtro">
      <li v-if="extracts">
        <BaseBadge label="Allegati" tone="federal">
          <template #icon
            ><Paperclip :size="16" :stroke-width="1.75" aria-hidden="true"
          /></template>
        </BaseBadge>
      </li>
      <li v-if="alerts">
        <BaseBadge label="Allerta" tone="caution">
          <template #icon><Bell :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
        </BaseBadge>
      </li>
    </ul>

    <div class="mt-4 flex flex-wrap gap-2">
      <BaseButton
        variant="secondary"
        :aria-label="`Modifica ${filter.name}`"
        :disabled="deleting"
        @click="emit('edit')"
      >
        <template #icon><Pencil :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Modifica
      </BaseButton>
      <BaseButton
        variant="secondary"
        :aria-label="`Riapplica ${filter.name} allo storico`"
        :disabled="deleting"
        @click="emit('reapply')"
      >
        <template #icon><History :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Riapplica
      </BaseButton>
      <BaseButton
        variant="danger-ghost"
        :busy="deleting"
        :aria-label="`Elimina ${filter.name}`"
        @click="emit('remove')"
      >
        <template #icon><Trash2 :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Elimina
      </BaseButton>
    </div>
  </BasePanel>
</template>
