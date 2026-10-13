import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as filters from '@/services/filtersService'
import * as mailboxes from '@/services/mailboxesService'
import type { MailboxDto } from '@/services/mailboxesService'
import * as service from '@/services/runsService'
import type { RunDto } from '@/services/runsService'
import { RunMessages, useRunsStore } from '../runs'

vi.mock('@/services/runsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/runsService')>()
  return {
    ...original,
    listRuns: vi.fn<typeof original.listRuns>(),
    listRunSummaries: vi.fn<typeof original.listRunSummaries>(),
    getRun: vi.fn<typeof original.getRun>(),
    startRun: vi.fn<typeof original.startRun>(),
    cancelRun: vi.fn<typeof original.cancelRun>(),
    cancelAllRuns: vi.fn<typeof original.cancelAllRuns>(),
  }
})
vi.mock('@/services/mailboxesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/mailboxesService')>()),
  listMailboxes: vi.fn<() => void>(),
}))
vi.mock('@/services/filtersService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/filtersService')>()),
  listFilterSummaries: vi.fn<() => void>(),
}))

function run(overrides: Partial<RunDto> = {}): RunDto {
  return {
    id: 26,
    mailboxId: 1,
    trigger: 'Manual',
    filterId: null,
    requestedProcesses: null,
    senderAddress: null,
    status: 'Running',
    startedAtUtc: '2026-10-10T13:00:00',
    endedAtUtc: null,
    messagesRead: 0,
    messagesProcessed: 0,
    errorCount: 0,
    errorSummary: null,
    trashReceivedBeforeUtc: null,
    ...overrides,
  }
}

function mailbox(overrides: Partial<MailboxDto> = {}): MailboxDto {
  return {
    id: 1,
    emailAddress: 'unita@example.com',
    status: 'Active',
    isConnected: true,
    backfillCompleted: true,
    backfillInProgress: false,
    messagesTotal: null,
    messagesIndexed: 0,
    currentRun: null,
    lastRunAtUtc: null,
    lastRunMessagesRead: null,
    trashAuthorized: false,
    lastError: null,
    lastErrorRunId: null,
    ...overrides,
  }
}

async function storeWith(boxes: MailboxDto[]) {
  vi.mocked(mailboxes.listMailboxes).mockResolvedValue({ kind: 'ok', data: boxes })
  const store = useRunsStore()
  await store.loadReferences()
  return store
}

describe('store runs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(filters.listFilterSummaries).mockResolvedValue({ kind: 'empty' })
    vi.mocked(service.listRuns).mockResolvedValue({ kind: 'empty' })
    vi.mocked(service.listRunSummaries).mockResolvedValue({ kind: 'empty' })
    vi.mocked(service.getRun).mockResolvedValue({ kind: 'ok', data: run() })
  })
  afterEach(() => vi.resetAllMocks())

  describe('Esegui ora', () => {
    it('202 → giro nel ponte e avviso positivo', async () => {
      vi.mocked(service.startRun).mockResolvedValue({
        kind: 'accepted',
        data: { runIds: [26], skippedMailboxIds: [] },
      })
      const store = await storeWith([mailbox()])
      expect(await store.launch(1)).toBe(true)
      expect(service.startRun).toHaveBeenCalledWith(1)
      expect(store.bridge.map((r) => r.id)).toEqual([26])
      expect(store.bridgeHasRunning).toBe(true)
      expect(store.notice).toEqual({ tone: 'ok', text: RunMessages.started })
    })

    it('casella con storico da leggere → avviso che i filtri non si applicano', async () => {
      vi.mocked(service.startRun).mockResolvedValue({
        kind: 'accepted',
        data: { runIds: [26], skippedMailboxIds: [] },
      })
      const store = await storeWith([mailbox({ backfillCompleted: false })])
      await store.launch(null)
      expect(service.startRun).toHaveBeenCalledWith(null)
      expect(store.notice?.tone).toBe('info')
      expect(store.notice?.text).toContain(RunMessages.backfill)
    })

    it('caselle saltate → avviso con i loro nomi', async () => {
      vi.mocked(service.startRun).mockResolvedValue({
        kind: 'accepted',
        data: { runIds: [26], skippedMailboxIds: [2] },
      })
      const store = await storeWith([mailbox(), mailbox({ id: 2, emailAddress: 'b@x.it' })])
      await store.launch(null)
      expect(store.notice?.tone).toBe('warning')
      expect(store.notice?.text).toContain(RunMessages.skipped('b@x.it'))
    })

    it('409 → avviso, non errore', async () => {
      vi.mocked(service.startRun).mockResolvedValue({ kind: 'conflict', detail: null })
      const store = await storeWith([mailbox()])
      expect(await store.launch(1)).toBe(false)
      expect(store.notice).toEqual({ tone: 'warning', text: RunMessages.startConflictOne })
      expect(store.bridge).toEqual([])
    })

    it('409 su tutte le caselle → testo dedicato', async () => {
      vi.mocked(service.startRun).mockResolvedValue({ kind: 'conflict', detail: null })
      const store = await storeWith([mailbox()])
      await store.launch(null)
      expect(store.notice).toEqual({ tone: 'warning', text: RunMessages.startConflictAll })
    })
  })

  describe('Annulla', () => {
    it('202 → avviso e giro riletto (il polling vedrà Cancelled)', async () => {
      vi.mocked(service.cancelRun).mockResolvedValue({ kind: 'accepted', data: { runIds: [26] } })
      vi.mocked(service.getRun).mockResolvedValue({
        kind: 'ok',
        data: run({ status: 'Cancelled', errorSummary: 'Giro annullato su richiesta' }),
      })
      const store = useRunsStore()
      await store.cancel(26)
      expect(store.notice).toEqual({ tone: 'ok', text: RunMessages.cancelRequested })
      expect(store.bridge[0]?.status).toBe('Cancelled')
      expect(store.cancellingId).toBeNull()
    })

    it('409 → avviso non rosso', async () => {
      vi.mocked(service.cancelRun).mockResolvedValue({ kind: 'conflict', detail: null })
      const store = useRunsStore()
      await store.cancel(26)
      expect(store.notice).toEqual({ tone: 'warning', text: RunMessages.cancelConflictOne })
    })

    it('404 → avviso, giro inesistente', async () => {
      vi.mocked(service.cancelRun).mockResolvedValue({ kind: 'notFound', detail: null })
      vi.mocked(service.getRun).mockResolvedValue({ kind: 'notFound', detail: null })
      const store = useRunsStore()
      await store.cancel(99)
      expect(store.notice).toEqual({ tone: 'warning', text: RunMessages.runMissing })
      expect(store.bridge).toEqual([])
    })

    it('Annulla tutti: 202 → giri annullati nel ponte', async () => {
      vi.mocked(service.cancelAllRuns).mockResolvedValue({
        kind: 'accepted',
        data: { runIds: [26, 27] },
      })
      vi.mocked(service.getRun).mockImplementation((id) =>
        Promise.resolve({ kind: 'ok', data: run({ id }) }),
      )
      const store = useRunsStore()
      await store.cancelAll()
      expect(store.notice).toEqual({ tone: 'ok', text: RunMessages.cancelAllRequested(2) })
      expect(store.bridge.map((r) => r.id)).toEqual([26, 27])
    })

    it('Annulla tutti: 409 → "Nessun giro in corso", avviso', async () => {
      vi.mocked(service.cancelAllRuns).mockResolvedValue({ kind: 'conflict', detail: null })
      const store = useRunsStore()
      await store.cancelAll()
      expect(store.notice).toEqual({ tone: 'warning', text: RunMessages.cancelConflictAll })
    })
  })

  describe('polling e cronologia', () => {
    it('un giro concluso esce dal polling e la cronologia si rilegge', async () => {
      vi.mocked(service.listRuns).mockResolvedValueOnce({ kind: 'ok', data: [run()] })
      const store = await storeWith([mailbox()])
      await store.loadBridge()
      vi.mocked(service.getRun).mockResolvedValue({
        kind: 'ok',
        data: run({ status: 'Completed', messagesRead: 40 }),
      })
      const finished = await store.pollRunning()
      expect(finished.map((r) => r.status)).toEqual(['Completed'])
      expect(store.bridgeHasRunning).toBe(false)
      expect(service.listRuns).toHaveBeenCalledTimes(2)
    })

    it('?runIds= → cronologia dei soli giri indicati, letti per id', async () => {
      vi.mocked(service.getRun).mockImplementation((id) =>
        Promise.resolve({ kind: 'ok', data: run({ id, trigger: 'Reapply' }) }),
      )
      const store = await storeWith([mailbox(), mailbox({ id: 2, emailAddress: 'b@x.it' })])
      store.setFocus(['30', '31'], ['2'])
      await store.loadHistory()
      expect(service.listRuns).not.toHaveBeenCalled()
      expect(store.history.map((r) => r.id)).toEqual(['30', '31'])
      expect(store.skippedMailboxNames).toEqual(['b@x.it'])
    })

    it('404 sulla lista → stato vuoto, non errore', async () => {
      const store = useRunsStore()
      await store.loadHistory()
      expect(store.loadState).toBe('empty')
      expect(store.notice).toBeNull()
    })
  })
})
