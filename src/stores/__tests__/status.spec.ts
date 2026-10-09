import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { emitApiAlarm } from '@/services/api/apiEvents'
import * as statusService from '@/services/statusService'
import { STATUS_POLL_INTERVAL_MS, useStatusStore } from '../status'

vi.mock('@/services/statusService')

const readyStatus = {
  databaseReady: true,
  lastError: null,
  lastCheckedUtc: '2026-10-09T08:00:00Z',
}

describe('store status', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    useStatusStore().stop()
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('database pronto → ready', async () => {
    vi.mocked(statusService.getStatus).mockResolvedValue({ kind: 'ok', data: readyStatus })
    const store = useStatusStore()
    await store.refresh()
    expect(store.health).toBe('ready')
  })

  it('databaseReady false → databaseDown con lastError', async () => {
    vi.mocked(statusService.getStatus).mockResolvedValue({
      kind: 'ok',
      data: { databaseReady: false, lastError: 'Timeout', lastCheckedUtc: null },
    })
    const store = useStatusStore()
    await store.refresh()
    expect(store.health).toBe('databaseDown')
    expect(store.lastError).toBe('Timeout')
  })

  it('errore di rete → unreachable', async () => {
    vi.mocked(statusService.getStatus).mockResolvedValue({ kind: 'networkError' })
    const store = useStatusStore()
    await store.refresh()
    expect(store.health).toBe('unreachable')
  })

  it('riprova: 503 lascia il database giù, 200 lo riporta pronto', async () => {
    const store = useStatusStore()
    vi.mocked(statusService.retryDatabase).mockResolvedValueOnce({
      kind: 'databaseUnavailable',
      detail: 'ancora giù',
    })
    await store.retry()
    expect(store.health).toBe('databaseDown')
    expect(store.retrying).toBe(false)

    vi.mocked(statusService.retryDatabase).mockResolvedValueOnce({ kind: 'ok', data: readyStatus })
    await store.retry()
    expect(store.health).toBe('ready')
  })

  it('interroga lo stato ogni 60 s e ascolta i segnali globali', async () => {
    vi.mocked(statusService.getStatus).mockResolvedValue({ kind: 'ok', data: readyStatus })
    const store = useStatusStore()
    store.start()
    store.start()
    expect(statusService.getStatus).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(STATUS_POLL_INTERVAL_MS)
    expect(statusService.getStatus).toHaveBeenCalledTimes(2)

    emitApiAlarm({ kind: 'databaseUnavailable', detail: 'SQL giù' })
    expect(store.health).toBe('databaseDown')
    expect(store.lastError).toBe('SQL giù')

    emitApiAlarm({ kind: 'unauthorized', status: 401 })
    expect(store.keyRejected).toBe(true)
  })
})
