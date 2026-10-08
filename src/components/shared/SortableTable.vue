<script setup lang="ts" generic="Row extends Record<string, unknown>">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/vue'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  align?: 'start' | 'end'
}

export type SortDirection = 'ascending' | 'descending'

export interface SortState {
  key: string
  direction: SortDirection
}

const props = defineProps<{
  columns: TableColumn[]
  rows: Row[]
  rowKey: keyof Row & string
  /** Didascalia della tabella: obbligatoria per gli screen reader, può essere nascosta a schermo. */
  caption: string
  captionVisible?: boolean
}>()

const sort = defineModel<SortState | null>('sort', { default: null })

const collator = new Intl.Collator('it', { numeric: true, sensitivity: 'base' })

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  const na = typeof a === 'number' ? a : Number.NaN
  const nb = typeof b === 'number' ? b : Number.NaN
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  return collator.compare(String(a), String(b))
}

const sortedRows = computed(() => {
  const state = sort.value
  if (state === null) return props.rows
  const factor = state.direction === 'ascending' ? 1 : -1
  return [...props.rows].sort((x, y) => factor * compareValues(x[state.key], y[state.key]))
})

function ariaSort(column: TableColumn): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortable) return undefined
  return sort.value?.key === column.key ? sort.value.direction : 'none'
}

function toggleSort(column: TableColumn): void {
  const current = sort.value
  const direction: SortDirection =
    current?.key === column.key && current.direction === 'ascending' ? 'descending' : 'ascending'
  sort.value = { key: column.key, direction }
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-left">
      <caption :class="captionVisible ? 'pb-2 text-left font-semibold' : 'visually-hidden'">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr class="border-b border-control-border">
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :aria-sort="ariaSort(column)"
            class="px-3 py-2 text-sm font-semibold text-ink-muted"
            :class="column.align === 'end' ? 'text-right' : undefined"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="inline-flex min-h-11 items-center gap-1.5 font-semibold"
              @click="toggleSort(column)"
            >
              {{ column.label }}
              <ArrowUp
                v-if="sort?.key === column.key && sort.direction === 'ascending'"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
              <ArrowDown
                v-else-if="sort?.key === column.key"
                :size="16"
                :stroke-width="1.75"
                aria-hidden="true"
              />
              <ArrowUpDown v-else :size="16" :stroke-width="1.75" aria-hidden="true" />
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in sortedRows"
          :key="String(row[rowKey])"
          class="border-b border-panel-line last:border-b-0"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-3 py-2"
            :class="column.align === 'end' ? 'text-right font-mono tabular' : undefined"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
