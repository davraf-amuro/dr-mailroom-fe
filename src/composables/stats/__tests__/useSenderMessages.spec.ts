import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import * as mailboxes from '@/services/mailboxesService'
import * as messages from '@/services/messagesService'
import { useSenderMessages } from '../useSenderMessages'

vi.mock('@/services/mailboxesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/mailboxesService')>()),
  getMailbox: vi.fn<typeof mailboxes.getMailbox>(),
}))
vi.mock('@/services/messagesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/messagesService')>()),
  listSenderMessages: vi.fn<typeof messages.listSenderMessages>(),
}))

const SENDER = 'noreply@negozio.example'

/** Monta la vista di prova sul link del mittente e restituisce il composable. */
async function mountAt(path: string) {
  let grid!: ReturnType<typeof useSenderMessages>
  const View = defineComponent({
    setup() {
      grid = useSenderMessages()
      return () => h('div')
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/stats/messages', component: View }],
  })
  await router.push(path)
  await router.isReady()
  mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] } })
  await flushPromises()
  return grid
}

function message(): messages.SenderMessageDto {
  return {
    id: 1,
    gmailMessageId: 'abc',
    subject: 'Ordine',
    receivedAtUtc: '2026-10-01T10:00:00Z',
    hasAttachments: false,
  } as messages.SenderMessageDto
}

describe('useSenderMessages: conteggio senza allegati', () => {
  afterEach(() => vi.resetAllMocks())

  it('legge griglia e conteggio senza allegati con gli stessi filtri', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'error' } as never)
    vi.mocked(messages.listSenderMessages).mockImplementation(async (query) => ({
      kind: 'ok',
      data: query.withoutAttachmentsOnly
        ? { items: [], page: 1, pageSize: 1, totalCount: 640 }
        : { items: [message()], page: 1, pageSize: 50, totalCount: 851 },
    }))

    const grid = await mountAt(`/stats/messages?mailboxId=1&sender=${SENDER}&search=ordine`)

    expect(grid.totalCount.value).toBe(851)
    expect(grid.withoutAttachmentsCount.value).toBe(640)
    const countQuery = vi
      .mocked(messages.listSenderMessages)
      .mock.calls.map(([q]) => q)
      .find((q) => q.withoutAttachmentsOnly)
    expect(countQuery).toMatchObject({ senderAddress: SENDER, search: 'ordine', pageSize: 1 })
  })

  it('conteggio non disponibile → null, la griglia resta leggibile', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'error' } as never)
    vi.mocked(messages.listSenderMessages).mockImplementation(async (query) =>
      query.withoutAttachmentsOnly
        ? ({ kind: 'error' } as never)
        : { kind: 'ok', data: { items: [message()], page: 1, pageSize: 50, totalCount: 3 } },
    )

    const grid = await mountAt(`/stats/messages?mailboxId=1&sender=${SENDER}`)

    expect(grid.loadState.value).toBe('ready')
    expect(grid.withoutAttachmentsCount.value).toBeNull()
  })
})
