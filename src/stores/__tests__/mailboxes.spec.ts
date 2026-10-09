import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as service from '@/services/mailboxesService'
import type { MailboxDto } from '@/services/mailboxesService'
import { MailboxMessages, useMailboxesStore } from '../mailboxes'

vi.mock('@/services/mailboxesService', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/mailboxesService')>()
  return {
    ...original,
    listMailboxes: vi.fn<typeof original.listMailboxes>(),
    getMailbox: vi.fn<typeof original.getMailbox>(),
    pauseMailbox: vi.fn<typeof original.pauseMailbox>(),
    resumeMailbox: vi.fn<typeof original.resumeMailbox>(),
    deleteMailbox: vi.fn<typeof original.deleteMailbox>(),
    getConnectUrl: vi.fn<typeof original.getConnectUrl>(),
  }
})

function mailbox(overrides: Partial<MailboxDto> = {}): MailboxDto {
  return {
    id: 3,
    emailAddress: 'unita@example.com',
    status: 'Active',
    isConnected: true,
    backfillCompleted: true,
    backfillInProgress: false,
    lastRunAtUtc: null,
    lastError: null,
    ...overrides,
  }
}

async function storeWith(item: MailboxDto) {
  vi.mocked(service.listMailboxes).mockResolvedValue({ kind: 'ok', data: [item] })
  const store = useMailboxesStore()
  await store.load()
  return store
}

describe('store mailboxes', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.resetAllMocks())

  it('404 sulla lista → stato vuoto, non errore', async () => {
    vi.mocked(service.listMailboxes).mockResolvedValue({ kind: 'empty' })
    const store = useMailboxesStore()
    await store.load()
    expect(store.loadState).toBe('empty')
    expect(store.notice).toBeNull()
  })

  it('Pausa: 204 → la casella passa a Disabled', async () => {
    const store = await storeWith(mailbox({ status: 'Active' }))
    vi.mocked(service.pauseMailbox).mockResolvedValue({ kind: 'ok', data: undefined })
    vi.mocked(service.getMailbox).mockResolvedValue({
      kind: 'ok',
      data: mailbox({ status: 'Disabled' }),
    })

    expect(await store.pause(3)).toBe(true)
    expect(store.items[0]?.status).toBe('Disabled')
    expect(store.notice).toEqual({ tone: 'ok', text: MailboxMessages.paused })
    expect(store.busy['3']).toBeUndefined()
  })

  it('Riprendi: 204 → la casella torna Active', async () => {
    const store = await storeWith(mailbox({ status: 'Disabled' }))
    vi.mocked(service.resumeMailbox).mockResolvedValue({ kind: 'ok', data: undefined })
    vi.mocked(service.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox() })

    expect(await store.resume(3)).toBe(true)
    expect(store.items[0]?.status).toBe('Active')
  })

  it('Pausa: 409 → avviso con il detail del server', async () => {
    const store = await storeWith(mailbox({ status: 'TokenRevoked' }))
    vi.mocked(service.pauseMailbox).mockResolvedValue({
      kind: 'conflict',
      detail: 'La casella ha il token revocato.',
    })
    vi.mocked(service.getMailbox).mockResolvedValue({
      kind: 'ok',
      data: mailbox({ status: 'TokenRevoked' }),
    })

    expect(await store.pause(3)).toBe(false)
    expect(store.notice).toEqual({ tone: 'warning', text: 'La casella ha il token revocato.' })
  })

  it('Riprendi: 409 senza detail → testo della specifica', async () => {
    const store = await storeWith(mailbox({ status: 'Active' }))
    vi.mocked(service.resumeMailbox).mockResolvedValue({ kind: 'conflict', detail: null })
    vi.mocked(service.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox() })

    expect(await store.resume(3)).toBe(false)
    expect(store.notice).toEqual({ tone: 'warning', text: MailboxMessages.resumeConflict })
  })

  it('Elimina: 409 → "Attendi la fine del giro in corso"', async () => {
    const store = await storeWith(mailbox())
    vi.mocked(service.deleteMailbox).mockResolvedValue({
      kind: 'conflict',
      detail: 'Giro in corso sulla casella 3',
    })
    vi.mocked(service.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox() })

    expect(await store.remove(3)).toBe(false)
    expect(store.notice?.text).toBe('Attendi la fine del giro in corso.')
  })

  it('Elimina: 204 → la riga resta, con stato Deleted', async () => {
    const store = await storeWith(mailbox())
    vi.mocked(service.deleteMailbox).mockResolvedValue({ kind: 'ok', data: undefined })
    vi.mocked(service.getMailbox).mockResolvedValue({
      kind: 'ok',
      data: mailbox({ status: 'Deleted' }),
    })

    expect(await store.remove(3)).toBe(true)
    expect(store.items).toHaveLength(1)
    expect(store.items[0]?.status).toBe('Deleted')
  })

  it('collega: restituisce l’URL di consenso di Google', async () => {
    vi.mocked(service.getConnectUrl).mockResolvedValue({
      kind: 'ok',
      data: { authorizationUrl: 'https://accounts.google.com/o/oauth2/auth?x=1' },
    })
    const store = useMailboxesStore()
    expect(await store.requestConnectUrl()).toBe('https://accounts.google.com/o/oauth2/auth?x=1')
    expect(store.connecting).toBe(false)
  })

  it('conta le unità per stato per la cella eroe', async () => {
    vi.mocked(service.listMailboxes).mockResolvedValue({
      kind: 'ok',
      data: [
        mailbox({ id: 1 }),
        mailbox({ id: 2 }),
        mailbox({ id: 3, status: 'TokenRevoked' }),
        mailbox({ id: 4, status: 'Disabled' }),
        mailbox({ id: 5, status: 'Deleted' }),
      ],
    })
    const store = useMailboxesStore()
    await store.load()
    expect(store.counts).toEqual({ active: 2, tokenRevoked: 1, paused: 1, deleted: 1 })
  })
})
