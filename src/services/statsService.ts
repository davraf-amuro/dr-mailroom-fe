import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

export type SenderOverviewDto = components['schemas']['SenderOverviewDto']
export type SenderOverviewPageDto = components['schemas']['SenderOverviewPageDto']
export type YearStatDto = components['schemas']['YearStatDto']
export type SenderOverviewSortBy = NonNullable<components['schemas']['SenderOverviewSortBy']>
export type SortDirection = NonNullable<components['schemas']['SortDirection']>

/** Valori di SenderOverviewSortBy (enum come stringa nell'API). */
export const SenderOverviewSortByValue = {
  MailCount: 'MailCount',
  LastReceivedAt: 'LastReceivedAt',
  FirstReceivedAt: 'FirstReceivedAt',
  SenderAddress: 'SenderAddress',
} as const satisfies Record<SenderOverviewSortBy, SenderOverviewSortBy>

export const SortDirectionValue = {
  Asc: 'Asc',
  Desc: 'Desc',
} as const satisfies Record<SortDirection, SortDirection>

export interface SenderOverviewQuery {
  mailboxId: number
  year?: number
  search?: string
  sortBy: SenderOverviewSortBy
  sortDir: SortDirection
  page: number
  pageSize: number
}

/** Parametri di query dell'API (PascalCase come i filtri del backend). */
export function toOverviewParams(query: SenderOverviewQuery) {
  return {
    MailboxId: query.mailboxId,
    Year: query.year,
    Search: query.search?.trim() || undefined,
    SortBy: query.sortBy,
    SortDir: query.sortDir,
    Page: query.page,
    PageSize: query.pageSize,
  }
}

/** Panoramica paginata dei mittenti: per indirizzo, con la mail più vecchia e la più recente. */
export function getSenderOverview(
  query: SenderOverviewQuery,
): Promise<ApiOutcome<SenderOverviewPageDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/stats/senders/overview', { params: { query: toOverviewParams(query) } }),
  )
}

/** Mail per anno della casella o di un suo mittente (indirizzo esatto), dal più recente. */
export function listYearStats(
  mailboxId: number,
  senderAddress?: string,
): Promise<ApiOutcome<YearStatDto[]>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/stats/years', {
      params: { query: { MailboxId: mailboxId, SenderAddress: senderAddress } },
    }),
  )
}
