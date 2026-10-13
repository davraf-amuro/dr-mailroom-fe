import type { LocationQuery } from 'vue-router'

import { OAUTH_QUERY, OAuthReturnMessages, readParam } from '@/composables/mailboxes/useOAuthReturn'
import type { Notice } from '@/composables/shared/useNotice'
import { formatCount } from '@/utils/formatNumber'

/** Giorni in cui Gmail tiene le mail nel cestino prima di eliminarle. */
export const GMAIL_TRASH_RETENTION_DAYS = 30

/** Testi di "Elimina tutte" (cestino di un mittente, D-T1 bis). */
export const TrashMessages = {
  button: 'Elimina tutte',
  untilLabel: 'Fino al (compreso)',
  untilHint: 'Vuoto = tutte le mail. Con una data restano le mail ricevute dal giorno dopo.',
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

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Giorno scelto nel campo data ("yyyy-mm-dd", ora locale) → istante UTC di inizio del giorno dopo: l'estremo
 * escluso di "fino al giorno compreso". Es. "2026-01-01" in Italia → "2026-01-01T23:00:00.000Z".
 * Stringa vuota o data non valida → null (= tutte le mail).
 */
export function endOfLocalDayExclusiveUtc(isoDate: string): string | null {
  const match = ISO_DATE.exec(isoDate.trim())
  if (match === null) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  // Date normalizza i giorni fuori mese (31 febbraio → 3 marzo): una data così non è valida
  const chosen = new Date(year, month - 1, day)
  if (
    chosen.getFullYear() !== year ||
    chosen.getMonth() !== month - 1 ||
    chosen.getDate() !== day
  ) {
    return null
  }
  return new Date(year, month - 1, day + 1).toISOString()
}

/** "1 gennaio 2026" per il giorno scelto nel campo data; null se vuoto o non valido. */
export function untilDateLabel(isoDate: string): string | null {
  if (endOfLocalDayExclusiveUtc(isoDate) === null) return null
  const [year, month, day] = isoDate.trim().split('-').map(Number)
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year!, month! - 1, day!))
}

function mailsText(count: number): string {
  return count === 1 ? '1 mail' : `${formatCount(count)} mail`
}

/**
 * Descrizione della conferma: cosa succede, a quali mail, e come si torna indietro.
 * Con una data limite dice fino a quando (giorno compreso) e, se noto, quante mail sono.
 */
export function trashConfirmDescription(
  senderAddress: string,
  untilLabel: string | null = null,
  count: number | null = null,
): string {
  const which =
    untilLabel === null
      ? `Tutte le mail ricevute da ${senderAddress} in questa casella vanno nel cestino di Gmail, ` +
        'anche quelle fuori dalla ricerca per oggetto.'
      : `Le mail ricevute da ${senderAddress} in questa casella fino al ${untilLabel} compreso` +
        `${count === null ? '' : ` (${mailsText(count)})`} vanno nel cestino di Gmail; quelle successive restano.`
  return (
    `${which} Dal cestino le recuperi in Gmail per ${GMAIL_TRASH_RETENTION_DAYS} giorni; ` +
    'in dr-mailroom spariscono da elenchi e statistiche. ' +
    'Le mail che hai inviato a questo indirizzo restano dove sono.'
  )
}

/** Avviso dopo la conferma: quante mail di quale mittente (e fino a quando) andranno nel cestino. */
export function trashStartedText(
  count: number,
  senderAddress: string,
  untilLabel: string | null = null,
): string {
  const until = untilLabel === null ? '' : ` ricevute fino al ${untilLabel}`
  return (
    `${mailsText(count)} di ${senderAddress}${until} verranno spostate nel cestino di Gmail. ` +
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
