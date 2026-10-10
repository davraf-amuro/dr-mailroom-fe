import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { hasRunningRun } from '@/composables/runs/runPresentation'
import { useNotice } from '@/composables/shared/useNotice'
import { listFilterSummaries, type FilterSummaryDto } from '@/services/filtersService'
import { listMailboxes, MailboxStatusValue, type MailboxDto } from '@/services/mailboxesService'
import {
  cancelAllRuns,
  cancelRun,
  getRun,
  listRuns,
  listRunSummaries,
  RunStatusValue,
  startRun,
  type RunDto,
  type RunId,
  type RunListFilter,
  type RunSummaryDto,
} from '@/services/runsService'

export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** Giri mostrati nel widget "ultimi giri" della cella eroe. */
export const RECENT_RUNS_LIMIT = 5

/** Testi della specifica, "Vista 3 — Esecuzioni". */
export const RunMessages = {
  started: 'Giro avviato: l’avanzamento compare nel ponte di lancio.',
  startedMany: (count: number) =>
    `${count} giri avviati: l’avanzamento compare nel ponte di lancio.`,
  backfill:
    'Il primo giro su una casella è lungo e legge tutto lo storico. In quel giro i filtri non si applicano: le mail vengono solo indicizzate per le statistiche. Per lavorare lo storico usa «Riapplica» dalla vista Filtri.',
  skipped: (names: string) => `Saltate perché già al lavoro: ${names}.`,
  startConflictOne: 'La casella ha già un giro in corso.',
  startConflictAll: 'Tutte le caselle hanno già un giro in corso.',
  mailboxMissing: 'La casella non esiste più: elenco aggiornato.',
  startFailed: 'Impossibile avviare il giro: riprova.',
  cancelRequested: 'Annullamento richiesto: il giro si ferma entro pochi secondi.',
  cancelAllRequested: (count: number) =>
    `Annullamento richiesto per ${count === 1 ? '1 giro' : `${count} giri`}: si fermano entro pochi secondi.`,
  cancelConflictOne: 'Il giro non è più in corso.',
  cancelConflictAll: 'Nessun giro in corso.',
  runMissing: 'Il giro non esiste più.',
  cancelFailed: 'Impossibile annullare: riprova.',
  loadFailed: 'Impossibile leggere la cronologia: riprova tra poco.',
} as const

/** Testo della conferma di annullamento (specifica). */
export const CANCEL_CONFIRM_TEXT =
  'Il giro si ferma e il lavoro già fatto resta salvato. Il cron ne avvierà uno nuovo al prossimo scatto: per fermare una casella più a lungo usa "Pausa" nella vista Caselle.'

function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

function sameId(a: RunId, b: RunId): boolean {
  return String(a) === String(b)
}

/** Giri letti uno per uno; quelli non più esistenti si scartano. */
async function fetchRuns(ids: RunId[]): Promise<RunDto[]> {
  const outcomes = await Promise.all(ids.map((id) => getRun(id)))
  return outcomes.flatMap((outcome) => (outcome.kind === 'ok' ? [outcome.data] : []))
}

export const useRunsStore = defineStore('runs', () => {
  const history = ref<RunDto[]>([])
  const loadState = ref<LoadState>('idle')
  const filter = ref<RunListFilter>({})
  /** Giri indicati dalla riapplica (`?runIds=`): se presenti, la cronologia mostra solo loro. */
  const focusIds = ref<string[]>([])
  const skippedMailboxIds = ref<string[]>([])
  /** Ponte di lancio: giri in corso e quelli avviati in questa visita, anche dopo la fine. */
  const bridge = ref<RunDto[]>([])
  const recent = ref<RunSummaryDto[]>([])
  const mailboxes = ref<MailboxDto[]>([])
  const filters = ref<FilterSummaryDto[]>([])
  const launching = ref(false)
  const cancellingId = ref<string | null>(null)
  const cancellingAll = ref(false)
  const { notice, showNotice, clearNotice } = useNotice()

  const mailboxNames = computed(
    () => new Map(mailboxes.value.map((m) => [String(m.id), m.emailAddress])),
  )
  const filterNames = computed(() => new Map(filters.value.map((f) => [String(f.id), f.name])))
  /** Solo le caselle attive possono partire: le altre risponderebbero 409. */
  const launchableMailboxes = computed(() =>
    mailboxes.value.filter((m) => m.status === MailboxStatusValue.Active),
  )
  const bridgeHasRunning = computed(() => hasRunningRun(bridge.value))
  const hasFilter = computed(() => Object.values(filter.value).some((v) => v !== undefined))
  const skippedMailboxNames = computed(() =>
    skippedMailboxIds.value.map((id) => mailboxNames.value.get(id) ?? `Casella ${id}`),
  )

  async function loadReferences(): Promise<void> {
    const [mailboxOutcome, filterOutcome] = await Promise.all([
      listMailboxes(),
      listFilterSummaries(),
    ])
    mailboxes.value = mailboxOutcome.kind === 'ok' ? mailboxOutcome.data : []
    filters.value = filterOutcome.kind === 'ok' ? filterOutcome.data : []
  }

  async function readHistory(): Promise<'ok' | 'empty' | 'error'> {
    if (focusIds.value.length > 0) {
      history.value = await fetchRuns(focusIds.value)
      return history.value.length > 0 ? 'ok' : 'empty'
    }
    const outcome = await listRuns(filter.value)
    if (outcome.kind === 'ok') {
      history.value = outcome.data
      return outcome.data.length > 0 ? 'ok' : 'empty'
    }
    if (outcome.kind === 'empty') {
      history.value = []
      return 'empty'
    }
    if (!isGlobalAlarm(outcome.kind)) showNotice('error', RunMessages.loadFailed)
    return 'error'
  }

  async function loadHistory(): Promise<void> {
    loadState.value = 'loading'
    const result = await readHistory()
    loadState.value = result === 'ok' ? 'ready' : result
  }

  /** Dopo la fine di un giro: niente stato "loading", un errore lascia l'ultimo elenco. */
  async function refreshSilently(): Promise<void> {
    if (focusIds.value.length > 0) {
      history.value = await fetchRuns(focusIds.value)
    } else {
      const outcome = await listRuns(filter.value)
      if (outcome.kind === 'ok') history.value = outcome.data
      else if (outcome.kind === 'empty') history.value = []
      else return
    }
    loadState.value = history.value.length > 0 ? 'ready' : 'empty'
  }

  async function loadRecent(): Promise<void> {
    const outcome = await listRunSummaries()
    recent.value = outcome.kind === 'ok' ? outcome.data.slice(0, RECENT_RUNS_LIMIT) : []
  }

  /** Ponte all'apertura: i giri Running, compresi quelli partiti dal cron. */
  async function loadBridge(): Promise<void> {
    const outcome = await listRuns({ status: RunStatusValue.Running })
    bridge.value = outcome.kind === 'ok' ? outcome.data : []
  }

  function setFilter(next: RunListFilter): Promise<void> {
    filter.value = next
    return loadHistory()
  }

  function setFocus(runIds: string[], skipped: string[]): void {
    focusIds.value = runIds
    skippedMailboxIds.value = skipped
  }

  function upsertBridge(runs: RunDto[]): void {
    const others = bridge.value.filter((b) => !runs.some((r) => sameId(r.id, b.id)))
    bridge.value = [...runs, ...others]
  }

  function patchHistory(run: RunDto): void {
    history.value = history.value.map((h) => (sameId(h.id, run.id) ? run : h))
  }

  /**
   * Rilegge i giri Running del ponte e restituisce quelli appena conclusi.
   * Alla fine di un giro si rileggono cronologia, ultimi giri e caselle (avanzamento dello storico).
   */
  async function pollRunning(): Promise<RunDto[]> {
    const running = bridge.value.filter((r) => r.status === RunStatusValue.Running)
    if (running.length === 0) return []
    const fresh = await fetchRuns(running.map((r) => r.id))
    bridge.value = bridge.value.map((b) => fresh.find((f) => sameId(f.id, b.id)) ?? b)
    fresh.forEach(patchHistory)
    const finished = fresh.filter((f) => f.status !== RunStatusValue.Running)
    if (finished.length > 0) {
      await Promise.all([refreshSilently(), loadRecent(), loadReferences()])
    }
    return finished
  }

  function launchNotice(targetId: number | null, startedCount: number, skipped: string[]): void {
    const targets =
      targetId === null
        ? launchableMailboxes.value
        : mailboxes.value.filter((m) => String(m.id) === String(targetId))
    const needsBackfill = targets.some(
      (m) => !m.backfillCompleted && !skipped.includes(String(m.id)),
    )
    const parts = [startedCount === 1 ? RunMessages.started : RunMessages.startedMany(startedCount)]
    if (skipped.length > 0) {
      parts.push(
        RunMessages.skipped(skipped.map((id) => mailboxNames.value.get(id) ?? id).join(', ')),
      )
    }
    if (needsBackfill) parts.push(RunMessages.backfill)
    const tone = skipped.length > 0 ? 'warning' : needsBackfill ? 'info' : 'ok'
    showNotice(tone, parts.join(' '))
  }

  /** "Esegui ora": 202 → giri nel ponte; 409 avviso (non errore); 400 casella inesistente. */
  async function launch(mailboxId: number | null): Promise<boolean> {
    launching.value = true
    try {
      const outcome = await startRun(mailboxId)
      switch (outcome.kind) {
        case 'accepted':
        case 'ok': {
          const started = await fetchRuns(outcome.data.runIds)
          upsertBridge(started)
          launchNotice(
            mailboxId,
            outcome.data.runIds.length,
            outcome.data.skippedMailboxIds.map(String),
          )
          await Promise.all([refreshSilently(), loadRecent()])
          return true
        }
        case 'conflict':
          showNotice(
            'warning',
            outcome.detail ??
              (mailboxId === null ? RunMessages.startConflictAll : RunMessages.startConflictOne),
          )
          return false
        case 'validation':
          showNotice('warning', RunMessages.mailboxMissing)
          await loadReferences()
          return false
        default:
          if (!isGlobalAlarm(outcome.kind)) showNotice('error', RunMessages.startFailed)
          return false
      }
    } finally {
      launching.value = false
    }
  }

  /** 202 → il polling vedrà Cancelled; 409/404 → avviso, poi rilettura del giro. */
  async function cancel(id: RunId): Promise<void> {
    cancellingId.value = String(id)
    try {
      const outcome = await cancelRun(id)
      switch (outcome.kind) {
        case 'accepted':
        case 'ok':
          showNotice('ok', RunMessages.cancelRequested)
          break
        case 'conflict':
          showNotice('warning', RunMessages.cancelConflictOne)
          break
        case 'notFound':
          showNotice('warning', RunMessages.runMissing)
          break
        default:
          if (!isGlobalAlarm(outcome.kind)) showNotice('error', RunMessages.cancelFailed)
          return
      }
      const [fresh] = await fetchRuns([id])
      if (fresh !== undefined) {
        upsertBridge([fresh])
        patchHistory(fresh)
      }
    } finally {
      cancellingId.value = null
    }
  }

  async function cancelAll(): Promise<void> {
    cancellingAll.value = true
    try {
      const outcome = await cancelAllRuns()
      switch (outcome.kind) {
        case 'accepted':
        case 'ok': {
          showNotice('ok', RunMessages.cancelAllRequested(outcome.data.runIds.length))
          // Anche i giri partiti dal cron dopo l'apertura entrano nel ponte, per vederli chiudersi.
          upsertBridge(await fetchRuns(outcome.data.runIds))
          break
        }
        case 'conflict':
          showNotice('warning', RunMessages.cancelConflictAll)
          break
        default:
          if (!isGlobalAlarm(outcome.kind)) showNotice('error', RunMessages.cancelFailed)
      }
    } finally {
      cancellingAll.value = false
    }
  }

  return {
    history,
    loadState,
    filter,
    hasFilter,
    focusIds,
    skippedMailboxIds,
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
    showNotice,
    clearNotice,
    loadReferences,
    loadHistory,
    loadRecent,
    loadBridge,
    setFilter,
    setFocus,
    pollRunning,
    launch,
    cancel,
    cancelAll,
  }
})
