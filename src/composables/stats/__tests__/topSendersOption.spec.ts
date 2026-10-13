import { describe, expect, it } from 'vitest'

import type { SenderOverviewDto } from '@/services/statsService'
import { formatDateTime } from '@/utils/formatDate'
import { topSendersOption, type ChartPalette } from '../topSendersOption'

const palette: ChartPalette = {
  bar: '#000',
  sent: '#111',
  text: '#222',
  muted: '#333',
  line: '#444',
  surface: '#555',
}

function sender(overrides: Partial<SenderOverviewDto> = {}): SenderOverviewDto {
  return {
    senderAddress: 'news@example.com',
    senderName: null,
    mailCount: 1234,
    sentCount: 0,
    firstReceivedAtUtc: '2025-01-01T08:00:00',
    firstSubject: null,
    lastReceivedAtUtc: '2026-10-13T19:10:00',
    lastSubject: null,
    ...overrides,
  }
}

function tooltipOf(senders: SenderOverviewDto[], dataIndex = 0) {
  return topSendersOption(senders, palette).tooltip.formatter({ dataIndex })
}

describe('tooltip della classifica', () => {
  it("mostra indirizzo, numero di mail e data e ora dell'ultima mail", () => {
    const text = tooltipOf([sender()])
    expect(text).toContain('news@example.com')
    expect(text).toContain('1.234 mail')
    expect(text).toContain(`Ultima: ${formatDateTime('2026-10-13T19:10:00')}`)
  })

  it("escapa l'indirizzo, perché il tooltip è HTML", () => {
    const text = tooltipOf([sender({ senderAddress: '<b>x@example.com' })])
    expect(text).toContain('&lt;b&gt;x@example.com')
    expect(text).not.toContain('<b>x@')
  })

  it('indice fuori dai dati: tooltip vuoto', () => {
    expect(tooltipOf([sender()], 5)).toBe('')
  })
})
