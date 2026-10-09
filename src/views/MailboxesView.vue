<script setup lang="ts">
import { useRoute } from 'vue-router'
import { LayoutGrid, RefreshCw, Table2 } from '@lucide/vue'

import MailboxCard from '@/components/mailboxes/MailboxCard.vue'
import MailboxDetailDialog from '@/components/mailboxes/MailboxDetailDialog.vue'
import MailboxesEmptyHangar from '@/components/mailboxes/MailboxesEmptyHangar.vue'
import MailboxesHero from '@/components/mailboxes/MailboxesHero.vue'
import MailboxSearch from '@/components/mailboxes/MailboxSearch.vue'
import MailboxTable from '@/components/mailboxes/MailboxTable.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { DELETE_CONFIRM_TEXT, useMailboxesView } from '@/composables/mailboxes/useMailboxesView'

const route = useRoute()

const {
  items,
  loadState,
  hasFilter,
  counts,
  busy,
  connecting,
  notice,
  clearNotice,
  reload,
  layout,
  searchEmail,
  searchStatus,
  highlightId,
  connect,
  pause,
  resume,
  pendingDelete,
  deleteOpen,
  deleteBusy,
  askDelete,
  confirmDelete,
  detail,
  detailLoading,
  detailOpen,
  openDetails,
} = useMailboxesView()
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline" />

  <InlineNotice
    class="mb-6"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />

  <ProgressMeter
    v-if="loadState === 'loading' && items.length === 0"
    label="Lettura delle caselle"
    class="max-w-md"
  />

  <MailboxesEmptyHangar
    v-else-if="loadState === 'empty' && !hasFilter"
    :connecting="connecting"
    @connect="connect()"
  />

  <EmptyState
    v-else-if="loadState === 'error' && items.length === 0"
    title="Caselle non disponibili"
    description="Il servizio non ha restituito l'elenco: controlla il banner in alto."
  >
    <template #actions>
      <BaseButton variant="secondary" @click="reload()">
        <template #icon><RefreshCw :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Riprova
      </BaseButton>
    </template>
  </EmptyState>

  <div v-else class="space-y-6">
    <MailboxesHero :counts="counts" :connecting="connecting" @connect="connect()" />

    <div class="flex flex-wrap items-end justify-between gap-4">
      <MailboxSearch
        v-model:email-address="searchEmail"
        v-model:status="searchStatus"
        class="flex-1"
      />
      <div class="flex gap-1" role="group" aria-label="Visualizzazione">
        <button
          type="button"
          class="layout-toggle"
          :aria-pressed="layout === 'cards'"
          @click="layout = 'cards'"
        >
          <LayoutGrid :size="20" :stroke-width="1.75" aria-hidden="true" />
          Card
        </button>
        <button
          type="button"
          class="layout-toggle"
          :aria-pressed="layout === 'table'"
          @click="layout = 'table'"
        >
          <Table2 :size="20" :stroke-width="1.75" aria-hidden="true" />
          Tabella
        </button>
      </div>
    </div>

    <EmptyState
      v-if="loadState === 'empty'"
      title="Nessuna casella per i filtri scelti"
      description="Cambia indirizzo o stato per vedere le altre caselle."
    />

    <section v-else-if="layout === 'cards'" aria-label="Unità in hangar">
      <ul class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="mailbox in items" :key="mailbox.id">
          <MailboxCard
            class="h-full"
            :mailbox="mailbox"
            :busy="busy[String(mailbox.id)]"
            :reconnecting="connecting"
            :highlight="highlightId === String(mailbox.id)"
            @pause="pause(mailbox.id)"
            @resume="resume(mailbox.id)"
            @reconnect="connect()"
            @remove="askDelete(mailbox)"
            @details="openDetails(mailbox.id)"
          />
        </li>
      </ul>
    </section>

    <div v-else class="border border-panel-line bg-surface">
      <MailboxTable
        :mailboxes="items"
        :busy="busy"
        :reconnecting="connecting"
        @pause="pause"
        @resume="resume"
        @reconnect="connect()"
        @remove="askDelete"
        @details="openDetails"
      />
    </div>
  </div>

  <ConfirmDialog
    v-model:open="deleteOpen"
    :title="`Eliminare ${pendingDelete?.emailAddress ?? 'la casella'}?`"
    :description="DELETE_CONFIRM_TEXT"
    confirm-label="Elimina"
    tone="danger"
    :busy="deleteBusy"
    @confirm="confirmDelete()"
  />

  <MailboxDetailDialog v-model:open="detailOpen" :mailbox="detail" :loading="detailLoading" />
</template>

<style scoped>
.layout-toggle {
  display: inline-flex;
  min-height: var(--hit-target-min);
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--c-control-border);
  background: var(--c-surface);
  padding-inline: 0.875rem;
  font-weight: 600;
  color: var(--c-ink-muted);
}

.layout-toggle[aria-pressed='true'] {
  border-color: var(--c-federal);
  background: var(--c-federal);
  color: var(--c-on-federal);
}
</style>
