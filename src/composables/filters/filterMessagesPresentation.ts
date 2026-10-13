import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import { SortDirectionValue, type SortDirection } from '@/services/statsService'
import { formatCount } from '@/utils/formatNumber'

/** Righe per pagina della tabella delle mail del filtro. */
export const FILTER_MESSAGES_PAGE_SIZE = 25

/** Stato della tabella nella query string: link condivisibile e tasto Indietro coerente. */
export interface FilterMessagesState {
  /** null = id assente o non valido nel percorso. */
  filterId: number | null
  sortDir: SortDirection
  page: number
}

export const FilterMessagesMessages = {
  loadFailed: 'Impossibile leggere le mail del filtro: riprova tra poco.',
  filterMissing: 'Il filtro non esiste più: forse è stato eliminato.',
  downloadFailed: 'Download non riuscito: riprova tra poco.',
  contentMissing:
    'Il contenuto di questa mail non è più disponibile: riapplica il filtro con «Salva contenuto».',
  contentUnreadable: 'Il contenuto salvato di questa mail non è leggibile.',
  textFailed: 'Impossibile leggere il testo della mail: riprova tra poco.',
  copied: 'Testo copiato negli appunti.',
  copyFailed: 'Copia non riuscita: seleziona il testo e copialo a mano.',
  notArchivedReason: 'Contenuto non salvato: usa «Archivia le mancanti».',
} as const

function single(value: LocationQuery[string] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value
  return first?.trim() ?? ''
}

function positiveInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return parsed > 0 ? parsed : null
}

/** Stato da id nel percorso e query string; valori mancanti o non validi → default. */
export function parseFilterMessagesState(
  idParam: unknown,
  query: LocationQuery,
): FilterMessagesState {
  const id = typeof idParam === 'string' ? positiveInt(idParam) : null
  const sortDir = single(query.sortDir)
  return {
    filterId: id,
    sortDir: sortDir === SortDirectionValue.Asc ? SortDirectionValue.Asc : SortDirectionValue.Desc,
    page: positiveInt(single(query.page)) ?? 1,
  }
}

/** Query string dello stato: i default non si scrivono, così il link resta corto. */
export function toFilterMessagesQuery(state: FilterMessagesState): LocationQueryRaw {
  return {
    sortDir: state.sortDir === SortDirectionValue.Desc ? undefined : state.sortDir,
    page: state.page > 1 ? String(state.page) : undefined,
  }
}

/** "1 mail" / "1.234 mail". */
export function mailCountText(count: number): string {
  return count === 1 ? '1 mail' : `${formatCount(count)} mail`
}

/**
 * Testo del banner sulle mail senza contenuto salvato; null se sono tutte archiviate.
 * Con il processo nel filtro si può archiviarle subito, senza va prima aggiunto al filtro.
 */
export function archiveBannerText(missing: number, hasContentArchive: boolean): string | null {
  if (missing <= 0) return null
  const subject = missing === 1 ? '1 mail non ha' : `${formatCount(missing)} mail non hanno`
  return hasContentArchive
    ? `${subject} ancora il contenuto salvato: «Archivia le mancanti» lo scarica da Gmail.`
    : `${subject} il contenuto salvato: aggiungi «Salva il contenuto della mail» al filtro per scaricarlo.`
}
