import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  STATS_PAGE_SIZE,
  TOP_SENDERS_COUNT,
  defaultDirection,
  pageCount,
} from '@/composables/stats/statsPresentation'
import { useNotice } from '@/composables/shared/useNotice'
import {
  listMailboxSummaries,
  MailboxStatusValue,
  type MailboxSummaryDto,
} from '@/services/mailboxesService'
import {
  getSenderOverview,
  listYearStats,
  SenderOverviewSortByValue,
  SortDirectionValue,
  type SenderOverviewDto,
  type SenderOverviewSortBy,
  type SortDirection,
  type YearStatDto,
} from '@/services/statsService'

export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export const StatsMessages = {
  loadFailed: 'Impossibile leggere le statistiche: riprova tra poco.',
  mailboxMissing: 'La casella non esiste più: elenco aggiornato.',
  detailFailed: 'Impossibile leggere il dettaglio del mittente: riprova.',
} as const

function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

/** Casella proposta all'apertura: la prima attiva, altrimenti la prima (anche eliminata: le statistiche restano). */
export function defaultMailboxId(mailboxes: MailboxSummaryDto[]): string {
  const active = mailboxes.find((m) => m.status === MailboxStatusValue.Active)
  const chosen = active ?? mailboxes[0]
  return chosen === undefined ? '' : String(chosen.id)
}

export const useStatsStore = defineStore('stats', () => {
  const mailboxes = ref<MailboxSummaryDto[]>([])
  const mailboxId = ref('')
  const years = ref<YearStatDto[]>([])
  /** "" = tutti gli anni. */
  const year = ref('')
  const search = ref('')
  const sortBy = ref<SenderOverviewSortBy>(SenderOverviewSortByValue.MailCount)
  const sortDir = ref<SortDirection>(SortDirectionValue.Desc)
  const page = ref(1)

  const rows = ref<SenderOverviewDto[]>([])
  const totalCount = ref(0)
  const loadState = ref<LoadState>('idle')
  const top = ref<SenderOverviewDto[]>([])

  const detailAddress = ref<string | null>(null)
  const detailYears = ref<YearStatDto[]>([])
  const detailState = ref<LoadState>('idle')

  const { notice, showNotice, clearNotice } = useNotice()

  // Le risposte arrivate fuori ordine (ricerca veloce, cambio casella) si scartano.
  let overviewRequest = 0
  let topRequest = 0

  const selectedMailbox = computed(
    () => mailboxes.value.find((m) => String(m.id) === mailboxId.value) ?? null,
  )
  const pages = computed(() => pageCount(totalCount.value, STATS_PAGE_SIZE))
  const yearNumber = computed(() => (year.value === '' ? undefined : Number(year.value)))
  const mailTotal = computed(() =>
    years.value
      .filter((y) => year.value === '' || String(y.year) === year.value)
      .reduce((sum, y) => sum + Number(y.mailCount), 0),
  )

  async function loadMailboxes(): Promise<void> {
    const outcome = await listMailboxSummaries()
    mailboxes.value = outcome.kind === 'ok' ? outcome.data : []
    if (selectedMailbox.value === null) {
      const next = defaultMailboxId(mailboxes.value)
      if (next !== '') await selectMailbox(next)
      else loadState.value = 'empty'
    }
  }

  async function loadOverview(): Promise<void> {
    if (mailboxId.value === '') return
    const request = ++overviewRequest
    loadState.value = 'loading'
    const outcome = await getSenderOverview({
      mailboxId: Number(mailboxId.value),
      year: yearNumber.value,
      search: search.value,
      sortBy: sortBy.value,
      sortDir: sortDir.value,
      page: page.value,
      pageSize: STATS_PAGE_SIZE,
    })
    if (request !== overviewRequest) return
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
      showNotice('warning', StatsMessages.mailboxMissing)
      mailboxId.value = ''
      await loadMailboxes()
    } else if (!isGlobalAlarm(outcome.kind)) {
      showNotice('error', StatsMessages.loadFailed)
    }
  }

  /** Classifica: i primi 20 per numero di mail nell'anno scelto, senza la ricerca della tabella. */
  async function loadTop(): Promise<void> {
    if (mailboxId.value === '') return
    const request = ++topRequest
    const outcome = await getSenderOverview({
      mailboxId: Number(mailboxId.value),
      year: yearNumber.value,
      sortBy: SenderOverviewSortByValue.MailCount,
      sortDir: SortDirectionValue.Desc,
      page: 1,
      pageSize: TOP_SENDERS_COUNT,
    })
    if (request !== topRequest) return
    top.value = outcome.kind === 'ok' ? outcome.data.items : []
  }

  /** Rilettura completa della casella scelta (riapertura della vista): totale per anno, tabella e classifica. */
  async function reload(): Promise<void> {
    await Promise.all([loadYears(), loadOverview(), loadTop()])
  }

  async function loadYears(): Promise<void> {
    if (mailboxId.value === '') return
    const outcome = await listYearStats(Number(mailboxId.value))
    years.value = outcome.kind === 'ok' ? outcome.data : []
  }

  /** Cambio casella: anno, ricerca, ordinamento e pagina ripartono dai valori iniziali. */
  async function selectMailbox(id: string): Promise<void> {
    mailboxId.value = id
    year.value = ''
    search.value = ''
    sortBy.value = SenderOverviewSortByValue.MailCount
    sortDir.value = SortDirectionValue.Desc
    page.value = 1
    await Promise.all([loadYears(), loadOverview(), loadTop()])
  }

  async function setYear(choice: string): Promise<void> {
    year.value = choice
    page.value = 1
    await Promise.all([loadOverview(), loadTop()])
  }

  function setSearch(text: string): Promise<void> {
    search.value = text
    page.value = 1
    return loadOverview()
  }

  function setSort(next: SenderOverviewSortBy, direction?: SortDirection): Promise<void> {
    sortBy.value = next
    sortDir.value = direction ?? defaultDirection(next)
    page.value = 1
    return loadOverview()
  }

  function setPage(next: number): Promise<void> {
    page.value = Math.min(Math.max(1, next), pages.value)
    return loadOverview()
  }

  /** Dettaglio del mittente: mail per anno, indirizzo confrontato per uguaglianza. */
  async function openDetail(senderAddress: string): Promise<void> {
    detailAddress.value = senderAddress
    detailYears.value = []
    detailState.value = 'loading'
    const outcome = await listYearStats(Number(mailboxId.value), senderAddress)
    if (detailAddress.value !== senderAddress) return
    if (outcome.kind === 'ok') {
      detailYears.value = outcome.data
      detailState.value = outcome.data.length > 0 ? 'ready' : 'empty'
    } else {
      detailState.value = 'error'
      if (!isGlobalAlarm(outcome.kind)) showNotice('error', StatsMessages.detailFailed)
    }
  }

  function closeDetail(): void {
    detailAddress.value = null
  }

  return {
    mailboxes,
    mailboxId,
    selectedMailbox,
    years,
    year,
    search,
    sortBy,
    sortDir,
    page,
    pages,
    rows,
    totalCount,
    mailTotal,
    loadState,
    top,
    detailAddress,
    detailYears,
    detailState,
    notice,
    clearNotice,
    loadMailboxes,
    loadOverview,
    reload,
    selectMailbox,
    setYear,
    setSearch,
    setSort,
    setPage,
    openDetail,
    closeDetail,
  }
})
