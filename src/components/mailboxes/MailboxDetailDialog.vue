<script setup lang="ts">
import { computed } from 'vue'

import BaseDialog from '@/components/shared/BaseDialog.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import SerialTag from '@/components/shared/SerialTag.vue'
import {
  backfillLabels,
  backfillProgress,
  backfillState,
  currentRunText,
  lastErrorContext,
  lastRunText,
} from '@/composables/mailboxes/mailboxPresentation'
import type { MailboxDto } from '@/services/mailboxesService'
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
      <dd>
        {{ backfillLabels[backfillState(mailbox)] }}
        <span
          v-if="backfillState(mailbox) === 'inProgress'"
          class="block text-sm text-ink-muted tabular"
        >
          {{ backfillProgress(mailbox).valueText }}
        </span>
      </dd>
      <template v-if="mailbox.currentRun">
        <dt class="stencil text-xs text-ink-muted">Giro in corso</dt>
        <dd class="tabular">{{ currentRunText(mailbox.currentRun) }}</dd>
      </template>
      <dt class="stencil text-xs text-ink-muted">Ultimo giro concluso</dt>
      <dd class="font-mono tabular">{{ lastRunText(mailbox) }}</dd>
      <dt class="stencil text-xs text-ink-muted">Ultimo errore</dt>
      <!-- Testo completo: nelle card e in tabella è troncato -->
      <dd class="break-words" :class="mailbox.lastError ? 'text-alert' : 'text-ink-muted'">
        {{ mailbox.lastError ?? 'Nessuno' }}
        <span
          v-if="mailbox.lastError && lastErrorContext(mailbox)"
          class="block text-sm text-ink-muted tabular"
        >
          {{ lastErrorContext(mailbox) }}
        </span>
      </dd>
    </dl>
  </BaseDialog>
</template>
