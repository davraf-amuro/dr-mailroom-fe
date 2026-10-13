import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import type { Notice } from '@/composables/shared/useNotice'
import * as mailboxes from '@/services/mailboxesService'
import type { MailboxDto } from '@/services/mailboxesService'
import * as messages from '@/services/messagesService'
import { TrashMessages } from '../trashPresentation'
import { useTrashSender, type TrashTarget } from '../useTrashSender'

vi.mock('@/services/mailboxesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/mailboxesService')>()),
  getMailbox: vi.fn<typeof mailboxes.getMailbox>(),
  getTrashAuthorizationUrl: vi.fn<typeof mailboxes.getTrashAuthorizationUrl>(),
}))
vi.mock('@/services/messagesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/messagesService')>()),
  trashSender: vi.fn<typeof messages.trashSender>(),
}))

const SENDER = 'no-reply@spam.example'

function mailbox(trashAuthorized: boolean): MailboxDto {
  return {
    id: 1,
    emailAddress: 'casella@example.com',
    status: 'Active',
    isConnected: true,
    backfillCompleted: true,
    backfillInProgress: false,
    messagesTotal: 100,
    messagesIndexed: 100,
    currentRun: null,
    lastRunAtUtc: null,
    lastRunMessagesRead: null,
    lastError: null,
    lastErrorRunId: null,
    trashAuthorized,
  }
}

/** Composable dentro uno scope, con gli avvisi registrati. */
function setup() {
  const notices: Notice[] = []
  const navigate = vi.fn<(url: string) => void>()
  const target = ref<TrashTarget>({ mailboxId: 1, senderAddress: SENDER })
  const scope = effectScope()
  const trash = scope.run(() =>
    useTrashSender(target, { onNotice: (n) => notices.push(n), navigate }),
  )!
  return { trash, notices, navigate, scope }
}

describe('useTrashSender', () => {
  afterEach(() => vi.resetAllMocks())

  it('cestino non autorizzato → chiude la conferma e chiede il consenso, senza avviare il giro', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox(false) })
    const { trash, scope } = setup()

    trash.request()
    expect(trash.confirmOpen.value).toBe(true)
    await trash.confirm()

    expect(trash.confirmOpen.value).toBe(false)
    expect(trash.authorizeOpen.value).toBe(true)
    expect(messages.trashSender).not.toHaveBeenCalled()
    scope.stop()
  })

  it('consenso → porta il browser all’URL di Google con il mittente della vista', async () => {
    vi.mocked(mailboxes.getTrashAuthorizationUrl).mockResolvedValue({
      kind: 'ok',
      data: { authorizationUrl: 'https://accounts.example/consent' },
    })
    const { trash, navigate, scope } = setup()

    await trash.authorize()

    expect(mailboxes.getTrashAuthorizationUrl).toHaveBeenCalledWith(1, SENDER)
    expect(navigate).toHaveBeenCalledWith('https://accounts.example/consent')
    scope.stop()
  })

  it('autorizzato → avvia il giro e avvisa quante mail andranno nel cestino', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox(true) })
    vi.mocked(messages.trashSender).mockResolvedValue({
      kind: 'accepted',
      data: { runId: 42, messagesToTrash: 3 },
    })
    const { trash, notices, scope } = setup()

    trash.request()
    await trash.confirm()

    expect(messages.trashSender).toHaveBeenCalledWith(1, SENDER)
    expect(trash.confirmOpen.value).toBe(false)
    expect(trash.phase.value).toBe('idle')
    expect(notices).toEqual([
      {
        tone: 'ok',
        text:
          `3 mail di ${SENDER} verranno spostate nel cestino di Gmail. ` +
          'Dal cestino le recuperi in Gmail per 30 giorni.',
      },
    ])
    scope.stop()
  })

  it('409 all’avvio → avviso arancione con il motivo del servizio', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'ok', data: mailbox(true) })
    vi.mocked(messages.trashSender).mockResolvedValue({
      kind: 'conflict',
      detail: 'La casella ha già un giro in corso',
    })
    const { trash, notices, scope } = setup()

    await trash.confirm()

    expect(trash.phase.value).toBe('idle')
    expect(notices).toEqual([{ tone: 'warning', text: 'La casella ha già un giro in corso' }])
    scope.stop()
  })

  it('casella non leggibile → avviso d’errore, nessun giro', async () => {
    vi.mocked(mailboxes.getMailbox).mockResolvedValue({ kind: 'networkError' })
    const { trash, notices, scope } = setup()

    await trash.confirm()

    expect(notices).toEqual([{ tone: 'error', text: TrashMessages.checkFailed }])
    expect(messages.trashSender).not.toHaveBeenCalled()
    scope.stop()
  })
})
