<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { AriaComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'

import { useTheme } from '@/composables/shared/useTheme'
import {
  SENDER_LABEL_WIDTH,
  SENDER_LABEL_WIDTH_NARROW,
  topSendersOption,
  type ChartPalette,
} from '@/composables/stats/topSendersOption'
import type { SenderOverviewDto } from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'

use([BarChart, GridComponent, TooltipComponent, AriaComponent, SVGRenderer])

const props = defineProps<{
  senders: SenderOverviewDto[]
  /** "nel 2025" oppure "in archivio": completa il nome accessibile del grafico. */
  period: string
}>()

const emit = defineEmits<{ select: [senderAddress: string] }>()

const { isDark } = useTheme()
const motion = usePreferredReducedMotion()
const narrow = useMediaQuery('(max-width: 640px)')

function readPalette(): ChartPalette {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string) => style.getPropertyValue(name).trim()
  return {
    bar: token('--c-federal'),
    text: token('--c-ink'),
    muted: token('--c-ink-muted'),
    line: token('--c-panel-line'),
    surface: token('--c-surface'),
  }
}

// I token cambiano con il tema: si rileggono dopo l'aggiornamento dell'attributo data-theme.
const palette = ref<ChartPalette>(readPalette())
watch(isDark, () => requestAnimationFrame(() => (palette.value = readPalette())))

const option = computed(() =>
  topSendersOption(
    props.senders,
    palette.value,
    motion.value === 'reduce',
    narrow.value ? SENDER_LABEL_WIDTH_NARROW : SENDER_LABEL_WIDTH,
  ),
)
const height = computed(() => `${Math.max(160, props.senders.length * 30 + 40)}px`)

function onClick(params: { name?: string }): void {
  if (params.name) emit('select', params.name)
}
</script>

<template>
  <figure class="space-y-3">
    <figcaption class="visually-hidden">
      Classifica dei {{ senders.length }} mittenti con più mail {{ period }}. La stessa classifica è
      disponibile come tabella subito sotto.
    </figcaption>
    <VChart
      :option="option"
      :style="{ height }"
      autoresize
      role="img"
      :aria-label="`Grafico a barre dei ${senders.length} mittenti con più mail ${period}`"
      @click="onClick"
    />
    <details class="text-sm">
      <summary class="min-h-11 cursor-pointer py-2 font-semibold text-federal">
        Classifica come tabella
      </summary>
      <table class="mt-2 w-full border-collapse text-left">
        <caption class="visually-hidden">
          Mittenti con più mail
          {{
            period
          }}
        </caption>
        <thead>
          <tr class="border-b border-control-border">
            <th scope="col" class="px-3 py-2">#</th>
            <th scope="col" class="px-3 py-2">Mittente</th>
            <th scope="col" class="px-3 py-2 text-right">Mail</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(sender, index) in senders"
            :key="sender.senderAddress"
            class="border-b border-panel-line last:border-b-0"
          >
            <td class="px-3 py-1 font-mono tabular">{{ index + 1 }}</td>
            <th scope="row" class="px-3 py-1 text-left font-normal">
              <button
                type="button"
                class="min-h-11 text-left break-all text-federal underline"
                @click="emit('select', sender.senderAddress)"
              >
                {{ sender.senderAddress }}
              </button>
            </th>
            <td class="px-3 py-1 text-right font-mono tabular">
              {{ formatCount(Number(sender.mailCount)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
