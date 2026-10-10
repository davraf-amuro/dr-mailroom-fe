<script setup lang="ts">
import { computed } from 'vue'
import { FilterIcon } from '@lucide/vue'

import BaseButton from '@/components/shared/BaseButton.vue'
import BaseDialog from '@/components/shared/BaseDialog.vue'
import ProgressMeter from '@/components/shared/ProgressMeter.vue'
import type { YearStatDto } from '@/services/statsService'
import type { LoadState } from '@/stores/stats'
import { formatCount } from '@/utils/formatNumber'

const props = defineProps<{
  senderAddress: string | null
  years: YearStatDto[]
  state: LoadState
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ createFilter: [senderAddress: string] }>()

const max = computed(() => Math.max(1, ...props.years.map((y) => Number(y.mailCount))))
const total = computed(() => props.years.reduce((sum, y) => sum + Number(y.mailCount), 0))

function width(count: number | string): string {
  return `${Math.max(2, (Number(count) / max.value) * 100)}%`
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="'Mail per anno'"
    :description="
      state === 'ready'
        ? `${senderAddress} · ${formatCount(total)} mail in tutto`
        : (senderAddress ?? undefined)
    "
  >
    <ProgressMeter v-if="state === 'loading'" label="Lettura del dettaglio" />
    <p v-else-if="state === 'empty'" class="text-ink-muted">Nessuna mail da questo mittente.</p>
    <p v-else-if="state === 'error'" class="text-ink-muted">Dettaglio non disponibile.</p>
    <table v-else class="w-full border-collapse text-left">
      <caption class="visually-hidden">
        Mail per anno da
        {{
          senderAddress
        }}
      </caption>
      <thead>
        <tr class="border-b border-control-border text-sm text-ink-muted">
          <th scope="col" class="px-2 py-2">Anno</th>
          <th scope="col" class="px-2 py-2 text-right">Mail</th>
          <th scope="col" class="w-1/2 px-2 py-2"><span class="visually-hidden">Barra</span></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in years"
          :key="String(item.year)"
          class="border-b border-panel-line last:border-b-0"
        >
          <th scope="row" class="px-2 py-1.5 font-mono font-normal tabular">{{ item.year }}</th>
          <td class="px-2 py-1.5 text-right font-mono tabular">
            {{ formatCount(Number(item.mailCount)) }}
          </td>
          <td class="px-2 py-1.5" aria-hidden="true">
            <span class="block h-3 bg-federal" :style="{ width: width(item.mailCount) }" />
          </td>
        </tr>
      </tbody>
    </table>
    <template v-if="senderAddress" #footer>
      <BaseButton variant="secondary" @click="emit('createFilter', senderAddress)">
        <template #icon><FilterIcon :size="20" :stroke-width="1.75" aria-hidden="true" /></template>
        Crea filtro da questo mittente
      </BaseButton>
    </template>
  </BaseDialog>
</template>
