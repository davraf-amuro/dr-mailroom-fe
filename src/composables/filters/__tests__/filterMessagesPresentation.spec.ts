import { describe, expect, it } from 'vitest'

import {
  archiveBannerText,
  mailCountText,
  parseFilterMessagesState,
  toFilterMessagesQuery,
} from '../filterMessagesPresentation'

describe('parseFilterMessagesState / toFilterMessagesQuery', () => {
  it('legge id dal percorso, pagina e verso dalla query', () => {
    expect(parseFilterMessagesState('7', { page: '3', sortDir: 'Asc' })).toEqual({
      filterId: 7,
      sortDir: 'Asc',
      page: 3,
    })
  })

  it('valori mancanti o non validi → default; id non numerico → null', () => {
    expect(parseFilterMessagesState('abc', { page: '-1', sortDir: 'x' })).toEqual({
      filterId: null,
      sortDir: 'Desc',
      page: 1,
    })
    expect(parseFilterMessagesState(['7'], {}).filterId).toBeNull()
  })

  it('i default non finiscono nella query string', () => {
    expect(toFilterMessagesQuery({ filterId: 7, sortDir: 'Desc', page: 1 })).toEqual({
      sortDir: undefined,
      page: undefined,
    })
    expect(toFilterMessagesQuery({ filterId: 7, sortDir: 'Asc', page: 2 })).toEqual({
      sortDir: 'Asc',
      page: '2',
    })
  })
})

describe('testi', () => {
  it('conteggio al singolare e al plurale', () => {
    expect(mailCountText(1)).toBe('1 mail')
    expect(mailCountText(1234)).toBe('1.234 mail')
  })

  it('banner: nulla da archiviare → null', () => {
    expect(archiveBannerText(0, true)).toBeNull()
  })

  it('banner con il processo nel filtro invita ad archiviare', () => {
    expect(archiveBannerText(1, true)).toContain('1 mail non ha ancora il contenuto salvato')
    expect(archiveBannerText(3, true)).toContain('«Archivia le mancanti»')
  })

  it('banner senza il processo invita a modificare il filtro', () => {
    expect(archiveBannerText(3, false)).toContain('aggiungi «Salva il contenuto della mail»')
  })
})
