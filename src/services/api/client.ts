import createClient, { type Client, type Middleware } from 'openapi-fetch'

import type { paths } from './schema'
import { emitApiAlarm } from './apiEvents'
import { HTTP_STATUS, interpretResponse, type ApiOutcome, type ResponseTarget } from './problem'
import type { RuntimeConfig } from './runtimeConfig'

/** Nome dell'header atteso dal backend (Authentication:ApiKey:HeaderName). */
export const API_KEY_HEADER = 'x-api-key'

export type ApiClient = Client<paths>

// Chiave e client vivono solo in memoria, per la durata della scheda.
let apiKey = ''
let client: ApiClient | null = null

const authMiddleware: Middleware = {
  onRequest({ request }) {
    if (apiKey !== '') request.headers.set(API_KEY_HEADER, apiKey)
    return request
  },
}

const alarmMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.status === HTTP_STATUS.serviceUnavailable) {
      const body: unknown = await response
        .clone()
        .json()
        .catch(() => null)
      const detail = interpretResponse(response.status, body, 'resource')
      emitApiAlarm({
        kind: 'databaseUnavailable',
        detail: detail.kind === 'databaseUnavailable' ? detail.detail : null,
      })
    } else if (
      response.status === HTTP_STATUS.unauthorized ||
      response.status === HTTP_STATUS.forbidden
    ) {
      emitApiAlarm({ kind: 'unauthorized', status: response.status })
    }
    return response
  },
}

export function initApiClient(config: RuntimeConfig): ApiClient {
  apiKey = config.apiKey
  client = createClient<paths>({ baseUrl: config.apiBaseUrl })
  client.use(authMiddleware, alarmMiddleware)
  return client
}

export function getApiClient(): ApiClient {
  if (client === null) throw new Error('Client API non inizializzato: chiama initApiClient')
  return client
}

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/**
 * Esegue una chiamata e ne restituisce l'esito interpretato.
 * Un errore di rete (backend spento, CORS) diventa `networkError` invece di un'eccezione.
 */
export async function callApi<T>(
  target: ResponseTarget,
  run: (api: ApiClient) => Promise<FetchResult<T>>,
): Promise<ApiOutcome<T>> {
  let result: FetchResult<T>
  try {
    result = await run(getApiClient())
  } catch (error) {
    if (error instanceof TypeError) return { kind: 'networkError' }
    throw error
  }
  const { data, error, response } = result
  return interpretResponse<T>(response.status, response.ok ? data : error, target)
}
