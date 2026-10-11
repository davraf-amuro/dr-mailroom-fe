import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'
import type { SortDirection } from './statsService'

export type AttachmentDto = components['schemas']['AttachmentDto']
export type MessageId = components['schemas']['MessageSummaryDto']['id']
export type SenderMessageDto = components['schemas']['SenderMessageDto']
export type SenderMessagePageDto = components['schemas']['SenderMessagePageDto']

export interface SenderMessageQuery {
  mailboxId: number
  senderAddress: string
  search?: string
  sortDir: SortDirection
  page: number
  pageSize: number
}

/** Parametri di query dell'API (PascalCase come i filtri del backend). */
export function toSenderMessageParams(query: SenderMessageQuery) {
  return {
    MailboxId: query.mailboxId,
    SenderAddress: query.senderAddress,
    Search: query.search?.trim() || undefined,
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

/** Allegati salvati di una mail: 404 = la mail non ha allegati salvati. */
export function listAttachments(id: MessageId): Promise<ApiOutcome<AttachmentDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/messages/{id}/attachments', { params: { path: { id: Number(id) } } }),
  )
}
