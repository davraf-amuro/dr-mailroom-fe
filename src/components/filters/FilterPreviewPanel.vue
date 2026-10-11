<script setup lang="ts">
import { computed } from 'vue'
import { Paperclip, Send } from '@lucide/vue'

import BaseBadge from '@/components/shared/BaseBadge.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { SENT_MAIL_LABEL } from '@/composables/stats/statsPresentation'
import type { FilterPreviewDto, MessageSummaryDto } from '@/services/filtersService'
import { formatCount } from '@/utils/formatNumber'
import { formatDateTime } from '@/utils/formatDate'

const props = defineProps<{
  preview: FilterPreviewDto | null
  busy: boolean
  /** True dopo che l'utente ha provato il filtro con le condizioni attuali. */
  requested: boolean
}>()

const emit = defineEmits<{ attachments: [message: MessageSummaryDto] }>()

const total = computed(() => (props.preview === null ? 0 : Number(props.preview.totalMatches)))

/** Esito annunciato dallo screen reader: «12 mail corrispondono». */
const summary = computed(() => {
  if (props.busy) return 'Prova in corso…'
  if (props.preview === null) return ''
  if (total.value === 0) return 'Nessuna mail corrisponde'
  return total.value === 1 ? '1 mail corrisponde' : `${formatCount(total.value)} mail corrispondono`
})

const truncated = computed(
  () => props.preview !== null && total.value > props.preview.messages.length,
)
</script>

<template>
  <BasePanel as="section" aria-labelledby="preview-title" class="h-full">
    <p class="stencil text-sm text-ink-muted">Anteprima</p>
    <h2 id="preview-title" class="font-condensed text-2xl">Prova sulle mail già lette</h2>
    <p class="mt-1 text-sm text-ink-muted">
      Non scrive nulla e non chiama Gmail: usa solo le mail già indicizzate.
    </p>

    <!-- Regione sempre presente: lo screen reader annuncia l'esito quando il testo cambia. -->
    <LiveRegion class="mt-4 text-lg font-semibold" :message="summary" visible />

    <ProgressMeter v-if="busy" label="Prova del filtro" class="mt-3" />

    <p v-else-if="!requested && preview === null" class="mt-4 text-ink-muted">
      Compila mittente e condizione, poi premi «Prova sulle mail già lette» per vedere quali mail
      corrispondono.
    </p>

    <template v-else-if="preview !== null && total > 0">
      <p v-if="truncated" class="text-sm text-ink-muted">
        Le {{ formatCount(preview.messages.length) }} più recenti.
      </p>
      <ul class="mt-3 divide-y divide-panel-line border-y border-panel-line">
        <li v-for="message in preview.messages" :key="String(message.id)" class="py-3">
          <p class="truncate font-semibold" :title="message.subject ?? undefined">
            {{ message.subject || '(senza oggetto)' }}
          </p>
          <p class="truncate text-sm text-ink-muted" :title="message.senderAddress">
            {{ message.senderAddress }}
          </p>
          <div class="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span class="inline-flex flex-wrap items-center gap-2">
              <time class="font-mono tabular text-ink-muted" :datetime="message.receivedAtUtc">
                {{ formatDateTime(message.receivedAtUtc) }}
              </time>
              <BaseBadge v-if="message.isSent" :label="SENT_MAIL_LABEL">
                <template #icon
                  ><Send :size="16" :stroke-width="1.75" aria-hidden="true"
                /></template>
              </BaseBadge>
            </span>
            <button
              v-if="message.hasAttachments"
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-federal underline"
              @click="emit('attachments', message)"
            >
              <Paperclip :size="16" :stroke-width="1.75" aria-hidden="true" />
              Allegati salvati
              <span class="visually-hidden">
                della mail «{{ message.subject || 'senza oggetto' }}»</span
              >
            </button>
          </div>
        </li>
      </ul>
    </template>
  </BasePanel>
</template>
