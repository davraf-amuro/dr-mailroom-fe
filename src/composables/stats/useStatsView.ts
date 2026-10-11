import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'

import type { SenderOverviewSortBy } from '@/services/statsService'
import { useStatsStore } from '@/stores/stats'
import { formatCount } from '@/utils/formatNumber'
import { createFilterLocation, isAllSent, nextSort, sentLabel } from './statsPresentation'

export const STATS_SEARCH_DEBOUNCE_MS = 300

/** Frase-titolo della cella eroe: totale, anno e quota del mittente più attivo (segnalato se è la propria posta inviata). */
export function heroSentence(
  mailTotal: number,
  year: string,
  top:
    { senderAddress: string; mailCount: number | string; sentCount?: number | string } | undefined,
): { headline: string; detail: string | null } {
  const headline = `${formatCount(mailTotal)} mail ${year === '' ? 'in archivio' : `nel ${year}`}`
  if (top === undefined || mailTotal <= 0) return { headline, detail: null }
  const share = Math.round((Number(top.mailCount) / mailTotal) * 100)
  const count = formatCount(Number(top.mailCount))
  if (isAllSent({ mailCount: top.mailCount, sentCount: top.sentCount ?? 0 })) {
    return {
      headline,
      detail: `Il mittente più attivo è la tua posta inviata, ${top.senderAddress}: ${count} mail (${share}%).`,
    }
  }
  return {
    headline,
    detail: `Il mittente più attivo, ${top.senderAddress}, ne ha scritte ${count} (${share}%).`,
  }
}

/** Orchestra la vista Statistiche: casella, anno, ricerca, ordinamento, pagina, classifica e dettaglio. */
export function useStatsView() {
  const store = useStatsStore()
  const router = useRouter()
  const {
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
  } = storeToRefs(store)

  const searchText = ref(search.value)
  const liveMessage = ref('')

  watchDebounced(
    searchText,
    (text) => {
      if (text.trim() !== search.value.trim()) void store.setSearch(text)
    },
    { debounce: STATS_SEARCH_DEBOUNCE_MS },
  )

  async function changeMailbox(id: string): Promise<void> {
    const name = mailboxes.value.find((m) => String(m.id) === id)?.emailAddress ?? 'casella'
    liveMessage.value = `Caricamento delle statistiche di ${name}`
    searchText.value = ''
    await store.selectMailbox(id)
    liveMessage.value = `Statistiche di ${name}: ${formatCount(totalCount.value)} mittenti`
  }

  function changeYear(choice: string): Promise<void> {
    return store.setYear(choice)
  }

  function sort(next: SenderOverviewSortBy): Promise<void> {
    const target = nextSort({ sortBy: sortBy.value, sortDir: sortDir.value }, next)
    return store.setSort(target.sortBy, target.sortDir)
  }

  /** Clic su una barra della classifica: la tabella cerca quel mittente. */
  function focusSender(senderAddress: string): void {
    searchText.value = senderAddress
    void store.setSearch(senderAddress)
  }

  function createFilter(senderAddress: string): void {
    void router.push(createFilterLocation(senderAddress))
  }

  const detailOpen = computed({
    get: () => detailAddress.value !== null,
    set: (value: boolean) => {
      if (!value) store.closeDetail()
    },
  })

  const hero = computed(() => heroSentence(mailTotal.value, year.value, top.value[0]))

  /** Segno di posta inviata del mittente aperto nel dettaglio, dalla riga già letta (tabella o classifica). */
  const detailSentLabel = computed(() => {
    const row = [...rows.value, ...top.value].find((r) => r.senderAddress === detailAddress.value)
    return row ? sentLabel(row) : null
  })
  const filtered = computed(() => search.value.trim() !== '')

  onMounted(() => {
    // Lo store sopravvive alla vista: se una casella è già scelta si rilegge, altrimenti si propone la prima.
    if (mailboxId.value === '') void store.loadMailboxes()
    else void Promise.all([store.loadMailboxes(), store.loadOverview()])
  })

  return {
    mailboxes,
    mailboxId,
    selectedMailbox,
    years,
    year,
    searchText,
    filtered,
    sortBy,
    sortDir,
    page,
    pages,
    rows,
    totalCount,
    loadState,
    top,
    hero,
    liveMessage,
    detailOpen,
    detailAddress,
    detailYears,
    detailState,
    detailSentLabel,
    notice,
    clearNotice: store.clearNotice,
    reload: store.loadOverview,
    changeMailbox,
    changeYear,
    sort,
    setPage: store.setPage,
    openDetail: store.openDetail,
    focusSender,
    createFilter,
  }
}
