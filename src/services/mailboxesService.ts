import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

export type MailboxDto = components['schemas']['MailboxDto']
export type MailboxSummaryDto = components['schemas']['MailboxSummaryDto']
export type MailboxStatus = components['schemas']['MailboxStatus']
export type MailboxId = MailboxDto['id']

/** Valori di MailboxStatus (enum come stringa nell'API). */
export const MailboxStatusValue = {
  Active: 'Active',
  TokenRevoked: 'TokenRevoked',
  Disabled: 'Disabled',
  Deleted: 'Deleted',
} as const satisfies Record<MailboxStatus, MailboxStatus>

export interface MailboxListFilter {
  emailAddress?: string
  status?: MailboxStatus
}

function toQuery(filter: MailboxListFilter) {
  return {
    EmailAddress: filter.emailAddress?.trim() || undefined,
    Status: filter.status,
  }
}

export function listMailboxes(filter: MailboxListFilter = {}): Promise<ApiOutcome<MailboxDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/mailboxes', { params: { query: toQuery(filter) } }),
  )
}

export function listMailboxSummaries(
  filter: MailboxListFilter = {},
): Promise<ApiOutcome<MailboxSummaryDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/mailboxes/summary', { params: { query: toQuery(filter) } }),
  )
}

export function getMailbox(id: MailboxId): Promise<ApiOutcome<MailboxDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/mailboxes/{id}', { params: { path: { id: Number(id) } } }),
  )
}

/** URL della pagina di consenso Google (collega e ricollega usano lo stesso flusso). */
export function getConnectUrl(): Promise<ApiOutcome<components['schemas']['ConnectUrlDto']>> {
  return callApi('resource', (api) => api.GET('/api/v1/mailboxes/connect'))
}

export function pauseMailbox(id: MailboxId): Promise<ApiOutcome<unknown>> {
  return callApi('resource', (api) =>
    api.POST('/api/v1/mailboxes/{id}/pause', { params: { path: { id: Number(id) } } }),
  )
}

export function resumeMailbox(id: MailboxId): Promise<ApiOutcome<unknown>> {
  return callApi('resource', (api) =>
    api.POST('/api/v1/mailboxes/{id}/resume', { params: { path: { id: Number(id) } } }),
  )
}

/** Eliminazione logica (D18): la casella resta in elenco con stato Deleted. */
export function deleteMailbox(id: MailboxId): Promise<ApiOutcome<unknown>> {
  return callApi('resource', (api) =>
    api.DELETE('/api/v1/mailboxes/{id}', { params: { path: { id: Number(id) } } }),
  )
}
