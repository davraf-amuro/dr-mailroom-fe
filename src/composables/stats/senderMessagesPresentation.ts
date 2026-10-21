import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router'

import { SortDirectionValue, type SortDirection } from '@/services/statsService'

/** Nome della route della griglia (non importato da router/routes per non creare cicli di tipi). */
const SENDER_MESSAGES_ROUTE_NAME = 'stats-messages'

/** Righe per pagina della griglia delle mail. */
export const SENDER_MESSAGES_PAGE_SIZE = 25

/** Attesa prima di cercare mentre si digita nell'oggetto. */
export const SENDER_MESSAGES_SEARCH_DEBOUNCE_MS = 300

/** Stato della griglia, tutto nella query string: link condivisibile e tasto Indietro coerente. */
export interface SenderMessagesState {
  /** null = casella assente o non valida nel link. */
  mailboxId: number | null
  /** "" = mittente assente nel link. */
  senderAddress: string
  search: string
  sortDir: SortDirection
  page: number
}

function single(value: LocationQuery[string] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value
  return first?.trim() ?? ''
}

function positiveInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return parsed > 0 ? parsed : null
}

/** Legge lo stato dalla query string; valori mancanti o non validi → default. */
export function parseSenderMessagesQuery(query: LocationQuery): SenderMessagesState {
  const sortDir = single(query.sortDir)
  return {
    mailboxId: positiveInt(single(query.mailboxId)),
    senderAddress: single(query.sender),
    search: single(query.search),
    sortDir: sortDir === SortDirectionValue.Asc ? SortDirectionValue.Asc : SortDirectionValue.Desc,
    page: positiveInt(single(query.page)) ?? 1,
  }
}

/** Query string dello stato: i default non si scrivono, così il link resta corto. */
export function toSenderMessagesQuery(state: SenderMessagesState): LocationQueryRaw {
  return {
    mailboxId: state.mailboxId === null ? undefined : String(state.mailboxId),
    sender: state.senderAddress || undefined,
    search: state.search || undefined,
    sortDir: state.sortDir === SortDirectionValue.Desc ? undefined : state.sortDir,
    page: state.page > 1 ? String(state.page) : undefined,
  }
}

/** Griglia delle mail di un mittente nella casella indicata, dalla più recente. */
export function senderMessagesLocation(mailboxId: number, senderAddress: string): RouteLocationRaw {
  return {
    name: SENDER_MESSAGES_ROUTE_NAME,
    query: { mailboxId: String(mailboxId), sender: senderAddress },
  }
}

/** Indirizzo base della webmail di Gmail. */
export const GMAIL_WEB_URL = 'https://mail.google.com/mail/u/'

/**
 * Link "Apri in Gmail" di un messaggio. Con l'indirizzo della casella Gmail apre l'account giusto anche con più
 * account collegati nel browser (authuser); senza, apre il primo account.
 */
export function gmailMessageUrl(gmailMessageId: string, account: string | null = null): string {
  const user = account === null ? '0/' : `?authuser=${encodeURIComponent(account)}`
  return `${GMAIL_WEB_URL}${user}#all/${encodeURIComponent(gmailMessageId)}`
}
