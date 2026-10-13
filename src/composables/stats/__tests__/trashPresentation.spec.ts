import { describe, expect, it } from 'vitest'

import { OAuthReturnMessages } from '@/composables/mailboxes/useOAuthReturn'
import {
  TrashMessages,
  endOfLocalDayExclusiveUtc,
  readTrashOAuthReturn,
  trashConfirmDescription,
  trashStartedText,
  untilDateLabel,
} from '../trashPresentation'

describe('readTrashOAuthReturn', () => {
  it('nessun ritorno OAuth → null', () => {
    expect(readTrashOAuthReturn({ mailboxId: '1' })).toBeNull()
  })

  it('ok → invita a premere di nuovo «Elimina tutte»', () => {
    expect(readTrashOAuthReturn({ oauth: 'ok' })).toEqual({
      tone: 'ok',
      text: TrashMessages.authorizedOk,
    })
  })

  it('account diverso dalla casella → messaggio dedicato', () => {
    expect(readTrashOAuthReturn({ oauth: 'error', reason: 'trash_mailbox_mismatch' })?.text).toBe(
      TrashMessages.mailboxMismatch,
    )
  })

  it('motivo sconosciuto (access_denied) → consenso non concesso', () => {
    expect(readTrashOAuthReturn({ oauth: 'error', reason: 'access_denied' })?.text).toBe(
      OAuthReturnMessages.denied,
    )
  })
})

describe('testi', () => {
  it('la conferma nomina il mittente, il cestino di Gmail e i 30 giorni', () => {
    const text = trashConfirmDescription('no-reply@spam.example')
    expect(text).toContain('no-reply@spam.example')
    expect(text).toContain('cestino di Gmail')
    expect(text).toContain('30 giorni')
  })

  it('avviso dopo la conferma: quante mail, di chi, e i 30 giorni', () => {
    expect(trashStartedText(1234, 'no-reply@spam.example')).toBe(
      '1.234 mail di no-reply@spam.example verranno spostate nel cestino di Gmail. ' +
        'Dal cestino le recuperi in Gmail per 30 giorni.',
    )
    expect(trashStartedText(1, 'a@b.it')).toMatch(/^1 mail di a@b\.it/)
  })
})

describe('data "fino al"', () => {
  it('il giorno scelto diventa l’inizio del giorno dopo in ora locale, in UTC', () => {
    expect(endOfLocalDayExclusiveUtc('2026-01-01')).toBe(new Date(2026, 0, 2).toISOString())
    expect(endOfLocalDayExclusiveUtc('2026-12-31')).toBe(new Date(2027, 0, 1).toISOString())
  })

  it.each(['', '2026-02-31', '2026-13-01', '01/01/2026', 'domani'])(
    'data vuota o non valida → null (= tutte): %j',
    (value) => {
      expect(endOfLocalDayExclusiveUtc(value)).toBeNull()
      expect(untilDateLabel(value)).toBeNull()
    },
  )

  it('etichetta in italiano', () => {
    expect(untilDateLabel('2026-01-01')).toBe('1 gennaio 2026')
  })

  it('la conferma con una data dice fino a quando, quante mail e che le successive restano', () => {
    const text = trashConfirmDescription('a@b.it', '1 gennaio 2026', 12)
    expect(text).toContain('fino al 1 gennaio 2026 compreso (12 mail)')
    expect(text).toContain('quelle successive restano')
    expect(text).not.toContain('Tutte le mail')
  })

  it('l’avviso dopo l’avvio ripete la data', () => {
    expect(trashStartedText(2, 'a@b.it', '1 gennaio 2026')).toMatch(
      /^2 mail di a@b\.it ricevute fino al 1 gennaio 2026 verranno spostate/,
    )
  })
})
