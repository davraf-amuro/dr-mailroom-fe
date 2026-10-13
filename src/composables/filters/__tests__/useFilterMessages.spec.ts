import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { effectScope, reactive } from 'vue'

import * as filters from '@/services/filtersService'
import type { FilterDto, FilterMessageDto, FilterMessagePageDto } from '@/services/filtersService'
import * as messages from '@/services/messagesService'
import { FilterMessagesMessages } from '../filterMessagesPresentation'
import { useFilterMessages } from '../useFilterMessages'

const route = reactive({
  params: { id: '4' } as Record<string, unknown>,
  query: {},
  fullPath: '/filters/4/messages',
})
const replace = vi.fn<(location: unknown) => void>()

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ replace }) }))
vi.mock('@/services/filtersService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/filtersService')>()),
  getFilter: vi.fn<typeof filters.getFilter>(),
  listFilterMessages: vi.fn<typeof filters.listFilterMessages>(),
}))
vi.mock('@/services/messagesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/messagesService')>()),
  getMessageContent: vi.fn<typeof messages.getMessageContent>(),
  getMessageText: vi.fn<typeof messages.getMessageText>(),
}))

const filter: FilterDto = {
  id: 4,
  mailboxId: 1,
  name: 'Sconti',
  senderAddress: 'promo@negozio.it',
  subjectMatchType: 'Contains',
  subjectValue: 'codice',
  attachmentSubfolder: null,
  isEnabled: true,
  processes: ['ContentArchive'],
}

const row: FilterMessageDto = {
  id: 10,
  mailboxId: 1,
  subject: 'Il tuo codice',
  receivedAtUtc: '2026-01-01T08:00:00',
  hasAttachments: false,
  isArchived: true,
}

function page(overrides: Partial<FilterMessagePageDto> = {}): FilterMessagePageDto {
  return {
    items: [row],
    page: 1,
    pageSize: 25,
    totalCount: 1,
    missingArchiveCount: 0,
    hasContentArchive: true,
    ...overrides,
  }
}

function setup() {
  const save = vi.fn<(blob: Blob, fileName: string) => void>()
  const scope = effectScope()
  const view = scope.run(() => useFilterMessages({ save }))!
  return { view, save, scope }
}

describe('useFilterMessages', () => {
  afterEach(() => {
    vi.resetAllMocks()
    route.params = { id: '4' }
    route.query = {}
    route.fullPath = '/filters/4/messages'
  })

  it('legge filtro e pagina: righe, totali e stato dell’archivio', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({
      kind: 'ok',
      data: page({ totalCount: 30, missingArchiveCount: 5 }),
    })
    const { view, scope } = setup()
    await flushPromises()

    expect(filters.listFilterMessages).toHaveBeenCalledWith(4, {
      sortDir: 'Desc',
      page: 1,
      pageSize: 25,
    })
    expect(view.filter.value?.name).toBe('Sconti')
    expect(view.rows.value).toEqual([row])
    expect(view.totalCount.value).toBe(30)
    expect(view.missingArchiveCount.value).toBe(5)
    expect(view.hasContentArchive.value).toBe(true)
    expect(view.pages.value).toBe(2)
    expect(view.loadState.value).toBe('ready')
    scope.stop()
  })

  it('filtro inesistente → avviso, nessuna lettura delle mail', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'notFound', detail: null })
    const { view, scope } = setup()
    await flushPromises()

    expect(view.filterMissing.value).toBe(true)
    expect(view.notice.value?.text).toBe(FilterMessagesMessages.filterMissing)
    expect(filters.listFilterMessages).not.toHaveBeenCalled()
    scope.stop()
  })

  it('id non valido nel percorso → nessuna chiamata', async () => {
    route.params = { id: 'abc' }
    const { view, scope } = setup()
    await flushPromises()

    expect(view.filterMissing.value).toBe(true)
    expect(filters.getFilter).not.toHaveBeenCalled()
    scope.stop()
  })

  it('download riuscito → salva il file con il nome del server', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({ kind: 'ok', data: page() })
    const blob = new Blob(['x'])
    vi.mocked(messages.getMessageContent).mockResolvedValue({
      kind: 'ok',
      data: { blob, fileName: '20260101_codice.eml' },
    })
    const { view, save, scope } = setup()
    await flushPromises()

    await view.download(row, 'eml')

    expect(messages.getMessageContent).toHaveBeenCalledWith(10, 'eml')
    expect(save).toHaveBeenCalledWith(blob, '20260101_codice.eml')
    expect(view.isDownloading(row, 'eml')).toBe(false)
    scope.stop()
  })

  it('contenuto sparito (404) → avviso, nessun file', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({ kind: 'ok', data: page() })
    vi.mocked(messages.getMessageContent).mockResolvedValue({ kind: 'notFound', detail: null })
    const { view, save, scope } = setup()
    await flushPromises()

    await view.download(row, 'txt')

    expect(save).not.toHaveBeenCalled()
    expect(view.notice.value).toEqual({
      tone: 'warning',
      text: FilterMessagesMessages.contentMissing,
    })
    scope.stop()
  })

  it('popup del testo: apre, carica, mostra; chiudendo si svuota', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({ kind: 'ok', data: page() })
    vi.mocked(messages.getMessageText).mockResolvedValue({ kind: 'ok', data: 'Codice SCONTO10' })
    const { view, scope } = setup()
    await flushPromises()

    const opening = view.openText(row)
    expect(view.textState.open).toBe(true)
    expect(view.textState.loading).toBe(true)
    await opening

    expect(view.textState.loading).toBe(false)
    expect(view.textState.text).toBe('Codice SCONTO10')
    view.closeText()
    expect(view.textState.open).toBe(false)
    expect(view.textState.message).toBeNull()
    scope.stop()
  })

  it('popup del testo con errore → messaggio nel popup', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({ kind: 'ok', data: page() })
    vi.mocked(messages.getMessageText).mockResolvedValue({ kind: 'conflict', detail: null })
    const { view, scope } = setup()
    await flushPromises()

    await view.openText(row)

    expect(view.textState.error).toBe(FilterMessagesMessages.contentUnreadable)
    scope.stop()
  })

  it('cambio pagina e ordinamento passano dalla query string', async () => {
    vi.mocked(filters.getFilter).mockResolvedValue({ kind: 'ok', data: filter })
    vi.mocked(filters.listFilterMessages).mockResolvedValue({ kind: 'ok', data: page() })
    const { view, scope } = setup()
    await flushPromises()

    view.setPage(3)
    expect(replace).toHaveBeenLastCalledWith({ query: { sortDir: undefined, page: '3' } })
    view.toggleSort()
    expect(replace).toHaveBeenLastCalledWith({ query: { sortDir: 'Asc', page: undefined } })
    scope.stop()
  })
})
