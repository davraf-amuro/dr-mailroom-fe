<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, FilterIcon } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import {
  ariaSortOf,
  sortColumns,
  subjectText,
  type SortColumn,
} from '@/composables/stats/statsPresentation'
import type {
  SenderOverviewDto,
  SenderOverviewSortBy,
  SortDirection,
} from '@/services/statsService'
import { formatDateTime } from '@/utils/formatDate'
import { formatCount } from '@/utils/formatNumber'

const props = defineProps<{
  rows: SenderOverviewDto[]
  sortBy: SenderOverviewSortBy
  sortDir: SortDirection
  /** Pagina in caricamento: la tabella resta visibile ma annunciata come occupata. */
  busy?: boolean
}>()

const emit = defineEmits<{
  sort: [sortBy: SenderOverviewSortBy]
  details: [senderAddress: string]
  createFilter: [senderAddress: string]
}>()

const headers: { column: SortColumn; label: string; align?: 'end' }[] = [
  { column: 'sender', label: 'Mittente' },
  { column: 'mailCount', label: 'Mail', align: 'end' },
  { column: 'last', label: 'Più recente' },
  { column: 'first', label: 'Più vecchia' },
]

function ariaSort(column: SortColumn) {
  return ariaSortOf({ sortBy: props.sortBy, sortDir: props.sortDir }, sortColumns[column])
}
</script>

<template>
  <div class="overflow-x-auto" :aria-busy="busy ? 'true' : undefined">
    <!-- Su schermi stretti la tabella scorre in orizzontale invece di spezzare gli indirizzi -->
    <table class="w-full min-w-[56rem] border-collapse text-left">
      <caption class="visually-hidden">
        Mittenti della casella: numero di mail, la più recente e la più vecchia
      </caption>
      <thead>
        <tr class="border-b border-control-border">
          <th
            v-for="header in headers"
            :key="header.column"
            scope="col"
            :aria-sort="ariaSort(header.column)"
            class="px-3 py-2 text-sm font-semibold text-ink-muted"
            :class="header.align === 'end' ? 'text-right' : undefined"
          >
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 font-semibold"
              @click="emit('sort', sortColumns[header.column])"
            >
              {{ header.label }}
              <ArrowUp
                v-if="ariaSort(header.column) === 'ascending'"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
              <ArrowDown
                v-else-if="ariaSort(header.column) === 'descending'"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
              <ArrowUpDown v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </th>
          <th scope="col" class="px-3 py-2 text-sm font-semibold text-ink-muted">
            <span class="visually-hidden">Azioni</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.senderAddress"
          class="border-b border-panel-line align-top last:border-b-0"
        >
          <th scope="row" class="max-w-72 px-3 py-2 text-left font-normal">
            <span class="block font-semibold break-words">{{ row.senderAddress }}</span>
            <span v-if="row.senderName" class="block text-sm text-ink-muted">{{
              row.senderName
            }}</span>
          </th>
          <td class="px-3 py-2 text-right font-mono tabular">
            {{ formatCount(Number(row.mailCount)) }}
          </td>
          <td class="max-w-80 px-3 py-2">
            <time :datetime="row.lastReceivedAtUtc" class="block text-sm whitespace-nowrap">{{
              formatDateTime(row.lastReceivedAtUtc)
            }}</time>
            <span class="block text-sm text-ink-muted" :title="row.lastSubject ?? undefined">{{
              subjectText(row.lastSubject)
            }}</span>
          </td>
          <td class="max-w-80 px-3 py-2">
            <time :datetime="row.firstReceivedAtUtc" class="block text-sm whitespace-nowrap">{{
              formatDateTime(row.firstReceivedAtUtc)
            }}</time>
            <span class="block text-sm text-ink-muted" :title="row.firstSubject ?? undefined">{{
              subjectText(row.firstSubject)
            }}</span>
          </td>
          <td class="px-3 py-2">
            <div class="flex flex-wrap justify-end gap-1">
              <BaseButton variant="ghost" @click="emit('details', row.senderAddress)">
                <template #icon
                  ><CalendarRange :size="20" :stroke-width="1.75" aria-hidden="true"
                /></template>
                Per anno<span class="visually-hidden">: {{ row.senderAddress }}</span>
              </BaseButton>
              <BaseButton variant="ghost" @click="emit('createFilter', row.senderAddress)">
                <template #icon
                  ><FilterIcon :size="20" :stroke-width="1.75" aria-hidden="true"
                /></template>
                Crea filtro<span class="visually-hidden"> da {{ row.senderAddress }}</span>
              </BaseButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
