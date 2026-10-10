<script setup lang="ts">
import { computed, ref } from 'vue'

import SortableTable, {
  type SortState,
  type TableColumn,
} from '@/components/shared/SortableTable.vue'
import { mailboxName, runOriginText, utcMillis } from '@/composables/runs/runPresentation'
import { RunStatusValue, type RunDto } from '@/services/runsService'
import { formatDateTime } from '@/utils/formatDate'
import { formatCount } from '@/utils/formatNumber'
import RunStatusBadge from './RunStatusBadge.vue'

const props = defineProps<{
  runs: RunDto[]
  mailboxNames: Map<string, string>
  filterNames: Map<string, string>
}>()

const columns: TableColumn[] = [
  { key: 'id', label: 'Giro', sortable: true, align: 'end' },
  { key: 'started', label: 'Avvio / fine', sortable: true },
  { key: 'mailbox', label: 'Casella', sortable: true },
  { key: 'origin', label: 'Origine', sortable: true },
  { key: 'status', label: 'Stato', sortable: true },
  { key: 'read', label: 'Lette / lavorate', sortable: true, align: 'end' },
  { key: 'errors', label: 'Errori', sortable: true, align: 'end' },
]

const sort = ref<SortState | null>(null)

// Valori primitivi per l'ordinamento; il giro intero resta per le celle.
const rows = computed(() =>
  props.runs.map((run) => ({
    id: Number(run.id),
    started: utcMillis(run.startedAtUtc),
    mailbox: mailboxName(run.mailboxId, props.mailboxNames),
    origin: runOriginText(run, props.filterNames),
    status: run.status,
    read: Number(run.messagesRead),
    errors: Number(run.errorCount),
    run,
  })),
)
</script>

<template>
  <SortableTable
    v-model:sort="sort"
    :columns="columns"
    :rows="rows"
    row-key="id"
    caption="Cronologia dei giri"
  >
    <template #cell-started="{ row }">
      <time :datetime="row.run.startedAtUtc" class="whitespace-nowrap">{{
        formatDateTime(row.run.startedAtUtc)
      }}</time>
      <span class="block text-sm text-ink-muted">
        <template v-if="row.run.endedAtUtc">
          fine
          <time :datetime="row.run.endedAtUtc">{{ formatDateTime(row.run.endedAtUtc) }}</time>
        </template>
        <template v-else>in corso</template>
      </span>
    </template>
    <template #cell-status="{ row }">
      <RunStatusBadge :status="row.run.status" />
      <span
        v-if="row.run.status === RunStatusValue.Cancelled && row.run.errorSummary"
        class="mt-1 block text-sm text-ink-muted"
      >
        {{ row.run.errorSummary }}
      </span>
    </template>
    <template #cell-read="{ row }">
      {{ formatCount(row.read) }} / {{ formatCount(Number(row.run.messagesProcessed)) }}
    </template>
    <template #cell-errors="{ row }">
      {{ formatCount(row.errors) }}
      <span
        v-if="row.run.errorSummary && row.run.status !== RunStatusValue.Cancelled"
        class="mt-1 block max-w-64 text-left font-sans text-sm whitespace-normal text-ink-muted"
      >
        {{ row.run.errorSummary }}
      </span>
    </template>
  </SortableTable>
</template>
