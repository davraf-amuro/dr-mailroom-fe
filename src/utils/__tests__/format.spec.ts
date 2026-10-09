import { describe, expect, it } from 'vitest'

import { parseUtc } from '../formatDate'
import { formatSerial } from '../formatSerial'

describe('formatSerial', () => {
  it('matricola a 4 cifre', () => {
    expect(formatSerial(3)).toBe('MR-0003')
    expect(formatSerial('42')).toBe('MR-0042')
    expect(formatSerial(12345)).toBe('MR-12345')
  })
})

describe('parseUtc', () => {
  it('una data senza fuso è UTC, non ora locale', () => {
    expect(parseUtc('2026-10-08T19:45:17.1889184')?.toISOString()).toBe('2026-10-08T19:45:17.188Z')
  })

  it('rispetta il fuso esplicito', () => {
    expect(parseUtc('2026-10-08T22:08:29+00:00')?.toISOString()).toBe('2026-10-08T22:08:29.000Z')
    expect(parseUtc('2026-10-08T22:08:29Z')?.toISOString()).toBe('2026-10-08T22:08:29.000Z')
  })

  it('valori assenti o non validi → null', () => {
    expect(parseUtc(null)).toBeNull()
    expect(parseUtc('')).toBeNull()
    expect(parseUtc('non una data')).toBeNull()
  })
})
