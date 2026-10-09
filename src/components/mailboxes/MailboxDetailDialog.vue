<script setup lang="ts">
import { computed } from 'vue'

import BaseDialog from '@/components/shared/BaseDialog.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import SerialTag from '@/components/shared/SerialTag.vue'
import { backfillLabels, backfillState } from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxDto } from '@/services/mailboxesService'
import { formatDateTime } from '@/utils/formatDate'
import { formatSerial } from '@/utils/formatSerial'
import MailboxStatusBadge from './MailboxStatusBadge.vue'

const props = defineProps<{
  mailbox: MailboxDto | null
  loading: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

const title = computed(() => props.mailbox?.emailAddress ?? 'Dettaglio casella')
</script>

<template>
  <BaseDialog v-model:open="open" :title="title">
    <ProgressMeter v-if="loading" label="Lettura del dettaglio" />
    <dl v-else-if="mailbox" class="grid gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr]">
      <dt class="stencil text-xs text-ink-muted">Matricola</dt>
      <dd><SerialTag :code="formatSerial(mailbox.id)" /></dd>
      <dt class="stencil text-xs text-ink-muted">Stato</dt>
      <dd><MailboxStatusBadge :status="mailbox.status" /></dd>
      <dt class="stencil text-xs text-ink-muted">Collegata</dt>
      <dd>{{ mailbox.isConnected ? 'Sì' : 'No' }}</dd>
      <dt class="stencil text-xs text-ink-muted">Backfill</dt>
      <dd>{{ backfillLabels[backfillState(mailbox)] }}</dd>
      <dt class="stencil text-xs text-ink-muted">Ultimo giro</dt>
      <dd class="font-mono tabular">{{ formatDateTime(mailbox.lastRunAtUtc, 'Mai') }}</dd>
      <dt class="stencil text-xs text-ink-muted">Ultimo errore</dt>
      <!-- Testo completo: nelle card e in tabella è troncato -->
      <dd class="break-words" :class="mailbox.lastError ? 'text-alert' : 'text-ink-muted'">
        {{ mailbox.lastError ?? 'Nessuno' }}
      </dd>
    </dl>
  </BaseDialog>
</template>
