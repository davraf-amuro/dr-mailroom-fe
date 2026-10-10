<script setup lang="ts">
import { computed, ref } from 'vue'

import SortableTable, {
  type SortState,
  type TableColumn,
} from '@/components/shared/SortableTable.vue'
import {
  backfillLabels,
  backfillProgress,
  backfillState,
  lastErrorContext,
} from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxDto, MailboxId } from '@/services/mailboxesService'
import { formatDateTime } from '@/utils/formatDate'
import { formatSerial } from '@/utils/formatSerial'
import MailboxActions from './MailboxActions.vue'
import MailboxStatusBadge from './MailboxStatusBadge.vue'

const props = defineProps<{
  mailboxes: MailboxDto[]
  busy: Record<string, 'pause' | 'resume' | 'delete' | undefined>
  reconnecting?: boolean
}>()

const emit = defineEmits<{
  pause: [id: MailboxId]
  resume: [id: MailboxId]
  reconnect: [id: MailboxId]
  remove: [mailbox: MailboxDto]
  details: [id: MailboxId]
}>()

const columns: TableColumn[] = [
  { key: 'serial', label: 'Matricola', sortable: true },
  { key: 'emailAddress', label: 'Indirizzo', sortable: true },
  { key: 'status', label: 'Stato', sortable: true },
  { key: 'connected', label: 'Collegata', sortable: true },
  { key: 'backfill', label: 'Backfill', sortable: true },
  { key: 'lastRunAtUtc', label: 'Ultimo giro concluso', sortable: true },
  { key: 'lastError', label: 'Errore' },
  { key: 'actions', label: 'Azioni' },
]

const sort = ref<SortState | null>(null)

// Righe con i valori già leggibili: ordinamento e testo coincidono.
const rows = computed(() =>
  props.mailboxes.map((mailbox) => ({
    ...mailbox,
    serial: formatSerial(mailbox.id),
    connected: mailbox.isConnected ? 'Sì' : 'No',
    backfill: backfillLabels[backfillState(mailbox)],
    backfillDetail:
      backfillState(mailbox) === 'inProgress' ? backfillProgress(mailbox).valueText : null,
    errorContext: lastErrorContext(mailbox),
    mailbox,
  })),
)
</script>

<template>
  <SortableTable
    v-model:sort="sort"
    :columns="columns"
    :rows="rows"
    row-key="id"
    caption="Caselle collegate"
  >
    <template #cell-serial="{ row }">
      <span class="stencil font-mono tabular text-sm">{{ row.serial }}</span>
    </template>
    <template #cell-emailAddress="{ row }">
      <span
        class="block min-w-48 [overflow-wrap:anywhere]"
        :class="row.status === 'Deleted' ? 'line-through' : undefined"
      >
        {{ row.emailAddress }}
      </span>
    </template>
    <template #cell-status="{ row }">
      <MailboxStatusBadge :status="row.mailbox.status" />
    </template>
    <template #cell-backfill="{ row }">
      <span class="text-sm">{{ row.backfill }}</span>
      <span
        v-if="row.backfillDetail"
        class="block text-xs whitespace-nowrap text-ink-muted tabular"
      >
        {{ row.backfillDetail }}
      </span>
    </template>
    <template #cell-lastRunAtUtc="{ row }">
      <span class="font-mono tabular text-sm whitespace-nowrap">
        {{ formatDateTime(row.mailbox.lastRunAtUtc, 'Mai') }}
      </span>
      <span v-if="row.mailbox.currentRun" class="block text-xs whitespace-nowrap text-federal">
        Giro {{ row.mailbox.currentRun.id }} in corso
      </span>
    </template>
    <template #cell-lastError="{ row }">
      <span
        v-if="row.mailbox.lastError"
        class="line-clamp-2 max-w-xs text-sm break-words text-alert"
        :title="row.mailbox.lastError"
      >
        {{ row.mailbox.lastError }}
      </span>
      <span
        v-if="row.mailbox.lastError && row.errorContext"
        class="block text-xs whitespace-nowrap text-ink-muted tabular"
      >
        {{ row.errorContext }}
      </span>
      <span v-if="!row.mailbox.lastError" class="text-ink-muted">—</span>
    </template>
    <template #cell-actions="{ row }">
      <MailboxActions
        :status="row.mailbox.status"
        :email-address="row.mailbox.emailAddress"
        :busy="busy[String(row.id)]"
        :reconnecting="reconnecting"
        compact
        @pause="emit('pause', row.mailbox.id)"
        @resume="emit('resume', row.mailbox.id)"
        @reconnect="emit('reconnect', row.mailbox.id)"
        @remove="emit('remove', row.mailbox)"
        @details="emit('details', row.mailbox.id)"
      />
    </template>
  </SortableTable>
</template>
