/**
 * Traduce le risposte dell'API negli esiti che le viste sanno mostrare,
 * secondo la tabella "Come interpretare le risposte" della specifica del frontend.
 */

/** Su una lista il 404 significa "nessun dato"; su una risorsa significa "non esiste". */
export type ResponseTarget = 'list' | 'resource'

export type FieldErrors = Record<string, string[]>

export type ApiOutcome<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'accepted'; data: T }
  | { kind: 'empty' }
  | { kind: 'notFound'; detail: string | null }
  | { kind: 'validation'; fieldErrors: FieldErrors; detail: string | null }
  | { kind: 'conflict'; detail: string | null }
  | { kind: 'unauthorized'; status: 401 | 403 }
  | { kind: 'databaseUnavailable'; detail: string | null }
  | { kind: 'networkError' }
  | { kind: 'error'; status: number; detail: string | null }

export const HTTP_STATUS = {
  ok: 200,
  created: 201,
  accepted: 202,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
  serviceUnavailable: 503,
} as const

function readDetail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const { detail, title } = body as Record<string, unknown>
  if (typeof detail === 'string' && detail !== '') return detail
  if (typeof title === 'string' && title !== '') return title
  return null
}

/** Chiavi in camelCase anche se il server ne mandasse qualcuna in PascalCase. */
function toCamelCase(key: string): string {
  return key
    .split('.')
    .map((part) => (part === '' ? part : part[0]!.toLowerCase() + part.slice(1)))
    .join('.')
}

export function readFieldErrors(body: unknown): FieldErrors {
  if (typeof body !== 'object' || body === null) return {}
  const { errors } = body as Record<string, unknown>
  if (typeof errors !== 'object' || errors === null) return {}

  const result: FieldErrors = {}
  for (const [key, messages] of Object.entries(errors as Record<string, unknown>)) {
    if (!Array.isArray(messages)) continue
    const texts = messages.filter((m): m is string => typeof m === 'string')
    if (texts.length > 0) result[toCamelCase(key)] = texts
  }
  return result
}

export function interpretResponse<T>(
  status: number,
  body: unknown,
  target: ResponseTarget,
): ApiOutcome<T> {
  switch (status) {
    case HTTP_STATUS.ok:
    case HTTP_STATUS.created:
    case HTTP_STATUS.noContent:
      return { kind: 'ok', data: body as T }
    case HTTP_STATUS.accepted:
      return { kind: 'accepted', data: body as T }
    case HTTP_STATUS.notFound:
      return target === 'list' ? { kind: 'empty' } : { kind: 'notFound', detail: readDetail(body) }
    case HTTP_STATUS.badRequest:
      return { kind: 'validation', fieldErrors: readFieldErrors(body), detail: readDetail(body) }
    case HTTP_STATUS.conflict:
      return { kind: 'conflict', detail: readDetail(body) }
    case HTTP_STATUS.unauthorized:
    case HTTP_STATUS.forbidden:
      return { kind: 'unauthorized', status }
    case HTTP_STATUS.serviceUnavailable:
      return { kind: 'databaseUnavailable', detail: readDetail(body) }
    default:
      return { kind: 'error', status, detail: readDetail(body) }
  }
}
