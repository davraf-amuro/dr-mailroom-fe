import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { watchDebounced } from '@vueuse/core'

import type { FilterDto } from '@/services/filtersService'
import { useFiltersStore } from '@/stores/filters'
import { useFilterBuilder } from './useFilterBuilder'
import { useFilterReapply, type ReapplyOptions } from './useFilterReapply'
import { useMessageAttachments } from './useMessageAttachments'
import { useSenderPrefill } from './useSenderPrefill'

export const SEARCH_DEBOUNCE_MS = 300

/** Testo della conferma di cancellazione (specifica: le allerte già create restano). */
export const DELETE_CONFIRM_TEXT =
  'Il filtro smette di lavorare le mail nuove. Le allerte già create restano. Gli allegati già salvati non vengono toccati.'

export type EnabledChoice = '' | 'true' | 'false'

/** Orchestra la vista Filtri: elenco, ricerca, costruttore, cancellazione, riapplica, allegati. */
export function useFiltersView(options: ReapplyOptions = {}) {
  const store = useFiltersStore()
  const { items, loadState, hasFilter, notice, selectableMailboxes, mailboxNames, deletingId } =
    storeToRefs(store)

  const builder = useFilterBuilder()
  const reapply = useFilterReapply(options)
  const attachments = useMessageAttachments()

  const searchName = ref(store.filter.name ?? '')
  const searchSender = ref(store.filter.senderAddress ?? '')
  const searchMailbox = ref<string>(
    store.filter.mailboxId === undefined ? '' : String(store.filter.mailboxId),
  )
  const searchEnabled = ref<EnabledChoice>(
    store.filter.isEnabled === undefined ? '' : store.filter.isEnabled ? 'true' : 'false',
  )
  watchDebounced(
    [searchName, searchSender, searchMailbox, searchEnabled],
    ([name, senderAddress, mailbox, enabled]) =>
      void store.setFilter({
        name,
        senderAddress,
        mailboxId: mailbox === '' ? undefined : Number(mailbox),
        isEnabled: enabled === '' ? undefined : enabled === 'true',
      }),
    { debounce: SEARCH_DEBOUNCE_MS },
  )

  // Precompilazione dal link "Crea filtro" delle statistiche: `/filters?sender=<indirizzo>`.
  useSenderPrefill(builder.prefillSender)

  onMounted(() => {
    void store.loadMailboxes()
    void store.load()
  })

  const pendingDelete = ref<FilterDto | null>(null)
  const deleteOpen = computed({
    get: () => pendingDelete.value !== null,
    set: (value: boolean) => {
      if (!value) pendingDelete.value = null
    },
  })
  const deleteBusy = computed(
    () => pendingDelete.value !== null && deletingId.value === String(pendingDelete.value.id),
  )

  function askDelete(filter: FilterDto): void {
    pendingDelete.value = filter
  }

  async function confirmDelete(): Promise<void> {
    const filter = pendingDelete.value
    if (filter === null) return
    const removed = await store.remove(filter.id)
    pendingDelete.value = null
    // Se si stava modificando proprio questo filtro, il costruttore torna vuoto.
    if (removed && builder.editing.value?.id === filter.id) builder.reset()
  }

  return {
    items,
    loadState,
    hasFilter,
    notice,
    clearNotice: store.clearNotice,
    reload: store.load,
    mailboxes: selectableMailboxes,
    mailboxNames,
    builder,
    searchName,
    searchSender,
    searchMailbox,
    searchEnabled,
    pendingDelete,
    deletingId,
    deleteOpen,
    deleteBusy,
    askDelete,
    confirmDelete,
    reapply,
    attachments,
  }
}
