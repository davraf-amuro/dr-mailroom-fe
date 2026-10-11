import type { Page, Route } from '@playwright/test'

/** Origine fittizia dell'API: nessuna chiamata esce dal browser di test. */
export const API_BASE_URL = 'http://api.test'

type Json = unknown
type Handler = (route: Route, url: URL) => Json | Promise<Json>

export interface MockApi {
  /** Sostituisce la risposta di `METODO /api/v1/percorso` (percorso senza query string). */
  on(method: string, path: string, handler: Handler): void
  /** Richieste arrivate a un percorso senza risposta simulata: un test pulito le lascia vuote. */
  unhandled: string[]
}

/** Risposta con stato diverso da 200 (per esempio 202 o un ProblemDetails 400). */
export class MockResponse {
  constructor(
    readonly status: number,
    readonly body: Json,
    readonly contentType = 'application/json',
  ) {}
}

const defaults: Record<string, Json> = {
  'GET /api/v1/status': { databaseReady: true, lastError: null, lastCheckedUtc: null },
  'GET /api/v1/mailboxes': [],
  'GET /api/v1/mailboxes/summary': [],
  'GET /api/v1/filters': [],
  'GET /api/v1/filters/summary': [],
  'GET /api/v1/runs': [],
  'GET /api/v1/runs/summary': [],
  'GET /api/v1/stats/years': [],
  'GET /api/v1/stats/senders/overview': { items: [], page: 1, pageSize: 25, totalCount: 0 },
}

/**
 * Serve `config.json` e risponde a tutte le chiamate verso {@link API_BASE_URL}
 * con dati simulati: i valori di `defaults` finché il test non li sostituisce con `on`.
 */
export async function mockApi(page: Page): Promise<MockApi> {
  const handlers = new Map<string, Handler>(
    Object.entries(defaults).map(([key, body]) => [key, () => body]),
  )
  const api: MockApi = {
    on: (method, path, handler) => handlers.set(`${method.toUpperCase()} ${path}`, handler),
    unhandled: [],
  }

  await page.route('**/config.json', (route) =>
    route.fulfill({ json: { apiBaseUrl: API_BASE_URL, apiKey: 'chiave-e2e' } }),
  )

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request()
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    }
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })

    const url = new URL(request.url())
    const key = `${request.method()} ${url.pathname}`
    const handler = handlers.get(key)
    if (handler === undefined) {
      api.unhandled.push(key)
      return route.fulfill({
        status: 404,
        headers: cors,
        contentType: 'application/problem+json',
        body: JSON.stringify({ status: 404, title: 'Not Found' }),
      })
    }

    const result = await handler(route, url)
    const response = result instanceof MockResponse ? result : new MockResponse(200, result)
    return route.fulfill({
      status: response.status,
      headers: cors,
      contentType: response.contentType,
      body: response.body === undefined ? '' : JSON.stringify(response.body),
    })
  })

  return api
}
