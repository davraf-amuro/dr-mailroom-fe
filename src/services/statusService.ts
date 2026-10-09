import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

export type DatabaseStatus = components['schemas']['DatabaseStatusResponse']

/** Stato del database: sempre 200, non richiede la chiave API. */
export function getStatus(): Promise<ApiOutcome<DatabaseStatus>> {
  return callApi('resource', (api) => api.GET('/api/v1/status'))
}

/** Riprova la connessione al database: 200 pronto, 503 ancora giù. */
export function retryDatabase(): Promise<ApiOutcome<DatabaseStatus>> {
  return callApi('resource', (api) => api.POST('/api/v1/status/retry-database'))
}
