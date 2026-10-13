import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

export type RunDto = components['schemas']['RunDto']
export type RunSummaryDto = components['schemas']['RunSummaryDto']
export type RunStatus = components['schemas']['RunStatus']
export type RunTrigger = components['schemas']['RunTrigger']
export type RunsStartedDto = components['schemas']['RunsStartedDto']
export type RunsCancelledDto = components['schemas']['RunsCancelledDto']
export type RunId = RunDto['id']

/** Valori di RunStatus (enum come stringa nell'API). */
export const RunStatusValue = {
  Running: 'Running',
  Completed: 'Completed',
  Failed: 'Failed',
  Skipped: 'Skipped',
  Cancelled: 'Cancelled',
} as const satisfies Record<RunStatus, RunStatus>

/** Valori di RunTrigger (enum come stringa nell'API). */
export const RunTriggerValue = {
  Scheduled: 'Scheduled',
  Manual: 'Manual',
  Reapply: 'Reapply',
  TrashSender: 'TrashSender',
} as const satisfies Record<RunTrigger, RunTrigger>

export interface RunListFilter {
  mailboxId?: number
  trigger?: RunTrigger
  status?: RunStatus
  /** ISO UTC, inclusivo. */
  startedAtUtcFrom?: string
  /** ISO UTC, inclusivo. */
  startedAtUtcTo?: string
}

function toQuery(filter: RunListFilter) {
  return {
    MailboxId: filter.mailboxId,
    Trigger: filter.trigger,
    Status: filter.status,
    StartedAtUtcFrom: filter.startedAtUtcFrom,
    StartedAtUtcTo: filter.startedAtUtcTo,
  }
}

export function listRuns(filter: RunListFilter = {}): Promise<ApiOutcome<RunDto[]>> {
  return callApi('list', (api) => api.GET('/api/v1/runs', { params: { query: toQuery(filter) } }))
}

export function listRunSummaries(filter: RunListFilter = {}): Promise<ApiOutcome<RunSummaryDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/runs/summary', { params: { query: toQuery(filter) } }),
  )
}

export function getRun(id: RunId): Promise<ApiOutcome<RunDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/runs/{id}', { params: { path: { id: Number(id) } } }),
  )
}

/** Giro manuale immediato (D11): null = tutte le caselle attive. */
export function startRun(mailboxId: number | null): Promise<ApiOutcome<RunsStartedDto>> {
  return callApi('resource', (api) => api.POST('/api/v1/runs', { body: { mailboxId } }))
}

/** Annullamento asincrono: il giro passa a Cancelled entro pochi secondi. */
export function cancelRun(id: RunId): Promise<ApiOutcome<RunsCancelledDto>> {
  return callApi('resource', (api) =>
    api.POST('/api/v1/runs/{id}/cancel', { params: { path: { id: Number(id) } } }),
  )
}

export function cancelAllRuns(): Promise<ApiOutcome<RunsCancelledDto>> {
  return callApi('resource', (api) => api.POST('/api/v1/runs/cancel'))
}
