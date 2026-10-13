import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useNotice } from '@/composables/shared/useNotice'
import { pageCount } from '@/composables/stats/statsPresentation'
import type { ApiOutcome } from '@/services/api/problem'
import {
  getFilter,
  listFilterMessages,
  type FilterDto,
  type FilterMessageDto,
} from '@/services/filtersService'
import {
  getMessageContent,
  getMessageText,
  type MessageContentFormat,
} from '@/services/messagesService'
import { SortDirectionValue } from '@/services/statsService'
import type { LoadState } from '@/stores/stats'
import { saveBlob } from '@/utils/downloadFile'
import {
  FILTER_MESSAGES_PAGE_SIZE,
  FilterMessagesMessages,
  parseFilterMessagesState,
  toFilterMessagesQuery,
  type FilterMessagesState,
} from './filterMessagesPresentation'

function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

/** Popup "Testo": mail mostrata, caricamento, testo o errore. */
export interface MessageTextState {
  open: boolean
  message: FilterMessageDto | null
  loading: boolean
  text: string | null
  error: string | null
}

export interface UseFilterMessagesOptions {
  /** Salva il file scaricato; sostituibile nei test. */
  save?: (blob: Blob, fileName: string) => void
}

/**
 * Tabella delle mail di un filtro: filtro e pagina dal percorso e dalla query string, download del contenuto
 * archiviato (.eml o .txt) e popup con il testo leggibile.
 */
export function useFilterMessages(options: UseFilterMessagesOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const save = options.save ?? saveBlob

  const state = computed<FilterMessagesState>(() =>
    parseFilterMessagesState(route.params.id, route.query),
  )
  const filter = ref<FilterDto | null>(null)
  const rows = ref<FilterMessageDto[]>([])
  const totalCount = ref(0)
  const missingArchiveCount = ref(0)
  const hasContentArchive = ref(false)
  const loadState = ref<LoadState>('idle')
  const filterMissing = ref(false)
  /** Chiave "id:formato" del download in corso, per il pulsante occupato. */
  const downloading = ref<string | null>(null)
  const textState = reactive<MessageTextState>({
    open: false,
    message: null,
    loading: false,
    text: null,
    error: null,
  })
  const { notice, showNotice, clearNotice } = useNotice()

  const pages = computed(() => pageCount(totalCount.value, FILTER_MESSAGES_PAGE_SIZE))

  // Le risposte arrivate fuori ordine (cambio pagina veloce) si scartano.
  let request = 0

  async function loadFilter(id: number): Promise<boolean> {
    if (filter.value !== null && Number(filter.value.id) === id) return true
    const outcome = await getFilter(id)
    if (outcome.kind === 'ok') {
      filter.value = outcome.data
      return true
    }
    filter.value = null
    reportLoadFailure(outcome)
    return false
  }

  function reportLoadFailure(outcome: ApiOutcome<unknown>): void {
    loadState.value = 'error'
    if (outcome.kind === 'notFound') {
      filterMissing.value = true
      showNotice('warning', FilterMessagesMessages.filterMissing)
    } else if (!isGlobalAlarm(outcome.kind)) {
      showNotice('error', FilterMessagesMessages.loadFailed)
    }
  }

  async function load(): Promise<void> {
    const current = state.value
    filterMissing.value = false
    if (current.filterId === null) {
      filter.value = null
      rows.value = []
      totalCount.value = 0
      filterMissing.value = true
      loadState.value = 'idle'
      return
    }
    const id = ++request
    loadState.value = 'loading'
    if (!(await loadFilter(current.filterId)) || id !== request) return

    const outcome = await listFilterMessages(current.filterId, {
      sortDir: current.sortDir,
      page: current.page,
      pageSize: FILTER_MESSAGES_PAGE_SIZE,
    })
    if (id !== request) return
    if (outcome.kind === 'ok') {
      rows.value = outcome.data.items
      totalCount.value = Number(outcome.data.totalCount)
      missingArchiveCount.value = Number(outcome.data.missingArchiveCount)
      hasContentArchive.value = outcome.data.hasContentArchive
      loadState.value = rows.value.length > 0 ? 'ready' : 'empty'
      return
    }
    rows.value = []
    totalCount.value = 0
    reportLoadFailure(outcome)
  }

  function update(patch: Partial<FilterMessagesState>): void {
    void router.replace({ query: toFilterMessagesQuery({ ...state.value, ...patch }) })
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

  /** Testo dell'avviso per un errore del contenuto; null = lo segnala già il banner globale. */
  function contentFailureText(outcome: ApiOutcome<unknown>, fallback: string): string | null {
    if (outcome.kind === 'notFound') return FilterMessagesMessages.contentMissing
    if (outcome.kind === 'conflict') return FilterMessagesMessages.contentUnreadable
    return isGlobalAlarm(outcome.kind) ? null : fallback
  }

  async function download(message: FilterMessageDto, format: MessageContentFormat): Promise<void> {
    const key = `${message.id}:${format}`
    if (downloading.value !== null) return
    downloading.value = key
    try {
      const outcome = await getMessageContent(message.id, format)
      if (outcome.kind === 'ok') {
        save(outcome.data.blob, outcome.data.fileName)
        return
      }
      const text = contentFailureText(outcome, FilterMessagesMessages.downloadFailed)
      if (text !== null) showNotice(outcome.kind === 'notFound' ? 'warning' : 'error', text)
    } finally {
      downloading.value = null
    }
  }

  function isDownloading(message: FilterMessageDto, format: MessageContentFormat): boolean {
    return downloading.value === `${message.id}:${format}`
  }

  // Ogni apertura del popup ha il suo numero: una risposta di un'apertura superata si scarta.
  let textRequest = 0

  async function openText(message: FilterMessageDto): Promise<void> {
    const id = ++textRequest
    textState.open = true
    textState.message = message
    textState.loading = true
    textState.text = null
    textState.error = null
    const outcome = await getMessageText(message.id)
    // Popup chiuso o passato a un'altra mail nel frattempo: la risposta non serve più
    if (id !== textRequest) return
    textState.loading = false
    if (outcome.kind === 'ok') {
      textState.text = outcome.data
      return
    }
    textState.error =
      contentFailureText(outcome, FilterMessagesMessages.textFailed) ??
      FilterMessagesMessages.textFailed
  }

  function closeText(): void {
    textRequest++
    textState.open = false
    textState.message = null
  }

  watch(
    () => route.fullPath,
    () => void load(),
    { immediate: true },
  )

  return {
    state,
    filter,
    rows,
    totalCount,
    missingArchiveCount,
    hasContentArchive,
    loadState,
    filterMissing,
    pages,
    textState,
    notice,
    showNotice,
    clearNotice,
    reload: load,
    setPage,
    toggleSort,
    download,
    isDownloading,
    openText,
    closeText,
  }
}
