import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as service from '@/services/filtersService'
import type { FilterDto, FilterRequest } from '@/services/filtersService'
import * as messages from '@/services/messagesService'
import { FilterMessages, useFiltersStore } from '../filters'

vi.mock('@/services/filtersService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/filtersService')>()
  return {
    ...original,
    listFilters: vi.fn<typeof original.listFilters>(),
    createFilter: vi.fn<typeof original.createFilter>(),
    updateFilter: vi.fn<typeof original.updateFilter>(),
    deleteFilter: vi.fn<typeof original.deleteFilter>(),
    previewFilter: vi.fn<typeof original.previewFilter>(),
    reapplyFilter: vi.fn<typeof original.reapplyFilter>(),
  }
})

vi.mock('@/services/messagesService', () => ({
  listAttachments: vi.fn<typeof messages.listAttachments>(),
}))
vi.mock('@/services/mailboxesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/mailboxesService')>()),
  listMailboxSummaries: vi.fn<() => void>(),
}))

function filter(overrides: Partial<FilterDto> = {}): FilterDto {
  return {
    id: 4,
    mailboxId: null,
    name: 'Fatture',
    senderAddress: 'fatture@fornitore.it',
    subjectMatchType: 'Contains',
    subjectValue: 'fattura',
    attachmentSubfolder: 'fatture',
    isEnabled: true,
    processes: ['AttachmentExtraction'],
    ...overrides,
  }
}

const body: FilterRequest = {
  name: 'Fatture',
  senderAddress: 'fatture@fornitore.it',
  mailboxId: null,
  subjectMatchType: null,
  subjectValue: null,
  attachmentSubfolder: 'fatture',
  isEnabled: true,
  processes: ['AttachmentExtraction'],
}

describe('store filters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(service.listFilters).mockResolvedValue({ kind: 'ok', data: [filter()] })
  })
  afterEach(() => vi.resetAllMocks())

  it('404 sulla lista → stato vuoto, non errore', async () => {
    vi.mocked(service.listFilters).mockResolvedValue({ kind: 'empty' })
    const store = useFiltersStore()
    await store.load()
    expect(store.loadState).toBe('empty')
    expect(store.notice).toBeNull()
  })

  describe('400 → errori accanto al campo (chiavi camelCase)', () => {
    it('creazione: ogni chiave nota va al suo campo e l’avviso rimanda ai campi', async () => {
      vi.mocked(service.createFilter).mockResolvedValue({
        kind: 'validation',
        detail: null,
        fieldErrors: {
          senderAddress: ['Indirizzo non valido.'],
          attachmentSubfolder: ['Percorso non relativo.'],
        },
      })
      const store = useFiltersStore()
      const result = await store.save(null, body)

      expect(result).toEqual({
        kind: 'invalid',
        fields: {
          senderAddress: ['Indirizzo non valido.'],
          attachmentSubfolder: ['Percorso non relativo.'],
        },
      })
      expect(store.notice).toEqual({ tone: 'error', text: FilterMessages.fieldErrorsSummary })
      expect(service.listFilters).not.toHaveBeenCalled()
    })

    it('modifica: i messaggi senza campo corrispondente finiscono nell’avviso', async () => {
      vi.mocked(service.updateFilter).mockResolvedValue({
        kind: 'validation',
        detail: null,
        fieldErrors: { mailboxId: ['La casella non esiste.'], generico: ['Richiesta non valida.'] },
      })
      const store = useFiltersStore()
      const result = await store.save(4, body)

      expect(result).toEqual({ kind: 'invalid', fields: { mailboxId: ['La casella non esiste.'] } })
      expect(store.notice).toEqual({ tone: 'error', text: 'Richiesta non valida.' })
    })

    it('anteprima: gli errori tornano per campo e l’anteprima precedente sparisce', async () => {
      vi.mocked(service.previewFilter).mockResolvedValueOnce({
        kind: 'ok',
        data: { totalMatches: 1, messages: [] },
      })
      const store = useFiltersStore()
      await store.runPreview(body)
      expect(store.preview).not.toBeNull()

      vi.mocked(service.previewFilter).mockResolvedValueOnce({
        kind: 'validation',
        detail: null,
        fieldErrors: { subjectValue: ['Espressione non valida.'] },
      })
      const result = await store.runPreview(body)
      expect(result).toEqual({
        kind: 'invalid',
        fields: { subjectValue: ['Espressione non valida.'] },
      })
      expect(store.preview).toBeNull()
    })
  })

  describe('409 → testo della specifica', () => {
    it('creazione e modifica', async () => {
      const store = useFiltersStore()
      vi.mocked(service.createFilter).mockResolvedValue({ kind: 'conflict', detail: 'altro testo' })
      expect(await store.save(null, body)).toEqual({ kind: 'failed' })
      expect(store.notice).toEqual({ tone: 'warning', text: FilterMessages.mailboxDeleted })

      store.clearNotice()
      vi.mocked(service.updateFilter).mockResolvedValue({ kind: 'conflict', detail: null })
      await store.save(4, body)
      expect(store.notice).toEqual({ tone: 'warning', text: FilterMessages.mailboxDeleted })
    })

    it('cancellazione: avviso, non errore rosso, elenco invariato', async () => {
      vi.mocked(service.deleteFilter).mockResolvedValue({ kind: 'conflict', detail: null })
      const store = useFiltersStore()
      expect(await store.remove(4)).toBe(false)
      expect(store.notice).toEqual({ tone: 'warning', text: FilterMessages.mailboxDeleted })
    })

    it('il testo è quello della specifica', () => {
      expect(FilterMessages.mailboxDeleted).toContain(
        'La casella di questo filtro è eliminata: il filtro non è modificabile',
      )
    })
  })

  it('creazione riuscita: restituisce il filtro, rilegge l’elenco, avviso di conferma', async () => {
    vi.mocked(service.createFilter).mockResolvedValue({ kind: 'ok', data: filter({ id: 9 }) })
    const store = useFiltersStore()
    const result = await store.save(null, body)
    expect(result.kind).toBe('saved')
    expect(service.createFilter).toHaveBeenCalledWith(body)
    expect(service.listFilters).toHaveBeenCalledOnce()
    expect(store.notice?.tone).toBe('ok')
    expect(store.saving).toBe(false)
  })

  it('modifica riuscita (204) → PUT con l’id', async () => {
    vi.mocked(service.updateFilter).mockResolvedValue({ kind: 'ok', data: undefined })
    const store = useFiltersStore()
    expect((await store.save(4, body)).kind).toBe('saved')
    expect(service.updateFilter).toHaveBeenCalledWith(4, body)
    expect(store.notice).toEqual({ tone: 'ok', text: FilterMessages.updated })
  })

  it('cancellazione 204 → rilegge l’elenco', async () => {
    vi.mocked(service.deleteFilter).mockResolvedValue({ kind: 'ok', data: undefined })
    const store = useFiltersStore()
    expect(await store.remove(4)).toBe(true)
    expect(store.notice).toEqual({ tone: 'ok', text: FilterMessages.deleted })
    expect(service.listFilters).toHaveBeenCalledOnce()
    expect(store.deletingId).toBeNull()
  })

  it('cancellazione 404 → il filtro non esiste più, elenco riletto', async () => {
    vi.mocked(service.deleteFilter).mockResolvedValue({ kind: 'notFound', detail: null })
    const store = useFiltersStore()
    expect(await store.remove(4)).toBe(false)
    expect(store.notice).toEqual({ tone: 'warning', text: FilterMessages.notFound })
    expect(service.listFilters).toHaveBeenCalledOnce()
  })

  describe('riapplica', () => {
    it('202 → giri avviati', async () => {
      const started = { runIds: [7, 8], skippedMailboxIds: [] }
      vi.mocked(service.reapplyFilter).mockResolvedValue({ kind: 'accepted', data: started })
      const store = useFiltersStore()
      expect(await store.reapply(4, ['AttachmentExtraction'])).toEqual({ kind: 'started', started })
      expect(service.reapplyFilter).toHaveBeenCalledWith(4, { processes: ['AttachmentExtraction'] })
    })

    it('409 → messaggio del server, altrimenti quello di ripiego', async () => {
      const store = useFiltersStore()
      vi.mocked(service.reapplyFilter).mockResolvedValueOnce({
        kind: 'conflict',
        detail: 'La casella è in pausa.',
      })
      expect(await store.reapply(4, ['Alert'])).toEqual({
        kind: 'rejected',
        message: 'La casella è in pausa.',
      })

      vi.mocked(service.reapplyFilter).mockResolvedValueOnce({ kind: 'conflict', detail: null })
      expect(await store.reapply(4, ['Alert'])).toEqual({
        kind: 'rejected',
        message: FilterMessages.reapplyConflict,
      })
    })

    it('400 (processo non del filtro) → messaggio nella modale', async () => {
      vi.mocked(service.reapplyFilter).mockResolvedValue({
        kind: 'validation',
        detail: null,
        fieldErrors: {},
      })
      const store = useFiltersStore()
      expect(await store.reapply(4, ['Alert'])).toEqual({
        kind: 'rejected',
        message: FilterMessages.reapplyBadRequest,
      })
    })
  })

  describe('allegati salvati', () => {
    it('404 = nessun allegato salvato', async () => {
      vi.mocked(messages.listAttachments).mockResolvedValue({ kind: 'empty' })
      expect(await useFiltersStore().loadAttachments(5)).toEqual({ kind: 'none' })
    })

    it('200 → elenco', async () => {
      const item = {
        id: 1,
        partId: '1',
        originalFileName: 'fattura.pdf',
        relativePath: 'fatture/fattura.pdf',
        sizeBytes: 2048,
        sha256: 'abc',
        savedAtUtc: '2026-10-09T10:00:00Z',
      }
      vi.mocked(messages.listAttachments).mockResolvedValue({ kind: 'ok', data: [item] })
      expect(await useFiltersStore().loadAttachments(5)).toEqual({ kind: 'ok', items: [item] })
    })
  })
})
