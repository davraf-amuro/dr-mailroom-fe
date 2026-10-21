import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { RUNS_QUERY } from '@/composables/filters/useFilterReapply'
import { useThrottledAnnouncer } from '@/composables/shared/useThrottledAnnouncer'
import type { RunDto, RunStatus, RunTrigger } from '@/services/runsService'
import { useRunsStore } from '@/stores/runs'
import { formatCount } from '@/utils/formatNumber'
import {
  localDayEndUtc,
  localDayStartUtc,
  mailboxName,
  parseIdList,
  runStatusPresentation,
} from './runPresentation'
import { useRunPolling } from './useRunPolling'

/** Giorni proposti nel filtro "Avviati dal" all'apertura della vista. */
export const HISTORY_DEFAULT_DAYS = 7

/** Giorno locale (yyyy-mm-dd) di `days` giorni fa, per il campo data. */
export function localDayDaysAgo(days: number, now: Date = new Date()): string {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

/** Conferma in sospeso: un giro oppure tutti. */
export type PendingCancel = { kind: 'one'; run: RunDto } | { kind: 'all' }

/** Orchestra la vista Esecuzioni: ponte di lancio, polling, annullamento, cronologia filtrata. */
export function useRunsView() {
  const store = useRunsStore()
  const route = useRoute()
  const router = useRouter()
  const {
    history,
    loadState,
    hasFilter,
    focusIds,
    skippedMailboxNames,
    bridge,
    bridgeHasRunning,
    recent,
    mailboxes,
    launchableMailboxes,
    mailboxNames,
    filterNames,
    launching,
    cancellingId,
    cancellingAll,
    notice,
  } = storeToRefs(store)

  const { message: liveMessage, announce } = useThrottledAnnouncer()

  // Ponte di lancio
  const launchMailbox = ref('')

  async function launch(): Promise<void> {
    await store.launch(launchMailbox.value === '' ? null : Number(launchMailbox.value))
  }

  function progressText(run: RunDto): string {
    const name = mailboxName(run.mailboxId, mailboxNames.value)
    return `Giro ${run.id} su ${name}: ${formatCount(Number(run.messagesRead))} mail lette, ${runStatusPresentation[run.status].label.toLowerCase()}`
  }

  async function poll(): Promise<void> {
    const before = new Map(bridge.value.map((r) => [String(r.id), Number(r.messagesRead)]))
    const finished = await store.pollRunning()
    const target =
      finished[0] ??
      bridge.value.find(
        (r) => before.has(String(r.id)) && before.get(String(r.id)) !== Number(r.messagesRead),
      )
    if (target !== undefined) announce(progressText(target))
  }

  useRunPolling(bridgeHasRunning, poll)

  // Annullamento
  const pendingCancel = ref<PendingCancel | null>(null)
  const cancelOpen = computed({
    get: () => pendingCancel.value !== null,
    set: (value: boolean) => {
      if (!value) pendingCancel.value = null
    },
  })
  const cancelBusy = computed(() => {
    const pending = pendingCancel.value
    if (pending === null) return false
    return pending.kind === 'all'
      ? cancellingAll.value
      : cancellingId.value === String(pending.run.id)
  })
  const cancelTitle = computed(() => {
    const pending = pendingCancel.value
    if (pending?.kind === 'one') return `Annullare il giro ${pending.run.id}?`
    return 'Annullare tutti i giri in corso?'
  })

  function askCancel(run: RunDto): void {
    pendingCancel.value = { kind: 'one', run }
  }

  function askCancelAll(): void {
    pendingCancel.value = { kind: 'all' }
  }

  async function confirmCancel(): Promise<void> {
    const pending = pendingCancel.value
    if (pending === null) return
    if (pending.kind === 'all') await store.cancelAll()
    else await store.cancel(pending.run.id)
    pendingCancel.value = null
  }

  // Cronologia: filtri proposti, letta solo con «Carica» (la tabella dei giri può essere lunga)
  const filterMailbox = ref('')
  const filterTrigger = ref<RunTrigger | ''>('')
  const filterStatus = ref<RunStatus | ''>('')
  const filterFrom = ref(localDayDaysAgo(HISTORY_DEFAULT_DAYS))
  const filterTo = ref('')

  function loadHistory(): Promise<void> {
    return store.setFilter({
      mailboxId: filterMailbox.value === '' ? undefined : Number(filterMailbox.value),
      trigger: filterTrigger.value === '' ? undefined : filterTrigger.value,
      status: filterStatus.value === '' ? undefined : filterStatus.value,
      startedAtUtcFrom: localDayStartUtc(filterFrom.value),
      startedAtUtcTo: localDayEndUtc(filterTo.value),
    })
  }

  // Query della riapplica: `?runIds=4,5&skippedMailboxIds=2`
  const focused = computed(() => focusIds.value.length > 0)

  watch(
    () => route.query,
    (query, previous) => {
      store.setFocus(
        parseIdList(query, RUNS_QUERY.runIds),
        parseIdList(query, RUNS_QUERY.skippedMailboxIds),
      )
      if (previous === undefined) return
      // Giri della riapplica: si mostrano subito; «Tutta la cronologia» torna ai filtri, da caricare
      if (focusIds.value.length > 0) void store.loadHistory()
      else store.resetHistory()
    },
    { immediate: true },
  )

  function showFullHistory(): void {
    void router.replace({ query: {} })
  }

  onMounted(() => {
    void store.loadReferences()
    void store.loadBridge()
    void store.loadRecent()
    // Lo store sopravvive alla vista: la cronologia riparte non caricata, salvo i giri della riapplica.
    if (focusIds.value.length > 0) void store.loadHistory()
    else store.resetHistory()
  })

  return {
    history,
    loadState,
    hasFilter,
    focused,
    skippedMailboxNames,
    showFullHistory,
    bridge,
    recent,
    mailboxes,
    launchableMailboxes,
    mailboxNames,
    filterNames,
    launchMailbox,
    launching,
    launch,
    cancellingId,
    cancellingAll,
    pendingCancel,
    cancelOpen,
    cancelBusy,
    cancelTitle,
    askCancel,
    askCancelAll,
    confirmCancel,
    filterMailbox,
    filterTrigger,
    filterStatus,
    filterFrom,
    filterTo,
    notice,
    clearNotice: store.clearNotice,
    loadHistory,
    reload: store.loadHistory,
    liveMessage,
  }
}
