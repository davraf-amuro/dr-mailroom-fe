import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as mailboxes from '@/services/mailboxesService'
import * as service from '@/services/statsService'
import type { SenderOverviewDto, SenderOverviewPageDto } from '@/services/statsService'
import { defaultMailboxId, useStatsStore } from '../stats'

vi.mock('@/services/statsService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/statsService')>()
  return {
    ...original,
    getSenderOverview: vi.fn<typeof original.getSenderOverview>(),
    listYearStats: vi.fn<typeof original.listYearStats>(),
  }
})
vi.mock('@/services/mailboxesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/mailboxesService')>()),
  listMailboxSummaries: vi.fn<() => void>(),
}))

function row(senderAddress: string): SenderOverviewDto {
  return {
    senderAddress,
    senderName: null,
    mailCount: 3,
    sentCount: 0,
    attachmentCount: 0,
    firstReceivedAtUtc: '2024-01-01T00:00:00',
    firstSubject: 'prima',
    lastReceivedAtUtc: '2026-01-01T00:00:00',
    lastSubject: 'ultima',
  }
}

function page(items: SenderOverviewDto[], totalCount = items.length): SenderOverviewPageDto {
  return { items, page: 1, pageSize: 25, totalCount }
}

const overview = () => vi.mocked(service.getSenderOverview)
/** Ultima chiamata della tabella (pageSize 25), non quella della classifica (pageSize 20). */
const lastTableQuery = () =>
  overview()
    .mock.calls.map(([query]) => query)
    .filter((query) => query.pageSize === 25)
    .slice(-1)[0]

describe('store stats', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(mailboxes.listMailboxSummaries).mockResolvedValue({
      kind: 'ok',
      data: [
        { id: 2, emailAddress: 'vecchia@example.com', status: 'Deleted' },
        { id: 1, emailAddress: 'unita@example.com', status: 'Active' },
      ],
    })
    overview().mockResolvedValue({ kind: 'ok', data: page([row('a@x.it')], 60) })
    vi.mocked(service.listYearStats).mockResolvedValue({
      kind: 'ok',
      data: [{ year: 2026, mailCount: 40 }],
    })
  })
  afterEach(() => vi.resetAllMocks())

  it('propone la prima casella attiva e carica tabella, classifica e anni', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    expect(store.mailboxId).toBe('1')
    expect(lastTableQuery()).toMatchObject({
      mailboxId: 1,
      year: undefined,
      sortBy: 'MailCount',
      sortDir: 'Desc',
      page: 1,
    })
    expect(overview()).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 20 }))
    expect(service.listYearStats).toHaveBeenCalledWith(1)
    expect(store.pages).toBe(3)
  })

  it('riapertura della vista → rilegge anni, tabella e classifica della casella scelta', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    overview().mockClear()
    vi.mocked(service.listYearStats).mockClear()

    await store.reload()

    expect(overview()).toHaveBeenCalledTimes(2)
    expect(overview()).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 20 }))
    expect(service.listYearStats).toHaveBeenCalledWith(1)
  })

  it('casella eliminata proposta solo se non ce ne sono di attive', () => {
    expect(defaultMailboxId([{ id: 2, emailAddress: 'x', status: 'Deleted' }])).toBe('2')
    expect(defaultMailboxId([])).toBe('')
  })

  it('pagina, ordinamento e ricerca finiscono nella query; ricerca e ordinamento tornano a pagina 1', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()

    await store.setPage(3)
    expect(lastTableQuery()?.page).toBe(3)

    await store.setSort('LastReceivedAt', 'Asc')
    expect(lastTableQuery()).toMatchObject({ sortBy: 'LastReceivedAt', sortDir: 'Asc', page: 1 })

    await store.setPage(2)
    await store.setSearch('fatture')
    expect(lastTableQuery()).toMatchObject({ search: 'fatture', page: 1 })
  })

  it('cambio anno → year nella query (tabella e classifica) e pagina 1', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    await store.setPage(2)
    overview().mockClear()

    await store.setYear('2025')

    expect(lastTableQuery()).toMatchObject({ year: 2025, page: 1 })
    expect(overview()).toHaveBeenCalledWith(expect.objectContaining({ year: 2025, pageSize: 20 }))
  })

  it('cambio casella → anno, ricerca, ordinamento e pagina ripartono da capo', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    await store.setYear('2025')
    await store.setSort('SenderAddress')
    await store.setSearch('x')
    await store.setPage(2)

    await store.selectMailbox('2')

    expect(store.year).toBe('')
    expect(store.search).toBe('')
    expect(lastTableQuery()).toMatchObject({
      mailboxId: 2,
      year: undefined,
      search: '',
      sortBy: 'MailCount',
      sortDir: 'Desc',
      page: 1,
    })
  })

  it('il dettaglio chiede gli anni con l’indirizzo esatto', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    await store.openDetail('Fatture@Fornitore.it')
    expect(service.listYearStats).toHaveBeenLastCalledWith(1, 'Fatture@Fornitore.it')
    expect(store.detailState).toBe('ready')
  })

  it('una risposta arrivata dopo una richiesta più recente si scarta', async () => {
    const store = useStatsStore()
    await store.loadMailboxes()
    let resolveSlow: (
      value: Awaited<ReturnType<typeof service.getSenderOverview>>,
    ) => void = () => {}
    overview().mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSlow = resolve
        }),
    )
    const slow = store.setSearch('lenta')
    overview().mockResolvedValueOnce({ kind: 'ok', data: page([row('veloce@x.it')]) })
    await store.setSearch('veloce')
    resolveSlow({ kind: 'ok', data: page([row('lenta@x.it')]) })
    await slow

    expect(store.rows.map((r) => r.senderAddress)).toEqual(['veloce@x.it'])
  })

  it('casella senza mail → stato vuoto, non errore', async () => {
    overview().mockResolvedValue({ kind: 'ok', data: page([], 0) })
    const store = useStatsStore()
    await store.loadMailboxes()
    expect(store.loadState).toBe('empty')
    expect(store.notice).toBeNull()
  })
})
