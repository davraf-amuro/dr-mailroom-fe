<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleDashed, RefreshCw, TriangleAlert } from '@lucide/vue'

import BasePanel from '@/components/shared/BasePanel.vue'
import HazardStripe from '@/components/shared/HazardStripe.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import SerialTag from '@/components/shared/SerialTag.vue'
import {
  backfillLabels,
  backfillProgress,
  backfillState,
  currentRunText,
  lastErrorContext,
} from '@/composables/mailboxes/mailboxPresentation'
import { MailboxStatusValue, type MailboxDto } from '@/services/mailboxesService'
import { formatDateTime } from '@/utils/formatDate'
import { formatSerial } from '@/utils/formatSerial'
import MailboxActions from './MailboxActions.vue'
import MailboxStatusBadge from './MailboxStatusBadge.vue'

const props = defineProps<{
  mailbox: MailboxDto
  busy?: 'pause' | 'resume' | 'delete'
  reconnecting?: boolean
  /** Casella appena collegata: le "luci dell'hangar" si accendono una volta. */
  highlight?: boolean
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  reconnect: []
  remove: []
  details: []
}>()

const serial = computed(() => formatSerial(props.mailbox.id))
const backfill = computed(() => backfillState(props.mailbox))
const progress = computed(() => backfillProgress(props.mailbox))
const errorContext = computed(() => lastErrorContext(props.mailbox))
const revoked = computed(() => props.mailbox.status === MailboxStatusValue.TokenRevoked)
const deleted = computed(() => props.mailbox.status === MailboxStatusValue.Deleted)
const titleId = computed(() => `mailbox-${props.mailbox.id}-title`)
</script>

<template>
  <BasePanel
    as="article"
    :aria-labelledby="titleId"
    :class="[highlight ? 'hangar-lights' : undefined, deleted ? 'opacity-75' : undefined]"
  >
    <HazardStripe v-if="revoked" class="-mx-4 -mt-4 mb-3 w-auto" />
    <div class="flex flex-wrap items-center justify-between gap-2">
      <SerialTag :code="serial" :label="`Unità ${serial}`" />
      <MailboxStatusBadge :status="mailbox.status" />
    </div>

    <h3
      :id="titleId"
      class="mt-3 text-lg [overflow-wrap:anywhere]"
      :class="deleted ? 'line-through' : undefined"
    >
      {{ mailbox.emailAddress }}
    </h3>
    <p class="text-sm text-ink-muted">
      {{ mailbox.isConnected ? 'Collegata a Google' : 'Non collegata' }}
    </p>

    <dl class="mt-3 space-y-3 text-sm">
      <div>
        <dt class="stencil text-xs text-ink-muted">Lettura dello storico</dt>
        <dd v-if="backfill === 'inProgress'" class="mt-1">
          <ProgressMeter
            :label="backfillLabels.inProgress"
            :value="progress.value"
            :max="progress.max"
            :value-text="progress.valueText"
          />
        </dd>
        <dd v-else class="mt-1 flex items-center gap-1.5">
          <CircleCheck
            v-if="backfill === 'completed'"
            :size="16"
            :stroke-width="1.75"
            class="text-ok"
            aria-hidden="true"
          />
          <CircleDashed v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
          {{ backfillLabels[backfill] }}
        </dd>
      </div>
      <div v-if="mailbox.currentRun">
        <dt class="stencil text-xs text-ink-muted">Giro in corso</dt>
        <dd class="mt-1 flex items-start gap-1.5">
          <RefreshCw
            :size="16"
            :stroke-width="1.75"
            class="mt-0.5 shrink-0 text-federal"
            aria-hidden="true"
          />
          <span class="tabular">{{ currentRunText(mailbox.currentRun) }}</span>
        </dd>
      </div>
      <div>
        <dt class="stencil text-xs text-ink-muted">Ultimo giro concluso</dt>
        <dd class="mt-1 font-mono tabular">{{ formatDateTime(mailbox.lastRunAtUtc, 'Mai') }}</dd>
      </div>
      <div v-if="mailbox.lastError">
        <dt class="stencil text-xs text-ink-muted">Ultimo errore</dt>
        <dd class="mt-1 text-alert">
          <span class="flex items-start gap-1.5">
            <TriangleAlert
              :size="16"
              :stroke-width="1.75"
              class="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span class="line-clamp-2 break-words" :title="mailbox.lastError">
              {{ mailbox.lastError }}
            </span>
          </span>
          <span v-if="errorContext" class="mt-0.5 block pl-[22px] text-xs text-ink-muted tabular">
            {{ errorContext }}
          </span>
        </dd>
      </div>
    </dl>

    <MailboxActions
      class="mt-4"
      :status="mailbox.status"
      :email-address="mailbox.emailAddress"
      :busy="busy"
      :reconnecting="reconnecting"
      @pause="emit('pause')"
      @resume="emit('resume')"
      @reconnect="emit('reconnect')"
      @remove="emit('remove')"
      @details="emit('details')"
    />
  </BasePanel>
</template>

<style scoped>
/* Luci dell'hangar (design.md, "Motion"): una volta, 800 ms; nessuna con reduced-motion. */
.hangar-lights {
  animation: hangar-lights 800ms ease-out 1;
}

@keyframes hangar-lights {
  0% {
    filter: brightness(0.55);
  }
  40% {
    filter: brightness(1.15);
  }
  100% {
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hangar-lights {
    animation: none;
  }
}
</style>
