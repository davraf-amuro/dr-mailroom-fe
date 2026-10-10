import type { SenderOverviewDto } from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'

/** Colori del grafico letti dai token del tema (mai valori fissi). */
export interface ChartPalette {
  bar: string
  text: string
  muted: string
  line: string
  surface: string
}

/** Larghezza massima delle etichette dei mittenti: oltre si tronca, il nome completo è nel tooltip. */
export const SENDER_LABEL_WIDTH = 220
export const SENDER_LABEL_WIDTH_NARROW = 110

/** Opzioni ECharts della classifica: barre orizzontali, il più attivo in alto. */
export function topSendersOption(
  senders: SenderOverviewDto[],
  palette: ChartPalette,
  reducedMotion = false,
  labelWidth = SENDER_LABEL_WIDTH,
) {
  return {
    animation: !reducedMotion,
    animationDuration: 300,
    aria: { enabled: true },
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      backgroundColor: palette.surface,
      borderColor: palette.line,
      textStyle: { color: palette.text },
      valueFormatter: (value: unknown) => `${formatCount(Number(value))} mail`,
    },
    xAxis: {
      type: 'value',
      // I valori sono già sulle barre: niente etichette sull'asse, che si sovrapporrebbero su schermi stretti.
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: palette.line } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: senders.map((s) => s.senderAddress),
      axisLabel: {
        color: palette.text,
        width: labelWidth,
        overflow: 'truncate',
      },
      axisLine: { lineStyle: { color: palette.line } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        name: 'Mail',
        data: senders.map((s) => Number(s.mailCount)),
        itemStyle: { color: palette.bar },
        cursor: 'pointer',
        label: {
          show: true,
          position: 'right',
          color: palette.text,
          formatter: (params: { value: unknown }) => formatCount(Number(params.value)),
        },
      },
    ],
  }
}
