import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'

import type { MailboxDto } from '@/services/mailboxesService'
import {
  MAILBOX_BACKFILL_IDLE_POLL_INTERVAL_MS,
  MAILBOX_RUN_POLL_INTERVAL_MS,
  mailboxPollInterval,
  useMailboxPolling,
} from '../useMailboxPolling'

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
    lastError: null,
    lastErrorRunId: null,
    ...overrides,
  }
}

const running = { id: 9, startedAtUtc: '2026-10-09T17:30:00Z', messagesRead: 500 }

describe('mailboxPollInterval', () => {
  it.each([
    ['giro in corso', [mailbox({ currentRun: running })], MAILBOX_RUN_POLL_INTERVAL_MS],
    [
      'storico in sospeso, nessun giro',
      [mailbox({ backfillCompleted: false, backfillInProgress: true })],
      MAILBOX_BACKFILL_IDLE_POLL_INTERVAL_MS,
    ],
    [
      'storico in sospeso ma casella in pausa',
      [mailbox({ status: 'Disabled', backfillCompleted: false, backfillInProgress: true })],
      null,
    ],
    ['niente da seguire', [mailbox()], null],
  ])('%s', (_, items, expected) => {
    expect(mailboxPollInterval(items)).toBe(expected)
  })
})

describe('useMailboxPolling', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('rilegge ogni 15 s con un giro in corso e si ferma quando finisce', async () => {
    const items = ref([mailbox({ currentRun: running })])
    const refresh = vi.fn<() => Promise<void>>(() => Promise.resolve())
    const scope = effectScope()
    scope.run(() => useMailboxPolling(items, refresh))

    vi.advanceTimersByTime(MAILBOX_RUN_POLL_INTERVAL_MS * 2)
    expect(refresh).toHaveBeenCalledTimes(2)

    items.value = [mailbox()]
    await nextTick()
    vi.advanceTimersByTime(MAILBOX_BACKFILL_IDLE_POLL_INTERVAL_MS * 2)
    expect(refresh).toHaveBeenCalledTimes(2)

    scope.stop()
  })

  it("si ferma all'uscita dalla vista (scope chiuso)", () => {
    const items = ref([mailbox({ currentRun: running })])
    const refresh = vi.fn<() => Promise<void>>(() => Promise.resolve())
    const scope = effectScope()
    scope.run(() => useMailboxPolling(items, refresh))

    scope.stop()
    vi.advanceTimersByTime(MAILBOX_RUN_POLL_INTERVAL_MS * 3)
    expect(refresh).not.toHaveBeenCalled()
  })
})
