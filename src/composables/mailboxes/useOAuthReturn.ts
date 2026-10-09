import { onMounted } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'

import type { Notice } from '@/composables/shared/useNotice'

/** Parametri con cui il backend riporta il browser su /mailboxes dopo Google. */
export const OAUTH_QUERY = { result: 'oauth', reason: 'reason' } as const

/** Tabella "reason" della specifica, "Collegare una casella Gmail". */
export const OAuthReturnMessages = {
  ok: 'Casella collegata. Il primo giro legge tutto lo storico: può richiedere molto tempo.',
  denied: 'Consenso non concesso su Google.',
  invalidState: 'Collegamento scaduto o non valido: riprova (hai 10 minuti per completarlo).',
  mailboxDeleted: 'Questa casella è stata eliminata e non può essere ricollegata.',
  exchangeFailed:
    "Google non ha completato il collegamento: riprova. Se si ripete, revoca l'accesso dell'app dall'account Google e ricollega.",
} as const

const reasonMessages: Record<string, string> = {
  invalid_state: OAuthReturnMessages.invalidState,
  mailbox_deleted: OAuthReturnMessages.mailboxDeleted,
  exchange_failed: OAuthReturnMessages.exchangeFailed,
}

function readParam(query: LocationQuery, key: string): string | null {
  const value = query[key]
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' && first !== '' ? first : null
}

/** Esito del ritorno da Google; null se la query non contiene un ritorno OAuth. */
export function readOAuthReturn(query: LocationQuery): Notice | null {
  const result = readParam(query, OAUTH_QUERY.result)
  if (result === null) return null
  if (result === 'ok') return { tone: 'ok', text: OAuthReturnMessages.ok }

  // access_denied e qualsiasi altro valore di Google: consenso non concesso.
  const reason = readParam(query, OAUTH_QUERY.reason)
  return { tone: 'error', text: reasonMessages[reason ?? ''] ?? OAuthReturnMessages.denied }
}

/**
 * Al caricamento della vista legge `oauth` e `reason`, passa l'esito a `onResult`
 * e pulisce la query string (così un ricaricamento non ripete il messaggio).
 */
export function useOAuthReturn(onResult: (notice: Notice) => void): void {
  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    const notice = readOAuthReturn(route.query)
    if (notice === null) return
    onResult(notice)
    const query = { ...route.query }
    delete query[OAUTH_QUERY.result]
    delete query[OAUTH_QUERY.reason]
    void router.replace({ query })
  })
}
