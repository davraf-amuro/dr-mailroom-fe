import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'
import type { SortDirection } from './statsService'

export type FilterDto = components['schemas']['FilterDto']
export type FilterId = FilterDto['id']
export type FilterSummaryDto = components['schemas']['FilterSummaryDto']
export type FilterRequest = components['schemas']['FilterRequest']
export type FilterPreviewRequest = components['schemas']['FilterPreviewRequest']
export type FilterPreviewDto = components['schemas']['FilterPreviewDto']
export type MessageSummaryDto = components['schemas']['MessageSummaryDto']
export type ReapplyRequest = components['schemas']['ReapplyRequest']
export type RunsStartedDto = components['schemas']['RunsStartedDto']
export type ProcessType = components['schemas']['ProcessType']
export type FilterMessageDto = components['schemas']['FilterMessageDto']
export type FilterMessagePageDto = components['schemas']['FilterMessagePageDto']

type NonNullSubjectMatchType = NonNullable<components['schemas']['SubjectMatchType']>

/** Valori di SubjectMatchType (enum come stringa nell'API). */
export const SubjectMatchTypeValue = {
  StartsWith: 'StartsWith',
  Contains: 'Contains',
  Regex: 'Regex',
} as const satisfies Record<NonNullSubjectMatchType, NonNullSubjectMatchType>

/** Valori di ProcessType (enum come stringa nell'API). */
export const ProcessTypeValue = {
  AttachmentExtraction: 'AttachmentExtraction',
  Alert: 'Alert',
  ContentArchive: 'ContentArchive',
} as const satisfies Record<ProcessType, ProcessType>

export interface FilterListFilter {
  name?: string
  senderAddress?: string
  mailboxId?: number
  isEnabled?: boolean
}

function toQuery(filter: FilterListFilter) {
  return {
    Name: filter.name?.trim() || undefined,
    SenderAddress: filter.senderAddress?.trim() || undefined,
    MailboxId: filter.mailboxId,
    IsEnabled: filter.isEnabled,
  }
}

export function listFilters(filter: FilterListFilter = {}): Promise<ApiOutcome<FilterDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/filters', { params: { query: toQuery(filter) } }),
  )
}

/** Forma ridotta: id e nome, per etichettare i giri di riapplica. */
export function listFilterSummaries(): Promise<ApiOutcome<FilterSummaryDto[]>> {
  return callApi('list', (api) => api.GET('/api/v1/filters/summary'))
}

/** Un filtro con i suoi processi: 404 = filtro inesistente. */
export function getFilter(id: FilterId): Promise<ApiOutcome<FilterDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/filters/{id}', { params: { path: { id: Number(id) } } }),
  )
}

export function createFilter(body: FilterRequest): Promise<ApiOutcome<FilterDto>> {
  return callApi('resource', (api) => api.POST('/api/v1/filters', { body }))
}

export function updateFilter(id: FilterId, body: FilterRequest): Promise<ApiOutcome<unknown>> {
  return callApi('resource', (api) =>
    api.PUT('/api/v1/filters/{id}', { params: { path: { id: Number(id) } }, body }),
  )
}

export function deleteFilter(id: FilterId): Promise<ApiOutcome<unknown>> {
  return callApi('resource', (api) =>
    api.DELETE('/api/v1/filters/{id}', { params: { path: { id: Number(id) } } }),
  )
}

/** Dry-run: lavora solo sulle mail già indicizzate, non scrive nulla. */
export function previewFilter(body: FilterPreviewRequest): Promise<ApiOutcome<FilterPreviewDto>> {
  return callApi('resource', (api) => api.POST('/api/v1/filters/preview', { body }))
}

export function reapplyFilter(
  id: FilterId,
  body: ReapplyRequest,
): Promise<ApiOutcome<RunsStartedDto>> {
  return callApi('resource', (api) =>
    api.POST('/api/v1/filters/{id}/reapply', { params: { path: { id: Number(id) } }, body }),
  )
}

export interface FilterMessageQuery {
  sortDir: SortDirection
  page: number
  pageSize: number
}

/**
 * Mail che corrispondono a un filtro salvato, paginate per data, con lo stato del contenuto archiviato.
 * 404 = filtro inesistente; nessuna mail = pagina vuota.
 */
export function listFilterMessages(
  id: FilterId,
  query: FilterMessageQuery,
): Promise<ApiOutcome<FilterMessagePageDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/filters/{id}/messages', {
      params: {
        path: { id: Number(id) },
        query: { SortDir: query.sortDir, Page: query.page, PageSize: query.pageSize },
      },
    }),
  )
}
