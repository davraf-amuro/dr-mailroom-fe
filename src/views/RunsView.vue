<script setup lang="ts">
import { useRoute } from 'vue-router'
import { CircleStop, History, RefreshCw } from '@lucide/vue'

import RunHistoryFilters from '@/components/runs/RunHistoryFilters.vue'
import RunHistoryTable from '@/components/runs/RunHistoryTable.vue'
import RunLaunchPad from '@/components/runs/RunLaunchPad.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { useRunsView } from '@/composables/runs/useRunsView'
import { CANCEL_CONFIRM_TEXT } from '@/stores/runs'

const route = useRoute()

const {
  history,
  loadState,
  hasFilter,
  focused,
  skippedMailboxNames,
  showFullHistory,
  bridge,
  recent,
  mailboxes,
  launchableMailboxes,
  mailboxNames,
  filterNames,
  launchMailbox,
  launching,
  launch,
  cancellingId,
  cancellingAll,
  cancelOpen,
  cancelBusy,
  cancelTitle,
  askCancel,
  askCancelAll,
  confirmCancel,
  filterMailbox,
  filterTrigger,
  filterStatus,
  filterFrom,
  filterTo,
  notice,
  clearNotice,
  reload,
  liveMessage,
} = useRunsView()
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline" />

  <InlineNotice
    class="mb-4"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />
  <!-- Avanzamento dei giri per gli screen reader: al massimo un annuncio ogni 10 s -->
  <LiveRegion :message="liveMessage" />

  <div class="space-y-4">
    <RunLaunchPad
      v-model:mailbox="launchMailbox"
      :mailboxes="launchableMailboxes"
      :bridge="bridge"
      :recent="recent"
      :mailbox-names="mailboxNames"
      :filter-names="filterNames"
      :launching="launching"
      :cancelling-id="cancellingId"
      @launch="launch()"
      @cancel="askCancel"
    />

    <section aria-labelledby="runs-history-title" class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="stencil text-sm text-ink-muted">Registro dei giri</p>
          <h2 id="runs-history-title" class="font-condensed mt-1 text-2xl">Cronologia</h2>
        </div>
        <BaseButton variant="danger-ghost" :busy="cancellingAll" @click="askCancelAll()">
          <template #icon
            ><CircleStop :size="20" :stroke-width="1.75" aria-hidden="true"
          /></template>
          Annulla tutti
        </BaseButton>
      </div>

      <div
        v-if="focused"
        class="flex flex-wrap items-center justify-between gap-3 border border-l-4 border-federal bg-surface px-4 py-3"
      >
        <p class="min-w-0 flex-1 basis-64">
          Giri avviati dalla riapplica.
          <template v-if="skippedMailboxNames.length > 0">
            Caselle saltate perché già al lavoro: {{ skippedMailboxNames.join(', ') }}.
          </template>
        </p>
        <BaseButton variant="secondary" @click="showFullHistory()">
          <template #icon><History :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
          Tutta la cronologia
        </BaseButton>
      </div>

      <RunHistoryFilters
        v-else
        v-model:mailbox="filterMailbox"
        v-model:trigger="filterTrigger"
        v-model:status="filterStatus"
        v-model:from="filterFrom"
        v-model:to="filterTo"
        :mailboxes="mailboxes"
      />

      <ProgressMeter
        v-if="loadState === 'loading' && history.length === 0"
        label="Lettura della cronologia"
        class="max-w-md"
      />

      <EmptyState
        v-else-if="loadState === 'error' && history.length === 0"
        title="Cronologia non disponibile"
        description="Il servizio non ha restituito l'elenco: controlla il banner in alto."
      >
        <template #actions>
          <BaseButton variant="secondary" @click="reload()">
            <template #icon
              ><RefreshCw :size="20" :stroke-width="1.75" aria-hidden="true"
            /></template>
            Riprova
          </BaseButton>
        </template>
      </EmptyState>

      <EmptyState
        v-else-if="loadState === 'empty' && (hasFilter || focused)"
        title="Nessun giro per i filtri scelti"
        description="Cambia casella, origine, stato o date per vedere gli altri giri."
      />
      <EmptyState
        v-else-if="loadState === 'empty'"
        title="Diario di bordo vuoto"
        description="Nessun giro registrato: il primo parte dal cron o da «Esegui ora»."
      />

      <div v-else class="border border-panel-line bg-surface">
        <RunHistoryTable
          :runs="history"
          :mailbox-names="mailboxNames"
          :filter-names="filterNames"
        />
      </div>
    </section>
  </div>

  <ConfirmDialog
    v-model:open="cancelOpen"
    :title="cancelTitle"
    :description="CANCEL_CONFIRM_TEXT"
    confirm-label="Conferma annullamento"
    cancel-label="Lascia proseguire"
    tone="danger"
    :busy="cancelBusy"
    @confirm="confirmCancel()"
  />
</template>
