import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { ANNOUNCE_MIN_INTERVAL_MS, useThrottledAnnouncer } from '../useThrottledAnnouncer'

function setup() {
  const scope = effectScope()
  const announcer = scope.run(() => useThrottledAnnouncer())!
  return { ...announcer, scope }
}

describe('useThrottledAnnouncer (aria-live al massimo ogni 10 s)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('il primo annuncio esce subito', () => {
    const { message, announce, scope } = setup()
    announce('Giro 4: 500 mail lette')
    expect(message.value).toBe('Giro 4: 500 mail lette')
    scope.stop()
  })

  it('quelli ravvicinati si fondono nell’ultimo, che esce allo scadere dei 10 s', () => {
    const { message, announce, scope } = setup()
    announce('primo')
    vi.advanceTimersByTime(2_000)
    announce('secondo')
    announce('terzo')
    expect(message.value).toBe('primo')

    vi.advanceTimersByTime(ANNOUNCE_MIN_INTERVAL_MS - 2_001)
    expect(message.value).toBe('primo')
    vi.advanceTimersByTime(1)
    expect(message.value).toBe('terzo')
    scope.stop()
  })

  it('passati 10 s dall’ultimo annuncio il successivo esce subito', () => {
    const { message, announce, scope } = setup()
    announce('primo')
    vi.advanceTimersByTime(ANNOUNCE_MIN_INTERVAL_MS)
    announce('secondo')
    expect(message.value).toBe('secondo')
    scope.stop()
  })

  it('con lo scope chiuso l’annuncio in attesa non esce', () => {
    const { message, announce, scope } = setup()
    announce('primo')
    announce('in attesa')
    scope.stop()
    vi.advanceTimersByTime(ANNOUNCE_MIN_INTERVAL_MS * 2)
    expect(message.value).toBe('primo')
  })
})
