import { computed, ref } from 'vue'

import type { MessageSummaryDto } from '@/services/filtersService'
import type { AttachmentDto } from '@/services/messagesService'
import { useFiltersStore } from '@/stores/filters'

export type AttachmentsState = 'idle' | 'loading' | 'ok' | 'none' | 'failed'

export const AttachmentsMessages = {
  none: 'Nessun allegato salvato per questa mail.',
  failed: 'Impossibile leggere gli allegati salvati: riprova.',
} as const

/** Dialogo "Allegati salvati" di una mail dell'anteprima (GET /messages/{id}/attachments). */
export function useMessageAttachments() {
  const store = useFiltersStore()
  const message = ref<MessageSummaryDto | null>(null)
  const state = ref<AttachmentsState>('idle')
  const items = ref<AttachmentDto[]>([])

  const open = computed({
    get: () => message.value !== null,
    set: (value: boolean) => {
      if (!value) message.value = null
    },
  })

  async function show(target: MessageSummaryDto): Promise<void> {
    message.value = target
    state.value = 'loading'
    items.value = []
    const result = await store.loadAttachments(target.id)
    // Chiusa nel frattempo, o aperta su un'altra mail: il risultato non serve più.
    if (message.value?.id !== target.id) return
    if (result.kind === 'ok') items.value = result.items
    state.value = result.kind
  }

  return { message, open, state, items, show }
}
