import type { LocationQuery } from 'vue-router'

import { OAUTH_QUERY, OAuthReturnMessages, readParam } from '@/composables/mailboxes/useOAuthReturn'
import type { Notice } from '@/composables/shared/useNotice'
import { formatCount } from '@/utils/formatNumber'

/** Giorni in cui Gmail tiene le mail nel cestino prima di eliminarle. */
export const GMAIL_TRASH_RETENTION_DAYS = 30

/** Testi di "Elimina tutte" (cestino di un mittente, D-T1 bis). */
export const TrashMessages = {
  button: 'Elimina tutte',
  confirmTitle: 'Spostare nel cestino tutte le mail di questo mittente?',
  confirmLabel: 'Sposta nel cestino',
  authorizeTitle: 'Autorizzare il cestino?',
  authorizeDescription:
    'Per spostare mail nel cestino dr-mailroom ha bisogno di un permesso Gmail in più, solo per questa casella. ' +
    "La lettura resta com'è: lo stato letto/non letto delle mail non cambia. Google ti chiede il consenso, " +
    'poi torni qui e premi di nuovo «Elimina tutte».',
  authorizeLabel: 'Vai a Google',
  checkFailed: 'Impossibile verificare la casella: riprova tra poco.',
  startFailed: 'Lo spostamento nel cestino non è partito: riprova tra poco.',
  authorizedOk:
    'Cestino autorizzato per questa casella. Premi di nuovo «Elimina tutte» per spostare le mail.',
  mailboxMismatch:
    "Su Google hai scelto un account diverso da questa casella: riprova scegliendo l'account giusto.",
  mailboxUnavailable: 'La casella non è più attiva: il cestino non è stato autorizzato.',
} as const

/** Descrizione della conferma: cosa succede, a quali mail, e come si torna indietro. */
export function trashConfirmDescription(senderAddress: string): string {
  return (
    `Tutte le mail ricevute da ${senderAddress} in questa casella vanno nel cestino di Gmail, ` +
    `anche quelle fuori dalla ricerca per oggetto. Dal cestino le recuperi in Gmail per ` +
    `${GMAIL_TRASH_RETENTION_DAYS} giorni; in dr-mailroom spariscono da elenchi e statistiche. ` +
    'Le mail che hai inviato a questo indirizzo restano dove sono.'
  )
}

/** Avviso dopo la conferma: quante mail di quale mittente andranno nel cestino. */
export function trashStartedText(count: number, senderAddress: string): string {
  const mails = count === 1 ? '1 mail' : `${formatCount(count)} mail`
  return (
    `${mails} di ${senderAddress} verranno spostate nel cestino di Gmail. ` +
    `Dal cestino le recuperi in Gmail per ${GMAIL_TRASH_RETENTION_DAYS} giorni.`
  )
}

const trashReasonMessages: Record<string, string> = {
  invalid_state: OAuthReturnMessages.invalidState,
  exchange_failed: OAuthReturnMessages.exchangeFailed,
  trash_mailbox_mismatch: TrashMessages.mailboxMismatch,
  trash_mailbox_unavailable: TrashMessages.mailboxUnavailable,
}

/** Esito del ritorno da Google dopo l'autorizzazione del cestino; null se la query non ne contiene uno. */
export function readTrashOAuthReturn(query: LocationQuery): Notice | null {
  const result = readParam(query, OAUTH_QUERY.result)
  if (result === null) return null
  if (result === 'ok') return { tone: 'ok', text: TrashMessages.authorizedOk }
  const reason = readParam(query, OAUTH_QUERY.reason)
  return { tone: 'error', text: trashReasonMessages[reason ?? ''] ?? OAuthReturnMessages.denied }
}
