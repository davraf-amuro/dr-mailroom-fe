import type { RouteLocationRaw } from 'vue-router'

import {
  SenderOverviewSortByValue,
  SortDirectionValue,
  type SenderOverviewSortBy,
  type SortDirection,
} from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'

/** Nome della route Filtri (non importato da router/routes per non creare cicli di tipi). */
const FILTERS_ROUTE_NAME = 'filters'

/** Righe per pagina della tabella e barre della classifica. */
export const STATS_PAGE_SIZE = 25
export const TOP_SENDERS_COUNT = 20

/** Oltre questa lunghezza l'oggetto si tronca a schermo; il testo completo resta nel title. */
export const SUBJECT_MAX_CHARS = 80

/** Colonne ordinabili della tabella → campo di ordinamento dell'API. */
export const sortColumns = {
  sender: SenderOverviewSortByValue.SenderAddress,
  mailCount: SenderOverviewSortByValue.MailCount,
  last: SenderOverviewSortByValue.LastReceivedAt,
  first: SenderOverviewSortByValue.FirstReceivedAt,
} as const satisfies Record<string, SenderOverviewSortBy>

export type SortColumn = keyof typeof sortColumns

/** Verso iniziale al primo clic: alfabetico dalla A, gli altri dal valore più alto o più recente. */
export function defaultDirection(sortBy: SenderOverviewSortBy): SortDirection {
  return sortBy === SenderOverviewSortByValue.SenderAddress
    ? SortDirectionValue.Asc
    : SortDirectionValue.Desc
}

/** Clic sull'intestazione: stessa colonna → inverte, colonna nuova → verso iniziale. */
export function nextSort(
  current: { sortBy: SenderOverviewSortBy; sortDir: SortDirection },
  sortBy: SenderOverviewSortBy,
): { sortBy: SenderOverviewSortBy; sortDir: SortDirection } {
  if (current.sortBy !== sortBy) return { sortBy, sortDir: defaultDirection(sortBy) }
  return {
    sortBy,
    sortDir:
      current.sortDir === SortDirectionValue.Asc ? SortDirectionValue.Desc : SortDirectionValue.Asc,
  }
}

export function ariaSortOf(
  current: { sortBy: SenderOverviewSortBy; sortDir: SortDirection },
  sortBy: SenderOverviewSortBy,
): 'ascending' | 'descending' | 'none' {
  if (current.sortBy !== sortBy) return 'none'
  return current.sortDir === SortDirectionValue.Asc ? 'ascending' : 'descending'
}

/** Oggetto per la cella: troncato con ellissi; null o vuoto → "(senza oggetto)". */
export function subjectText(subject: string | null, max = SUBJECT_MAX_CHARS): string {
  const text = subject?.trim() ?? ''
  if (text === '') return '(senza oggetto)'
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Numero di pagine (almeno 1). */
export function pageCount(totalCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalCount / pageSize))
}

/** "Crea filtro da questo mittente": la vista Filtri precompila il mittente da `?sender=`. */
export function createFilterLocation(senderAddress: string): RouteLocationRaw {
  return { name: FILTERS_ROUTE_NAME, query: { sender: senderAddress } }
}

/** Anno scelto nella select: "" = tutti. */
export function yearFromChoice(choice: string): number | undefined {
  return choice === '' ? undefined : Number(choice)
}

/** Etichetta della posta inviata: segnala, non esclude (conteggi e classifiche restano invariati). */
export const SENT_MAIL_LABEL = 'Posta inviata'

/** Conteggi di un mittente: mail totali e quante sono posta inviata (label SENT o indirizzo della casella). */
export interface SentCounts {
  mailCount: number | string
  sentCount: number | string
}

/** True se il mittente ha posta inviata. */
export function hasSentMail(row: SentCounts): boolean {
  return Number(row.sentCount) > 0
}

/** True se tutte le mail del mittente sono posta inviata. */
export function isAllSent(row: SentCounts): boolean {
  return hasSentMail(row) && Number(row.sentCount) >= Number(row.mailCount)
}

/** Testo del segno: "Posta inviata" se lo sono tutte, "N inviate" se in parte, null se nessuna. */
export function sentLabel(row: SentCounts): string | null {
  if (!hasSentMail(row)) return null
  return isAllSent(row) ? SENT_MAIL_LABEL : `${formatCount(Number(row.sentCount))} inviate`
}
