import { describe, expect, it } from 'vitest'

import { OAuthReturnMessages } from '@/composables/mailboxes/useOAuthReturn'
import {
  TrashMessages,
  readTrashOAuthReturn,
  trashConfirmDescription,
  trashStartedText,
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
