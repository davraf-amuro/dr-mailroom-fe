<script setup lang="ts">
import { computed } from 'vue'
import { Archive, ArchiveX, FileCode, FileText, Paperclip, TextSearch } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import SortableTable, {
  type SortState,
  type TableColumn,
} from '@/components/shared/SortableTable.vue'
import { FilterMessagesMessages } from '@/composables/filters/filterMessagesPresentation'
import { subjectText } from '@/composables/stats/statsPresentation'
import type { FilterMessageDto } from '@/services/filtersService'
import { MessageContentFormat } from '@/services/messagesService'
import { SortDirectionValue, type SortDirection } from '@/services/statsService'
import { formatDateTime } from '@/utils/formatDate'

const props = defineProps<{
  rows: FilterMessageDto[]
  filterName: string
  sortDir: SortDirection
  /** Pagina in caricamento: la tabella resta visibile ma annunciata come occupata. */
  busy?: boolean
  /** Download in corso per mail e formato. */
  isDownloading: (message: FilterMessageDto, format: MessageContentFormat) => boolean
}>()

const emit = defineEmits<{
  toggleSort: []
  showText: [message: FilterMessageDto]
  download: [message: FilterMessageDto, format: MessageContentFormat]
}>()

const columns: TableColumn[] = [
  { key: 'subject', label: 'Oggetto' },
  { key: 'receivedAtUtc', label: 'Data ricevimento', sortable: true },
  { key: 'hasAttachments', label: 'Allegati' },
  { key: 'isArchived', label: 'Contenuto' },
  { key: 'actions', label: 'Azioni' },
]

/** Righe nella forma richiesta da SortableTable; la mail originale resta in `message`. */
const items = computed(() =>
  props.rows.map((message) => ({
    id: String(message.id),
    subject: message.subject,
    receivedAtUtc: message.receivedAtUtc,
    hasAttachments: message.hasAttachments,
    isArchived: message.isArchived,
    actions: null,
    message,
  })),
)

// L'ordine arriva già dal server: la tabella mostra il verso scelto e segnala il clic alla vista.
const sort = computed<SortState>({
  get: () => ({
    key: 'receivedAtUtc',
    direction:
      props.sortDir === SortDirectionValue.Asc ? ('ascending' as const) : ('descending' as const),
  }),
  set: () => emit('toggleSort'),
})

/** Nome della mail nelle etichette dei pulsanti: lo screen reader sa su quale riga agisce. */
function mailName(row: FilterMessageDto): string {
  return row.subject?.trim() ? `«${subjectText(row.subject)}»` : 'senza oggetto'
}

/** Id del motivo per cui le azioni sono disabilitate; undefined se la mail è archiviata. */
function reasonId(row: FilterMessageDto): string | undefined {
  return row.isArchived ? undefined : `not-archived-${row.id}`
}
</script>

<template>
  <!-- Su schermi stretti la tabella scorre in orizzontale invece di schiacciare gli oggetti -->
  <SortableTable
    v-model:sort="sort"
    :columns="columns"
    :rows="items"
    row-key="id"
    :caption="`Mail del filtro ${filterName}: oggetto, data di ricezione, allegati, contenuto salvato e azioni`"
    class="[&_table]:min-w-[56rem]"
    :aria-busy="busy ? 'true' : undefined"
  >
    <template #cell-subject="{ row }">
      <span class="block max-w-[24rem] break-words" :title="row.subject ?? undefined">{{
        subjectText(row.subject)
      }}</span>
    </template>

    <template #cell-receivedAtUtc="{ row }">
      <time :datetime="row.receivedAtUtc" class="text-sm whitespace-nowrap">{{
        formatDateTime(row.receivedAtUtc)
      }}</time>
    </template>

    <template #cell-hasAttachments="{ row }">
      <div class="text-center">
        <template v-if="row.hasAttachments">
          <Paperclip
            :size="20"
            :stroke-width="1.75"
            aria-hidden="true"
            class="inline-block text-federal"
          />
          <span class="visually-hidden">Contiene allegati</span>
        </template>
        <span v-else class="text-sm text-ink-muted">
          <span aria-hidden="true">—</span>
          <span class="visually-hidden">Nessun allegato</span>
        </span>
      </div>
    </template>

    <template #cell-isArchived="{ row }">
      <!-- Stato a parole, non solo a colori -->
      <span
        v-if="row.isArchived"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-ok"
      >
        <Archive :size="16" :stroke-width="1.75" aria-hidden="true" />
        Salvato
      </span>
      <template v-else>
        <span class="inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <ArchiveX :size="16" :stroke-width="1.75" aria-hidden="true" />
          Non salvato
        </span>
        <!-- Motivo visibile e collegato ai pulsanti disabilitati con aria-describedby -->
        <p :id="reasonId(row.message)" class="mt-1 max-w-[16rem] text-sm text-ink-muted">
          {{ FilterMessagesMessages.notArchivedReason }}
        </p>
      </template>
    </template>

    <template #cell-actions="{ row }">
      <div class="flex flex-wrap gap-1">
        <BaseButton
          variant="ghost"
          :disabled="!row.isArchived"
          :aria-label="`Leggi il testo della mail ${mailName(row.message)}`"
          :aria-describedby="reasonId(row.message)"
          @click="emit('showText', row.message)"
        >
          <template #icon
            ><TextSearch :size="20" :stroke-width="1.75" aria-hidden="true"
          /></template>
          Testo
        </BaseButton>
        <BaseButton
          variant="ghost"
          :disabled="!row.isArchived"
          :busy="isDownloading(row.message, MessageContentFormat.eml)"
          :aria-label="`Scarica la mail ${mailName(row.message)} in formato .eml`"
          :aria-describedby="reasonId(row.message)"
          @click="emit('download', row.message, MessageContentFormat.eml)"
        >
          <template #icon><FileCode :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          .eml
        </BaseButton>
        <BaseButton
          variant="ghost"
          :disabled="!row.isArchived"
          :busy="isDownloading(row.message, MessageContentFormat.txt)"
          :aria-label="`Scarica il testo della mail ${mailName(row.message)} in formato .txt`"
          :aria-describedby="reasonId(row.message)"
          @click="emit('download', row.message, MessageContentFormat.txt)"
        >
          <template #icon><FileText :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          .txt
        </BaseButton>
      </div>
    </template>
  </SortableTable>
</template>
