import { describe, expect, it } from 'vitest'

import { fileNameFromDisposition } from '../messagesService'

describe('fileNameFromDisposition', () => {
  it('preferisce la forma RFC 5987 (filename*), decodificata', () => {
    expect(
      fileNameFromDisposition(
        'attachment; filename="codice.eml"; filename*=UTF-8\'\'20261001_Il%20tuo%20codice%20%E2%82%AC.eml',
      ),
    ).toBe('20261001_Il tuo codice €.eml')
  })

  it('senza filename* usa filename, con o senza virgolette', () => {
    expect(fileNameFromDisposition('attachment; filename="mail.txt"')).toBe('mail.txt')
    expect(fileNameFromDisposition('attachment; filename=mail.eml')).toBe('mail.eml')
  })

  it('header assente o senza nome → null', () => {
    expect(fileNameFromDisposition(null)).toBeNull()
    expect(fileNameFromDisposition('attachment')).toBeNull()
  })

  it('filename* con codifica rotta ripiega su filename', () => {
    expect(fileNameFromDisposition('attachment; filename="x.eml"; filename*=UTF-8\'\'%E2%ZZ')).toBe(
      'x.eml',
    )
  })
})
