import { describe, expect, it } from 'vitest'

import { parseRuntimeConfig, RuntimeConfigError } from '../runtimeConfig'

describe('parseRuntimeConfig', () => {
  it('accetta una configurazione valida e toglie la barra finale', () => {
    expect(parseRuntimeConfig({ apiBaseUrl: 'http://localhost:5180/', apiKey: 'k' })).toEqual({
      apiBaseUrl: 'http://localhost:5180',
      apiKey: 'k',
    })
  })

  it('rifiuta un indirizzo mancante o non valido', () => {
    expect(() => parseRuntimeConfig({ apiKey: 'k' })).toThrow(RuntimeConfigError)
    expect(() => parseRuntimeConfig({ apiBaseUrl: 'non un url', apiKey: 'k' })).toThrow(
      RuntimeConfigError,
    )
  })

  it('rifiuta una chiave non testuale e un contenuto non oggetto', () => {
    expect(() => parseRuntimeConfig({ apiBaseUrl: 'http://x', apiKey: 42 })).toThrow(
      RuntimeConfigError,
    )
    expect(() => parseRuntimeConfig('testo')).toThrow(RuntimeConfigError)
  })
})
