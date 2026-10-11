import type { SenderOverviewDto } from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'
import { hasSentMail, sentLabel } from './statsPresentation'

/** Colori del grafico letti dai token del tema (mai valori fissi). */
export interface ChartPalette {
  bar: string
  /** Barra di un mittente con posta inviata: colore neutro + tratteggio, mai il solo colore. */
  sent: string
  text: string
  muted: string
  line: string
  surface: string
}

/** Larghezza massima delle etichette dei mittenti: oltre si tronca, il nome completo è nel tooltip. */
export const SENDER_LABEL_WIDTH = 220
export const SENDER_LABEL_WIDTH_NARROW = 110

/** Margine destro per il valore sulla barra; più largo se una barra porta anche il segno di posta inviata. */
export const VALUE_LABEL_MARGIN = 56
export const VALUE_LABEL_MARGIN_SENT = 170

/** Opzioni ECharts della classifica: barre orizzontali, il più attivo in alto. */
export function topSendersOption(
  senders: SenderOverviewDto[],
  palette: ChartPalette,
  reducedMotion = false,
  labelWidth = SENDER_LABEL_WIDTH,
  /** Su schermi stretti il testo "Posta inviata" schiaccerebbe le barre: resta tratteggio + colore, il testo è nella tabella. */
  sentText = true,
) {
  const widenForSentText = sentText && senders.some(hasSentMail)

  return {
    animation: !reducedMotion,
    animationDuration: 300,
    aria: { enabled: true },
    grid: {
      left: 8,
      right: widenForSentText ? VALUE_LABEL_MARGIN_SENT : VALUE_LABEL_MARGIN,
      top: 8,
      bottom: 8,
      containLabel: true,
    },
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
        // Tratteggio solo sulle barre con posta inviata: decal per elemento (a livello di serie ECharts 6 non accetta 'none')
        data: senders.map((s) =>
          hasSentMail(s)
            ? {
                value: Number(s.mailCount),
                itemStyle: {
                  color: palette.sent,
                  decal: {
                    symbol: 'rect',
                    color: palette.surface,
                    dashArrayX: [1, 0],
                    dashArrayY: [2, 4],
                    rotation: -Math.PI / 4,
                  },
                },
              }
            : Number(s.mailCount),
        ),
        itemStyle: { color: palette.bar },
        cursor: 'pointer',
        label: {
          show: true,
          position: 'right',
          color: palette.text,
          // Il segno di posta inviata è anche testo accanto al valore
          formatter: (params: { value: unknown; dataIndex: number }) => {
            const sender = senders[params.dataIndex]
            const label = sentText && sender ? sentLabel(sender) : null
            const count = formatCount(Number(params.value))
            return label === null ? count : `${count} · ${label}`
          },
        },
      },
    ],
  }
}
