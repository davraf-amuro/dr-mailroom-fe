import { describe, expect, it } from 'vitest'

import {
  parseSenderMessagesQuery,
  senderMessagesLocation,
  toSenderMessagesQuery,
} from '../senderMessagesPresentation'

describe('parseSenderMessagesQuery', () => {
  it('legge casella, mittente, ricerca, verso e pagina', () => {
    expect(
      parseSenderMessagesQuery({
        mailboxId: '3',
        sender: ' a@x.it ',
        search: 'promo',
        sortDir: 'Asc',
        page: '2',
      }),
    ).toEqual({ mailboxId: 3, senderAddress: 'a@x.it', search: 'promo', sortDir: 'Asc', page: 2 })
  })

  it('valori mancanti o non validi → default', () => {
    expect(parseSenderMessagesQuery({ mailboxId: 'abc', page: '0', sortDir: 'boh' })).toEqual({
      mailboxId: null,
      senderAddress: '',
      search: '',
      sortDir: 'Desc',
      page: 1,
    })
    expect(parseSenderMessagesQuery({ mailboxId: '-1', page: '1.5' }).mailboxId).toBeNull()
  })

  it('parametro ripetuto → vale il primo', () => {
    expect(parseSenderMessagesQuery({ sender: ['a@x.it', 'b@x.it'] }).senderAddress).toBe('a@x.it')
  })
})

describe('toSenderMessagesQuery', () => {
  it('non scrive i default', () => {
    expect(
      toSenderMessagesQuery({
        mailboxId: 3,
        senderAddress: 'a@x.it',
        search: '',
        sortDir: 'Desc',
        page: 1,
      }),
    ).toEqual({
      mailboxId: '3',
      sender: 'a@x.it',
      search: undefined,
      sortDir: undefined,
      page: undefined,
    })
  })

  it('andata e ritorno conservano lo stato', () => {
    const state = {
      mailboxId: 7,
      senderAddress: 'a@x.it',
      search: 'fattura',
      sortDir: 'Asc',
      page: 4,
    } as const
    const query = toSenderMessagesQuery(state) as Record<string, string>
    expect(parseSenderMessagesQuery(query)).toEqual(state)
  })
})

describe('senderMessagesLocation', () => {
  it('route della griglia con casella e mittente', () => {
    expect(senderMessagesLocation(2, 'a@x.it')).toEqual({
      name: 'stats-messages',
      query: { mailboxId: '2', sender: 'a@x.it' },
    })
  })
})
