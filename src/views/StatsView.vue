<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RefreshCw } from '@lucide/vue'

import SenderDetailDialog from '@/components/stats/SenderDetailDialog.vue'
import SenderOverviewTable from '@/components/stats/SenderOverviewTable.vue'
import StatsToolbar from '@/components/stats/StatsToolbar.vue'
import TopSendersChart from '@/components/stats/TopSendersChart.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BasePanel from '@/components/shared/BasePanel.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import InlineNotice from '@/components/shared/InlineNotice.vue'
import LiveRegion from '@/components/shared/LiveRegion.vue'
import PageHeading from '@/components/shared/PageHeading.vue'
import PaginationNav from '@/components/shared/PaginationNav.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import { useStatsView } from '@/composables/stats/useStatsView'
import { formatCount } from '@/utils/formatNumber'

const route = useRoute()

const {
  mailboxes,
  mailboxId,
  years,
  year,
  searchText,
  filtered,
  sortBy,
  sortDir,
  page,
  pages,
  rows,
  totalCount,
  loadState,
  top,
  hero,
  liveMessage,
  detailOpen,
  detailAddress,
  detailYears,
  detailState,
  notice,
  clearNotice,
  reload,
  changeMailbox,
  changeYear,
  sort,
  setPage,
  openDetail,
  focusSender,
  createFilter,
} = useStatsView()

const period = computed(() => (year.value === '' ? 'in archivio' : `nel ${year.value}`))
const firstLoad = computed(() => loadState.value === 'loading' && rows.value.length === 0)
</script>

<template>
  <PageHeading :title="route.meta.title" :overline="route.meta.overline" />

  <InlineNotice
    class="mb-6"
    :tone="notice?.tone ?? null"
    :text="notice?.text ?? null"
    @dismiss="clearNotice()"
  />
  <LiveRegion :message="liveMessage" />

  <EmptyState
    v-if="mailboxes.length === 0 && loadState === 'empty'"
    title="Nessuna casella collegata"
    description="Le statistiche compaiono dopo il primo giro su una casella."
  />

  <div v-else class="space-y-6">
    <BasePanel as="section" hero aria-labelledby="stats-hero-title">
      <p class="stencil text-sm text-ink-muted">Rapporto di intelligence</p>
      <h2 id="stats-hero-title" class="font-condensed mt-1 text-2xl md:text-3xl">
        <span class="text-federal">{{ hero.headline }}</span>
      </h2>
      <p v-if="hero.detail" class="mt-2 max-w-prose text-ink-muted">{{ hero.detail }}</p>
      <p class="mt-2 max-w-prose text-sm text-ink-muted">
        Contano <strong>tutte</strong> le mail lette, non solo quelle filtrate. Il mittente è sempre
        il suo indirizzo email.
      </p>
    </BasePanel>

    <StatsToolbar
      v-model:search="searchText"
      :mailboxes="mailboxes"
      :years="years"
      :mailbox-id="mailboxId"
      :year="year"
      @mailbox="changeMailbox"
      @year="changeYear"
    />

    <section v-if="top.length > 0" aria-labelledby="stats-top-title" class="space-y-3">
      <div>
        <p class="stencil text-sm text-ink-muted">Classifica</p>
        <h2 id="stats-top-title" class="font-condensed mt-1 text-2xl">
          I {{ top.length }} mittenti più attivi {{ period }}
        </h2>
        <p class="text-sm text-ink-muted">
          Seleziona una barra per cercare il mittente in tabella.
        </p>
      </div>
      <div class="border border-panel-line bg-surface p-4">
        <TopSendersChart :senders="top" :period="period" @select="focusSender" />
      </div>
    </section>

    <section aria-labelledby="stats-table-title" class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p class="stencil text-sm text-ink-muted">Schedario</p>
          <h2 id="stats-table-title" class="font-condensed mt-1 text-2xl">Mittenti</h2>
        </div>
        <p v-if="loadState === 'ready'" class="font-mono tabular text-sm text-ink-muted">
          {{ formatCount(totalCount) }} mittenti
        </p>
      </div>

      <ProgressMeter v-if="firstLoad" label="Lettura delle statistiche" class="max-w-md" />

      <EmptyState
        v-else-if="loadState === 'error' && rows.length === 0"
        title="Statistiche non disponibili"
        description="Il servizio non ha restituito i dati: controlla il banner in alto."
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
        v-else-if="loadState === 'empty' && filtered"
        title="Nessun mittente per la ricerca"
        description="Cambia il testo cercato o l'anno."
      />
      <EmptyState
        v-else-if="loadState === 'empty' && year !== ''"
        title="Nessuna mail in questo anno"
        description="Scegli un altro anno o «Tutti»."
      />
      <EmptyState
        v-else-if="loadState === 'empty'"
        title="Nessuna mail per questa casella"
        description="Le statistiche compaiono dopo il primo giro di lettura."
      />

      <template v-else>
        <div class="border border-panel-line bg-surface">
          <SenderOverviewTable
            :rows="rows"
            :sort-by="sortBy"
            :sort-dir="sortDir"
            :busy="loadState === 'loading'"
            @sort="sort"
            @details="openDetail"
            @create-filter="createFilter"
          />
        </div>
        <PaginationNav
          v-if="pages > 1"
          :page="page"
          :pages="pages"
          label="Pagine dei mittenti"
          :busy="loadState === 'loading'"
          @change="setPage"
        />
      </template>
    </section>
  </div>

  <SenderDetailDialog
    v-model:open="detailOpen"
    :sender-address="detailAddress"
    :years="detailYears"
    :state="detailState"
    @create-filter="createFilter"
  />
</template>
