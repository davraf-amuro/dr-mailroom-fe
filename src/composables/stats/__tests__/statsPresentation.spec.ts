import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { heroSentence } from '../useStatsView'
import {
  ariaSortOf,
  createFilterLocation,
  nextSort,
  pageCount,
  subjectText,
  SUBJECT_MAX_CHARS,
} from '../statsPresentation'

describe('ordinamento della tabella', () => {
  it('colonna nuova: mittente dalla A, le altre dal valore più alto', () => {
    const current = { sortBy: 'MailCount', sortDir: 'Desc' } as const
    expect(nextSort(current, 'SenderAddress')).toEqual({ sortBy: 'SenderAddress', sortDir: 'Asc' })
    expect(nextSort(current, 'FirstReceivedAt')).toEqual({
      sortBy: 'FirstReceivedAt',
      sortDir: 'Desc',
    })
  })

  it('stessa colonna: inverte il verso', () => {
    expect(nextSort({ sortBy: 'MailCount', sortDir: 'Desc' }, 'MailCount').sortDir).toBe('Asc')
  })

  it('aria-sort solo sulla colonna attiva', () => {
    const current = { sortBy: 'LastReceivedAt', sortDir: 'Asc' } as const
    expect(ariaSortOf(current, 'LastReceivedAt')).toBe('ascending')
    expect(ariaSortOf(current, 'MailCount')).toBe('none')
  })
})

describe('oggetti e pagine', () => {
  it('oggetto lungo troncato con ellissi, vuoto con testo di ripiego', () => {
    const long = 'x'.repeat(SUBJECT_MAX_CHARS + 10)
    expect(subjectText(long)).toHaveLength(SUBJECT_MAX_CHARS)
    expect(subjectText(long).endsWith('…')).toBe(true)
    expect(subjectText(null)).toBe('(senza oggetto)')
    expect(subjectText('  ')).toBe('(senza oggetto)')
  })

  it('numero di pagine: almeno 1', () => {
    expect(pageCount(0, 25)).toBe(1)
    expect(pageCount(2440, 25)).toBe(98)
  })
})

describe('Crea filtro da questo mittente', () => {
  it('porta a /filters con il mittente codificato in ?sender=', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/filters', name: 'filters', component: { render: () => null } }],
    })
    const href = router.resolve(createFilterLocation('a+b@x.it')).fullPath
    expect(href).toBe('/filters?sender=a%2Bb@x.it')
    expect(router.resolve(href).query.sender).toBe('a+b@x.it')
  })
})

describe('frase della cella eroe', () => {
  it('totale, anno e quota del mittente più attivo', () => {
    expect(heroSentence(1000, '2025', { senderAddress: 'a@x.it', mailCount: 250 })).toEqual({
      headline: '1.000 mail nel 2025',
      detail: 'Il mittente più attivo, a@x.it, ne ha scritte 250 (25%).',
    })
  })

  it('senza mail niente quota', () => {
    expect(heroSentence(0, '', undefined)).toEqual({
      headline: '0 mail in archivio',
      detail: null,
    })
  })
})
