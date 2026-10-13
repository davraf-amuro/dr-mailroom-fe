<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArchiveRestore, ArrowLeft, RefreshCw } from '@lucide/vue'

import FilterMessagesTable from '@/components/filters/FilterMessagesTable.vue'
import MessageTextDialog from '@/components/filters/MessageTextDialog.vue'
import ReapplyDialog from '@/components/filters/ReapplyDialog.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import PaginationNav from '@/components/shared/PaginationNav.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { archiveBannerText, mailCountText } from '@/composables/filters/filterMessagesPresentation'
import { useFilterMessages } from '@/composables/filters/useFilterMessages'
import { useFilterReapply } from '@/composables/filters/useFilterReapply'
import { FILTERS_ROUTE_NAME } from '@/router/routes/filters'
import { ProcessTypeValue } from '@/services/filtersService'

const route = useRoute()

const {
  state,
  filter,
  rows,
  totalCount,
  missingArchiveCount,
  hasContentArchive,
  loadState,
  filterMissing,
  pages,
  textState,
  notice,
  clearNotice,
  reload,
  setPage,
  toggleSort,
  download,
  isDownloading,
  openText,
  closeText,
} = useFilterMessages()

const reapply = useFilterReapply()

const firstLoad = computed(() => loadState.value === 'loading' && rows.value.length === 0)
const filterName = computed(() => filter.value?.name ?? 'filtro')
const liveMessage = computed(() =>
  loadState.value === 'ready' || loadState.value === 'empty'
    ? `${mailCountText(totalCount.value)} trovate`
    : '',
)
const banner = computed(() =>
  loadState.value === 'ready'
    ? archiveBannerText(missingArchiveCount.value, hasContentArchive.value)
    : null,
)

/** Riapplica limitata al salvataggio del contenuto: gli altri processi restano selezionabili ma spenti. */
function archiveMissing(): void {
  if (filter.value === null) return
  reapply.ask(filter.value)
  reapply.selected.value = [ProcessTypeValue.ContentArchive]
}

const textOpen = computed({
  get: () => textState.open,
  set: (value: boolean) => {
    if (!value) closeText()
  },
})
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline">
    <template #actions>
      <RouterLink
        :to="{ name: FILTERS_ROUTE_NAME }"
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-control-border px-4 font-semibold"
      >
        <ArrowLeft :size="20" :stroke-width="1.75" aria-hidden="true" />
        Torna ai filtri
      </RouterLink>
    </template>
  </PageHeading>

  <InlineNotice
    class="mb-4"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />
  <LiveRegion :message="liveMessage" />

  <EmptyState
    v-if="filterMissing"
    title="Filtro non trovato"
    description="Il filtro del link non esiste: aprilo di nuovo dall'elenco dei filtri."
  />

  <section v-else aria-labelledby="filter-messages-title" class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <p class="stencil text-sm text-ink-muted">Filtro</p>
        <h2 id="filter-messages-title" class="font-condensed mt-1 text-2xl break-words">
          {{ filterName }}
        </h2>
        <p v-if="filter" class="mt-1 font-mono text-sm break-words text-ink-muted">
          {{ filter.senderAddress }}
        </p>
      </div>
      <p v-if="loadState === 'ready'" class="font-mono tabular text-sm text-ink-muted">
        {{ mailCountText(totalCount) }}
      </p>
    </div>

    <div
      v-if="banner"
      class="flex flex-wrap items-center justify-between gap-3 border border-panel-line bg-surface px-4 py-3"
    >
      <p class="min-w-0 flex-1">{{ banner }}</p>
      <BaseButton v-if="hasContentArchive" variant="secondary" @click="archiveMissing()">
        <template #icon
          ><ArchiveRestore :size="20" :stroke-width="1.75" aria-hidden="true"
        /></template>
        Archivia le mancanti
      </BaseButton>
      <RouterLink
        v-else
        :to="{ name: FILTERS_ROUTE_NAME }"
        class="inline-flex min-h-11 items-center gap-2 rounded-full border border-control-border px-4 font-semibold"
      >
        Modifica il filtro
      </RouterLink>
    </div>

    <ProgressMeter v-if="firstLoad" label="Lettura delle mail del filtro" class="max-w-md" />

    <EmptyState
      v-else-if="loadState === 'error' && rows.length === 0"
      title="Mail non disponibili"
      description="Il servizio non ha restituito i dati: controlla l'avviso in alto."
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
      v-else-if="loadState === 'empty'"
      title="Nessuna mail per questo filtro"
      description="Tra le mail già lette nessuna corrisponde al mittente e alla condizione del filtro."
    />

    <template v-else-if="rows.length > 0">
      <div class="border border-panel-line bg-surface">
        <FilterMessagesTable
          :rows="rows"
          :filter-name="filterName"
          :sort-dir="state.sortDir"
          :busy="loadState === 'loading'"
          :is-downloading="isDownloading"
          @toggle-sort="toggleSort"
          @show-text="openText"
          @download="download"
        />
      </div>
      <PaginationNav
        v-if="pages > 1"
        :page="state.page"
        :pages="pages"
        label="Pagine delle mail del filtro"
        :busy="loadState === 'loading'"
        @change="setPage"
      />
    </template>
  </section>

  <MessageTextDialog
    v-model:open="textOpen"
    :message="textState.message"
    :loading="textState.loading"
    :text="textState.text"
    :error="textState.error"
  />
  <ReapplyDialog
    v-model:open="reapply.open.value"
    v-model:selected="reapply.selected.value"
    :filter="reapply.target.value"
    :busy="reapply.busy.value"
    :error="reapply.error.value"
    @confirm="reapply.confirm()"
  />
</template>
