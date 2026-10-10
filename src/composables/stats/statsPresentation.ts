import type { RouteLocationRaw } from 'vue-router'

import {
  SenderOverviewSortByValue,
  SortDirectionValue,
  type SenderOverviewSortBy,
  type SortDirection,
} from '@/services/statsService'

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
