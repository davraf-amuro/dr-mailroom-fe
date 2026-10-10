<script setup lang="ts">
import { useId } from 'vue'
import { Rocket } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import { mailboxName, runOriginText } from '@/composables/runs/runPresentation'
import type { MailboxDto } from '@/services/mailboxesService'
import type { RunDto, RunSummaryDto } from '@/services/runsService'
import { formatDateTime } from '@/utils/formatDate'
import RunBridgeCard from './RunBridgeCard.vue'
import RunStatusBadge from './RunStatusBadge.vue'

defineProps<{
  mailboxes: MailboxDto[]
  bridge: RunDto[]
  recent: RunSummaryDto[]
  mailboxNames: Map<string, string>
  filterNames: Map<string, string>
  launching: boolean
  cancellingId: string | null
}>()

const mailbox = defineModel<string>('mailbox', { required: true })

const emit = defineEmits<{ launch: []; cancel: [run: RunDto] }>()

const uid = useId()
</script>

<template>
  <BasePanel as="section" hero :aria-labelledby="`${uid}-title`">
    <div class="grid gap-6 xl:grid-cols-[3fr_1fr]">
      <div class="space-y-5">
        <div>
          <p class="stencil text-sm text-ink-muted">Ponte di lancio</p>
          <h2 :id="`${uid}-title`" class="font-condensed mt-1 text-2xl md:text-3xl">
            Avvia un giro
          </h2>
        </div>

        <form class="flex flex-wrap items-end gap-4" @submit.prevent="emit('launch')">
          <div class="min-w-56 flex-1">
            <label :for="`${uid}-mailbox`" class="block text-sm font-semibold">Casella</label>
            <select
              :id="`${uid}-mailbox`"
              v-model="mailbox"
              class="mt-1 min-h-11 w-full rounded-full border border-control-border bg-surface px-4"
            >
              <option value="">Tutte le caselle attive</option>
              <option v-for="item in mailboxes" :key="String(item.id)" :value="String(item.id)">
                {{ item.emailAddress }}
              </option>
            </select>
          </div>
          <div>
            <p class="stencil text-xs text-ink-muted" aria-hidden="true">Sortita</p>
            <BaseButton
              type="submit"
              :busy="launching"
              class="catapult mt-1"
              :class="{ 'catapult--charging': launching }"
            >
              <template #icon
                ><Rocket :size="20" :stroke-width="1.75" aria-hidden="true"
              /></template>
              Esegui ora
            </BaseButton>
          </div>
        </form>

        <section aria-label="Giri sul ponte">
          <p v-if="bridge.length === 0" class="text-ink-muted">
            Nessun giro in corso. Il cron avvia i giri da solo; «Esegui ora» ne lancia uno subito.
          </p>
          <TransitionGroup v-else name="sortie" tag="ul" class="grid gap-4 lg:grid-cols-2">
            <li v-for="run in bridge" :key="String(run.id)">
              <RunBridgeCard
                class="h-full"
                :run="run"
                :mailbox="mailboxName(run.mailboxId, mailboxNames)"
                :origin="runOriginText(run, filterNames)"
                :cancelling="cancellingId === String(run.id)"
                @cancel="emit('cancel', run)"
              />
            </li>
          </TransitionGroup>
        </section>
      </div>

      <section :aria-labelledby="`${uid}-recent`" class="xl:border-l xl:border-panel-line xl:pl-6">
        <h3 :id="`${uid}-recent`" class="stencil text-sm text-ink-muted">Ultimi giri</h3>
        <p v-if="recent.length === 0" class="mt-2 text-sm text-ink-muted">
          Nessun giro registrato.
        </p>
        <ol v-else class="mt-2 space-y-3">
          <li v-for="run in recent" :key="String(run.id)" class="space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-mono tabular text-sm">Giro {{ run.id }}</span>
              <RunStatusBadge :status="run.status" />
            </div>
            <p class="truncate text-sm text-ink-muted">
              {{ mailboxName(run.mailboxId, mailboxNames) }} ·
              <time :datetime="run.startedAtUtc">{{ formatDateTime(run.startedAtUtc) }}</time>
            </p>
          </li>
        </ol>
      </section>
    </div>
  </BasePanel>
</template>

<style scoped>
/* "Catapulta" (design.md, "Motion"): il pulsante si carica con una striscia che scorre. */
.catapult {
  position: relative;
  overflow: hidden;
}

.catapult--charging::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.45), transparent);
  transform: translateX(-100%);
  animation: catapult-charge 550ms ease-out forwards;
}

@keyframes catapult-charge {
  to {
    transform: translateX(100%);
  }
}

/* La card del giro scivola nel ponte: < 600 ms; con reduced-motion solo dissolvenza 150 ms. */
.sortie-enter-active {
  transition:
    transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 450ms ease-out;
}

.sortie-enter-from {
  opacity: 0;
  transform: translateX(-2.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .catapult--charging::after {
    display: none;
  }

  .sortie-enter-active {
    transition: opacity 150ms linear !important;
  }

  .sortie-enter-from {
    transform: none;
  }
}
</style>
