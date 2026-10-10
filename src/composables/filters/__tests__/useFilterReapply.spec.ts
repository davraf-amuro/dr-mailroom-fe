import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as service from '@/services/filtersService'
import type { FilterDto } from '@/services/filtersService'
import { FilterMessages } from '@/stores/filters'
import { ReapplyMessages, runsQueryFrom, useFilterReapply } from '../useFilterReapply'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn<() => void>() }) }))
vi.mock('@/services/filtersService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/filtersService')>()),
  reapplyFilter: vi.fn<typeof service.reapplyFilter>(),
  listFilters: vi.fn<typeof service.listFilters>(),
}))

const filter: FilterDto = {
  id: 4,
  mailboxId: null,
  name: 'Fatture',
  senderAddress: 'fatture@fornitore.it',
  subjectMatchType: null,
  subjectValue: null,
  attachmentSubfolder: 'fatture',
  isEnabled: true,
  processes: ['AttachmentExtraction', 'Alert'],
}

describe('useFilterReapply', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.resetAllMocks())

  it('propone tutti i processi del filtro, selezionati', () => {
    const reapply = useFilterReapply({ navigate: vi.fn<(query: Record<string, string>) => void>() })
    reapply.ask(filter)
    expect(reapply.open.value).toBe(true)
    expect(reapply.selected.value).toEqual(['AttachmentExtraction', 'Alert'])
  })

  it('202 → chiude la modale e porta a /runs sui runIds', async () => {
    vi.mocked(service.reapplyFilter).mockResolvedValue({
      kind: 'accepted',
      data: { runIds: [7, 8], skippedMailboxIds: [3] },
    })
    const navigate = vi.fn<(query: Record<string, string>) => void>()
    const reapply = useFilterReapply({ navigate })
    reapply.ask(filter)
    reapply.selected.value = ['AttachmentExtraction']
    await reapply.confirm()

    expect(service.reapplyFilter).toHaveBeenCalledWith(4, { processes: ['AttachmentExtraction'] })
    expect(navigate).toHaveBeenCalledWith({ runIds: '7,8', skippedMailboxIds: '3' })
    expect(reapply.open.value).toBe(false)
    expect(reapply.busy.value).toBe(false)
  })

  it('409 → la modale resta aperta con il messaggio, nessuna navigazione', async () => {
    vi.mocked(service.reapplyFilter).mockResolvedValue({ kind: 'conflict', detail: null })
    const navigate = vi.fn<(query: Record<string, string>) => void>()
    const reapply = useFilterReapply({ navigate })
    reapply.ask(filter)
    await reapply.confirm()

    expect(reapply.open.value).toBe(true)
    expect(reapply.error.value).toBe(FilterMessages.reapplyConflict)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('senza processi selezionati non chiama l’API', async () => {
    const reapply = useFilterReapply({ navigate: vi.fn<(query: Record<string, string>) => void>() })
    reapply.ask(filter)
    reapply.selected.value = []
    await reapply.confirm()

    expect(reapply.error.value).toBe(ReapplyMessages.noProcess)
    expect(service.reapplyFilter).not.toHaveBeenCalled()
  })

  it('runsQueryFrom omette le caselle saltate quando non ce ne sono', () => {
    expect(runsQueryFrom({ runIds: [1], skippedMailboxIds: [] })).toEqual({ runIds: '1' })
  })
})
