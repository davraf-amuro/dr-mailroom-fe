import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStorage, watchDebounced } from '@vueuse/core'

import type { MailboxDto, MailboxId, MailboxStatus } from '@/services/mailboxesService'
import { useMailboxesStore } from '@/stores/mailboxes'
import { useMailboxPolling } from './useMailboxPolling'
import { useOAuthReturn } from './useOAuthReturn'

export type MailboxesLayout = 'cards' | 'table'

/** Preferenza di interfaccia (non sensibile): card o tabella. */
export const MAILBOXES_LAYOUT_STORAGE_KEY = 'dr-mailroom-mailboxes-layout'
export const SEARCH_DEBOUNCE_MS = 300

/** Testo della conferma di eliminazione (specifica, "Eliminare una casella"). */
export const DELETE_CONFIRM_TEXT =
  "La casella non verrà più letta e i suoi filtri non saranno più modificabili. Statistiche e storico restano consultabili. L'operazione non si annulla dal frontend."

export interface MailboxesViewOptions {
  /** Porta il browser su Google; sostituibile nei test. */
  navigate?: (url: string) => void
}

export function useMailboxesView(options: MailboxesViewOptions = {}) {
  const navigate = options.navigate ?? ((url: string) => window.location.assign(url))
  const store = useMailboxesStore()
  const { items, loadState, hasFilter, counts, busy, connecting, notice, detail, detailLoading } =
    storeToRefs(store)

  const layout = useStorage<MailboxesLayout>(MAILBOXES_LAYOUT_STORAGE_KEY, 'cards')

  const searchEmail = ref(store.filter.emailAddress ?? '')
  const searchStatus = ref<MailboxStatus | ''>(store.filter.status ?? '')
  watchDebounced(
    [searchEmail, searchStatus],
    ([emailAddress, status]) =>
      void store.setFilter({ emailAddress, status: status === '' ? undefined : status }),
    { debounce: SEARCH_DEBOUNCE_MS },
  )

  /** Casella appena collegata: la più recente dopo il ritorno da Google. */
  const highlightId = ref<string | null>(null)
  let highlightNewest = false

  useOAuthReturn((result) => {
    store.showNotice(result.tone, result.text)
    highlightNewest = result.tone === 'ok'
  })

  onMounted(async () => {
    await store.load()
    if (highlightNewest && items.value.length > 0) {
      const newest = items.value.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a))
      highlightId.value = String(newest.id)
    }
  })

  // Avanzamento dei giri: rilettura silenziosa finché c'è qualcosa da seguire
  useMailboxPolling(items, store.refreshSilently)

  async function connect(): Promise<void> {
    const url = await store.requestConnectUrl()
    if (url !== null) navigate(url)
  }

  const pendingDelete = ref<MailboxDto | null>(null)
  const deleteOpen = computed({
    get: () => pendingDelete.value !== null,
    set: (value: boolean) => {
      if (!value) pendingDelete.value = null
    },
  })
  const deleteBusy = computed(
    () => pendingDelete.value !== null && busy.value[String(pendingDelete.value.id)] === 'delete',
  )

  function askDelete(mailbox: MailboxDto): void {
    pendingDelete.value = mailbox
  }

  async function confirmDelete(): Promise<void> {
    if (pendingDelete.value === null) return
    await store.remove(pendingDelete.value.id)
    pendingDelete.value = null
  }

  const detailOpen = ref(false)

  async function openDetails(id: MailboxId): Promise<void> {
    detailOpen.value = true
    const found = await store.loadDetail(id)
    if (!found) detailOpen.value = false
  }

  return {
    items,
    loadState,
    hasFilter,
    counts,
    busy,
    connecting,
    notice,
    clearNotice: store.clearNotice,
    reload: store.load,
    layout,
    searchEmail,
    searchStatus,
    highlightId,
    connect,
    pause: store.pause,
    resume: store.resume,
    pendingDelete,
    deleteOpen,
    deleteBusy,
    askDelete,
    confirmDelete,
    detail,
    detailLoading,
    detailOpen,
    openDetails,
  }
}
