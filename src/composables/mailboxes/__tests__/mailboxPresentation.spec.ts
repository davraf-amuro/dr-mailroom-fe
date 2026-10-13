import { describe, expect, it } from 'vitest'

import {
  BACKFILL_MAX_PERCENT_IN_PROGRESS,
  backfillProgress,
  currentRunText,
  lastErrorContext,
  lastRunText,
} from '../mailboxPresentation'

describe('backfillProgress', () => {
  it('totale noto → barra determinata con numeri e percentuale', () => {
    expect(backfillProgress({ messagesIndexed: 13000, messagesTotal: 48200 })).toEqual({
      value: 13000,
      max: 48200,
      valueText: '13.000 / ~48.200 mail · 26%',
    })
  })

  it('totale assente → barra indeterminata con il solo conteggio', () => {
    expect(backfillProgress({ messagesIndexed: 26500, messagesTotal: null })).toEqual({
      value: 26500,
      valueText: '26.500 mail lette',
    })
  })

  it('in corso non arriva mai al 100%, anche oltre il totale Gmail', () => {
    const progress = backfillProgress({ messagesIndexed: 50000, messagesTotal: 48200 })
    expect(progress.max).toBe(50000)
    expect(progress.valueText).toContain(`${BACKFILL_MAX_PERCENT_IN_PROGRESS}%`)
  })

  it('accetta i numeri come stringa (formato OpenAPI di .NET)', () => {
    expect(backfillProgress({ messagesIndexed: '500', messagesTotal: '1000' }).valueText).toBe(
      '500 / ~1.000 mail · 50%',
    )
  })
})

describe('lastErrorContext', () => {
  it('giro noto → "Giro N · data"', () => {
    expect(
      lastErrorContext({ lastErrorRunId: 3, lastRunAtUtc: '2026-10-08T19:45:17.1889184' }),
    ).toMatch(/^Giro 3 · .+2026/)
  })

  it('giro non noto (errori precedenti) → solo la data', () => {
    const text = lastErrorContext({ lastErrorRunId: null, lastRunAtUtc: '2026-10-08T19:45:17Z' })
    expect(text).not.toContain('Giro')
    expect(text).toContain('2026')
  })
})

describe('currentRunText', () => {
  it('riporta numero del giro e mail lette', () => {
    const text = currentRunText({ id: 9, startedAtUtc: '2026-10-09T17:30:00Z', messagesRead: 1500 })
    expect(text).toMatch(/^Giro 9 · dal .+ · 1\.500 mail lette in questo giro$/)
  })
})

describe('lastRunText', () => {
  it('data e conteggio → "data · N mail lette"', () => {
    const text = lastRunText({ lastRunAtUtc: '2026-10-13T18:45:00Z', lastRunMessagesRead: 1234 })
    expect(text).toMatch(/2026.* · 1\.234 mail lette$/)
  })

  it('nessun giro concluso → "Mai"', () => {
    expect(lastRunText({ lastRunAtUtc: null, lastRunMessagesRead: null })).toBe('Mai')
  })

  it('conteggio assente → solo la data', () => {
    const text = lastRunText({ lastRunAtUtc: '2026-10-13T18:45:00Z', lastRunMessagesRead: null })
    expect(text).toContain('2026')
    expect(text).not.toContain('mail lette')
  })
})
