import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'
import type { SortDirection } from './statsService'

export type AttachmentDto = components['schemas']['AttachmentDto']
export type MessageId = components['schemas']['MessageSummaryDto']['id']
export type SenderMessageDto = components['schemas']['SenderMessageDto']
export type SenderMessagePageDto = components['schemas']['SenderMessagePageDto']
export type TrashSenderStartedDto = components['schemas']['TrashSenderStartedDto']

export interface SenderMessageQuery {
  mailboxId: number
  senderAddress: string
  search?: string
  /** Solo le mail ricevute prima di questo istante ISO UTC (estremo escluso). */
  receivedBeforeUtc?: string
  sortDir: SortDirection
  page: number
  pageSize: number
}

/** Formati del contenuto archiviato: il .eml originale o il testo leggibile ricavato dal server. */
export const MessageContentFormat = {
  eml: 'eml',
  txt: 'txt',
} as const

export type MessageContentFormat = (typeof MessageContentFormat)[keyof typeof MessageContentFormat]

/** Contenuto scaricato: il file e il nome proposto dal server (Content-Disposition). */
export interface MessageContentFile {
  blob: Blob
  fileName: string
}

/** Parametri di query dell'API (PascalCase come i filtri del backend). */
export function toSenderMessageParams(query: SenderMessageQuery) {
  return {
    MailboxId: query.mailboxId,
    SenderAddress: query.senderAddress,
    Search: query.search?.trim() || undefined,
    ReceivedBeforeUtc: query.receivedBeforeUtc,
    SortDir: query.sortDir,
    Page: query.page,
    PageSize: query.pageSize,
  }
}

/** Mail di un mittente in una casella, paginate per data: 404 = casella inesistente, nessuna mail = pagina vuota. */
export function listSenderMessages(
  query: SenderMessageQuery,
): Promise<ApiOutcome<SenderMessagePageDto>> {
  return callApi('resource', (api) =>
    api.GET('/api/v1/messages', { params: { query: toSenderMessageParams(query) } }),
  )
}

/**
 * "Elimina tutte": avvia il giro che sposta nel cestino di Gmail le mail ricevute dal mittente (202, `accepted`).
 * 409 se il cestino non è autorizzato, non c'è nulla da cestinare o la casella è occupata.
 */
export function trashSender(
  mailboxId: number,
  senderAddress: string,
  receivedBeforeUtc: string | null = null,
): Promise<ApiOutcome<TrashSenderStartedDto>> {
  return callApi('resource', (api) =>
    api.POST('/api/v1/messages/trash-sender', {
      body: { mailboxId, senderAddress, receivedBeforeUtc },
    }),
  )
}

/** Allegati salvati di una mail: 404 = la mail non ha allegati salvati. */
export function listAttachments(id: MessageId): Promise<ApiOutcome<AttachmentDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/messages/{id}/attachments', { params: { path: { id: Number(id) } } }),
  )
}

const FILE_NAME_STAR = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/
const FILE_NAME_PLAIN = /filename\s*=\s*"?([^";]+)"?/

/** Nome del file da Content-Disposition (forma RFC 5987 preferita); null se assente o illeggibile. */
export function fileNameFromDisposition(header: string | null): string | null {
  if (header === null) return null
  const star = FILE_NAME_STAR.exec(header)?.[1]
  if (star !== undefined) {
    try {
      return decodeURIComponent(star.trim())
    } catch {
      // Codifica non valida: si prova la forma semplice
    }
  }
  return FILE_NAME_PLAIN.exec(header)?.[1]?.trim() || null
}

/**
 * Contenuto archiviato di una mail come file. La chiave API viaggia nell'header, quindi niente link diretto:
 * si scarica con fetch e si salva come blob. 404 = contenuto non archiviato o file non più sul disco.
 */
export async function getMessageContent(
  id: MessageId,
  format: MessageContentFormat,
): Promise<ApiOutcome<MessageContentFile>> {
  let fileName: string | null = null
  const outcome = await callApi<Blob>('resource', async (api) => {
    const result = await api.GET('/api/v1/messages/{id}/content', {
      params: { path: { id: Number(id) }, query: { Format: format } },
      parseAs: 'blob',
    })
    fileName = fileNameFromDisposition(result.response.headers.get('Content-Disposition'))
    return result
  })
  if (outcome.kind !== 'ok' && outcome.kind !== 'accepted') return outcome
  return { kind: 'ok', data: { blob: outcome.data, fileName: fileName ?? `mail-${id}.${format}` } }
}

/** Testo leggibile di una mail archiviata, per il popup "Testo". */
export async function getMessageText(id: MessageId): Promise<ApiOutcome<string>> {
  const outcome = await getMessageContent(id, MessageContentFormat.txt)
  if (outcome.kind !== 'ok' && outcome.kind !== 'accepted') return outcome
  return { kind: 'ok', data: await outcome.data.blob.text() }
}
