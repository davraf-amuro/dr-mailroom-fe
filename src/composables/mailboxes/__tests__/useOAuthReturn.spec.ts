import { describe, expect, it } from 'vitest'

import { OAuthReturnMessages, readOAuthReturn } from '../useOAuthReturn'

describe('readOAuthReturn (tabella "reason" della specifica)', () => {
  it.each([
    [{ oauth: 'ok' }, 'ok', OAuthReturnMessages.ok],
    [{ oauth: 'error', reason: 'access_denied' }, 'error', OAuthReturnMessages.denied],
    [{ oauth: 'error', reason: 'altro_valore_google' }, 'error', OAuthReturnMessages.denied],
    [{ oauth: 'error' }, 'error', OAuthReturnMessages.denied],
    [{ oauth: 'error', reason: 'invalid_state' }, 'error', OAuthReturnMessages.invalidState],
    [{ oauth: 'error', reason: 'mailbox_deleted' }, 'error', OAuthReturnMessages.mailboxDeleted],
    [{ oauth: 'error', reason: 'exchange_failed' }, 'error', OAuthReturnMessages.exchangeFailed],
  ])('%o → %s', (query, tone, text) => {
    expect(readOAuthReturn(query)).toEqual({ tone, text })
  })

  it('senza oauth nella query non c’è nessun esito', () => {
    expect(readOAuthReturn({})).toBeNull()
    expect(readOAuthReturn({ reason: 'invalid_state' })).toBeNull()
  })

  it('i messaggi sono quelli della specifica', () => {
    expect(OAuthReturnMessages.invalidState).toBe(
      'Collegamento scaduto o non valido: riprova (hai 10 minuti per completarlo).',
    )
    expect(OAuthReturnMessages.mailboxDeleted).toBe(
      'Questa casella è stata eliminata e non può essere ricollegata.',
    )
  })
})
