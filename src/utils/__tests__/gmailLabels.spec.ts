import { describe, expect, it } from 'vitest'

import { isSystemLabel, labelText, splitLabels } from '../gmailLabels'

describe('splitLabels', () => {
  it('divide sulla virgola e scarta le voci vuote', () => {
    expect(splitLabels('INBOX,CATEGORY_PROMOTIONS, Label_12,,')).toEqual([
      'INBOX',
      'CATEGORY_PROMOTIONS',
      'Label_12',
    ])
  })

  it('nessuna label → elenco vuoto', () => {
    expect(splitLabels(null)).toEqual([])
    expect(splitLabels(undefined)).toEqual([])
    expect(splitLabels('')).toEqual([])
  })
})

describe('labelText', () => {
  it('label di sistema in italiano', () => {
    expect(labelText('INBOX')).toBe('Posta in arrivo')
    expect(labelText('CATEGORY_PROMOTIONS')).toBe('Promozioni')
  })

  it("label dell'utente o sconosciute restano come id", () => {
    expect(labelText('Label_12')).toBe('Label_12')
    expect(labelText('toString')).toBe('toString')
  })
})

describe('isSystemLabel', () => {
  it('distingue sistema da utente, senza ereditare da Object', () => {
    expect(isSystemLabel('UNREAD')).toBe(true)
    expect(isSystemLabel('Label_3')).toBe(false)
    expect(isSystemLabel('constructor')).toBe(false)
  })
})
