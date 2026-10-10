import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

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
