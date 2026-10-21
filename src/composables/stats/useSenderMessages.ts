import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'

import { useNotice } from '@/composables/shared/useNotice'
import {
  SENDER_MESSAGES_PAGE_SIZE,
  SENDER_MESSAGES_SEARCH_DEBOUNCE_MS,
  parseSenderMessagesQuery,
  toSenderMessagesQuery,
  type SenderMessagesState,
} from '@/composables/stats/senderMessagesPresentation'
import { pageCount } from '@/composables/stats/statsPresentation'
import { getMailbox } from '@/services/mailboxesService'
import { listSenderMessages, type SenderMessageDto } from '@/services/messagesService'
import { SortDirectionValue } from '@/services/statsService'
import type { LoadState } from '@/stores/stats'

export const SenderMessagesMessages = {
  loadFailed: 'Impossibile leggere le mail del mittente: riprova tra poco.',
  mailboxMissing: 'La casella indicata nel link non esiste più.',
} as const

function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

/** Griglia delle mail di un mittente: lo stato vive nella query string, la vista la legge e la aggiorna. */
export function useSenderMessages() {
  const route = useRoute()
  const router = useRouter()

  const state = computed<SenderMessagesState>(() => parseSenderMessagesQuery(route.query))
  const rows = ref<SenderMessageDto[]>([])
  const totalCount = ref(0)
  const loadState = ref<LoadState>('idle')
  const searchText = ref(state.value.search)
  /** Indirizzo della casella, per aprire le mail nell'account Gmail giusto; null finché non è noto. */
  const mailboxAddress = ref<string | null>(null)
  const { notice, showNotice, clearNotice } = useNotice()

  /** Link completo: casella valida e mittente presente. */
  const linkComplete = computed(
    () => state.value.mailboxId !== null && state.value.senderAddress !== '',
  )
  const pages = computed(() => pageCount(totalCount.value, SENDER_MESSAGES_PAGE_SIZE))
  const filtered = computed(() => state.value.search !== '')

  // Le risposte arrivate fuori ordine (ricerca veloce, cambio pagina) si scartano.
  let request = 0

  async function load(): Promise<void> {
    const current = state.value
    if (current.mailboxId === null || current.senderAddress === '') {
      rows.value = []
      totalCount.value = 0
      loadState.value = 'idle'
      return
    }
    const id = ++request
    loadState.value = 'loading'
    const outcome = await listSenderMessages({
      mailboxId: current.mailboxId,
      senderAddress: current.senderAddress,
      search: current.search,
      sortDir: current.sortDir,
      page: current.page,
      pageSize: SENDER_MESSAGES_PAGE_SIZE,
    })
    if (id !== request) return
    if (outcome.kind === 'ok') {
      rows.value = outcome.data.items
      totalCount.value = Number(outcome.data.totalCount)
      loadState.value = rows.value.length > 0 ? 'ready' : 'empty'
      return
    }
    rows.value = []
    totalCount.value = 0
    loadState.value = 'error'
    if (outcome.kind === 'notFound') {
      showNotice('warning', SenderMessagesMessages.mailboxMissing)
    } else if (!isGlobalAlarm(outcome.kind)) {
      showNotice('error', SenderMessagesMessages.loadFailed)
    }
  }

  function update(patch: Partial<SenderMessagesState>): void {
    void router.replace({ query: toSenderMessagesQuery({ ...state.value, ...patch }) })
  }

  function setPage(page: number): void {
    update({ page })
  }

  function toggleSort(): void {
    update({
      sortDir:
        state.value.sortDir === SortDirectionValue.Desc
          ? SortDirectionValue.Asc
          : SortDirectionValue.Desc,
      page: 1,
    })
  }

  // Nuova ricerca → si riparte dalla prima pagina.
  watchDebounced(
    searchText,
    (text) => {
      if (text.trim() !== state.value.search) update({ search: text.trim(), page: 1 })
    },
    { debounce: SENDER_MESSAGES_SEARCH_DEBOUNCE_MS },
  )

  // Link aperto o cambiato (Indietro del browser, altro mittente): il campo segue la query.
  watch(
    () => state.value.search,
    (search) => {
      if (search !== searchText.value.trim()) searchText.value = search
    },
  )

  watch(
    () => route.fullPath,
    () => void load(),
    { immediate: true },
  )

  // Casella del link: se ne legge l'indirizzo una volta per casella (errori ignorati: il link Gmail resta valido).
  watch(
    () => state.value.mailboxId,
    async (mailboxId) => {
      mailboxAddress.value = null
      if (mailboxId === null) return
      const outcome = await getMailbox(mailboxId)
      if (outcome.kind === 'ok' && state.value.mailboxId === mailboxId) {
        mailboxAddress.value = outcome.data.emailAddress
      }
    },
    { immediate: true },
  )

  return {
    state,
    rows,
    totalCount,
    loadState,
    searchText,
    mailboxAddress,
    linkComplete,
    pages,
    filtered,
    notice,
    showNotice,
    clearNotice,
    reload: load,
    setPage,
    toggleSort,
  }
}
