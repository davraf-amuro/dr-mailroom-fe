<script setup lang="ts">
import { useRoute } from 'vue-router'
import { RefreshCw } from '@lucide/vue'

import AttachmentsDialog from '@/components/filters/AttachmentsDialog.vue'
import FilterBuilder from '@/components/filters/FilterBuilder.vue'
import FilterCard from '@/components/filters/FilterCard.vue'
import FilterPreviewPanel from '@/components/filters/FilterPreviewPanel.vue'
import FilterSearch from '@/components/filters/FilterSearch.vue'
import ReapplyDialog from '@/components/filters/ReapplyDialog.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { mailboxLabel } from '@/composables/filters/filterPresentation'
import { DELETE_CONFIRM_TEXT, useFiltersView } from '@/composables/filters/useFiltersView'

const route = useRoute()

const {
  items,
  loadState,
  hasFilter,
  notice,
  clearNotice,
  reload,
  mailboxes,
  mailboxNames,
  builder,
  searchName,
  searchSender,
  searchMailbox,
  searchEnabled,
  pendingDelete,
  deletingId,
  deleteOpen,
  deleteBusy,
  askDelete,
  confirmDelete,
  reapply,
  attachments,
} = useFiltersView()
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline" />

  <InlineNotice
    class="mb-4"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />

  <div class="space-y-4">
    <section aria-label="Costruttore di filtri" class="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <BasePanel hero>
        <FilterBuilder
          v-model:form="builder.form"
          v-model:mode="builder.mode.value"
          :errors="builder.errors.value"
          :mailboxes="mailboxes"
          :editing-name="builder.editing.value?.name ?? null"
          :saving="builder.saving.value"
          :preview-busy="builder.previewBusy.value"
          :focus-token="builder.focusToken.value"
          @submit="builder.submit()"
          @preview="builder.runPreview()"
          @cancel="builder.reset()"
        />
      </BasePanel>
      <FilterPreviewPanel
        :preview="builder.preview.value"
        :busy="builder.previewBusy.value"
        :requested="builder.previewed.value"
        @attachments="attachments.show"
      />
    </section>

    <ProgressMeter
      v-if="loadState === 'loading' && items.length === 0"
      label="Lettura dei filtri"
      class="max-w-md"
    />

    <EmptyState
      v-else-if="loadState === 'error' && items.length === 0"
      title="Filtri non disponibili"
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

    <template v-else>
      <FilterSearch
        v-model:name="searchName"
        v-model:sender="searchSender"
        v-model:mailbox="searchMailbox"
        v-model:enabled="searchEnabled"
        :mailboxes="mailboxes"
      />

      <EmptyState
        v-if="loadState === 'empty' && !hasFilter"
        title="Nessuna regola d'ingaggio"
        description="Crea il primo filtro con il costruttore qui sopra: dice quali mail lavorare e con quali processi."
      />
      <EmptyState
        v-else-if="loadState === 'empty'"
        title="Nessun filtro per la ricerca"
        description="Cambia nome, mittente, casella o stato per vedere gli altri filtri."
      />

      <section v-else aria-label="Filtri esistenti">
        <ul class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <li v-for="filter in items" :key="String(filter.id)">
            <FilterCard
              class="h-full"
              :filter="filter"
              :mailbox="mailboxLabel(filter.mailboxId, mailboxNames)"
              :deleting="deletingId === String(filter.id)"
              @edit="builder.startEdit(filter)"
              @reapply="reapply.ask(filter)"
              @remove="askDelete(filter)"
            />
          </li>
        </ul>
      </section>
    </template>
  </div>

  <ConfirmDialog
    v-model:open="deleteOpen"
    :title="`Eliminare «${pendingDelete?.name ?? 'il filtro'}»?`"
    :description="DELETE_CONFIRM_TEXT"
    confirm-label="Elimina"
    tone="danger"
    :busy="deleteBusy"
    @confirm="confirmDelete()"
  />

  <ReapplyDialog
    v-model:open="reapply.open.value"
    v-model:selected="reapply.selected.value"
    :filter="reapply.target.value"
    :busy="reapply.busy.value"
    :error="reapply.error.value"
    @confirm="reapply.confirm()"
  />

  <AttachmentsDialog
    v-model:open="attachments.open.value"
    :message="attachments.message.value"
    :state="attachments.state.value"
    :items="attachments.items.value"
  />
</template>
