import { callApi } from './api/client'
import type { ApiOutcome } from './api/problem'
import type { components } from './api/schema'

export type AttachmentDto = components['schemas']['AttachmentDto']
export type MessageId = components['schemas']['MessageSummaryDto']['id']

/** Allegati salvati di una mail: 404 = la mail non ha allegati salvati. */
export function listAttachments(id: MessageId): Promise<ApiOutcome<AttachmentDto[]>> {
  return callApi('list', (api) =>
    api.GET('/api/v1/messages/{id}/attachments', { params: { path: { id: Number(id) } } }),
  )
}
