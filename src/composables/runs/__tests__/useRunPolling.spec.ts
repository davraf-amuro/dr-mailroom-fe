import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, effectScope, nextTick, ref } from 'vue'

import type { RunStatus } from '@/services/runsService'
import { hasRunningRun } from '../runPresentation'
import { RUN_POLL_INTERVAL_MS, useRunPolling } from '../useRunPolling'

function setup(initial: RunStatus) {
  const statuses = ref<RunStatus[]>([initial])
  const visibility = ref<DocumentVisibilityState>('visible')
  const hasRunning = computed(() => hasRunningRun(statuses.value.map((status) => ({ status }))))
  const poll = vi.fn<() => Promise<void>>(() => Promise.resolve())
  const scope = effectScope()
  scope.run(() => useRunPolling(hasRunning, poll, visibility))
  return { statuses, visibility, poll, scope }
}

describe('useRunPolling', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('rilegge ogni 4 s finché un giro è Running', async () => {
    const { poll, scope } = setup('Running')
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 3)
    expect(poll).toHaveBeenCalledTimes(3)
    scope.stop()
  })

  it.each<RunStatus>(['Completed', 'Failed', 'Skipped', 'Cancelled'])(
    'si ferma quando il giro passa a %s',
    async (final) => {
      const { statuses, poll, scope } = setup('Running')
      await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS)
      expect(poll).toHaveBeenCalledTimes(1)

      statuses.value = [final]
      await nextTick()
      await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 5)
      expect(poll).toHaveBeenCalledTimes(1)
      scope.stop()
    },
  )

  it('nessuna rilettura senza giri Running', async () => {
    const { poll, scope } = setup('Completed')
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 5)
    expect(poll).not.toHaveBeenCalled()
    scope.stop()
  })

  it('si sospende con la scheda nascosta e rilegge subito al ritorno', async () => {
    const { visibility, poll, scope } = setup('Running')
    visibility.value = 'hidden'
    await nextTick()
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 5)
    expect(poll).not.toHaveBeenCalled()

    visibility.value = 'visible'
    await nextTick()
    expect(poll).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS)
    expect(poll).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('non sovrappone una rilettura a quella ancora in corso', async () => {
    const statuses = ref<RunStatus[]>(['Running'])
    const hasRunning = computed(() => hasRunningRun(statuses.value.map((status) => ({ status }))))
    let release: () => void = () => {}
    const poll = vi.fn<() => Promise<void>>(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    const scope = effectScope()
    scope.run(() => useRunPolling(hasRunning, poll, ref('visible')))

    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 3)
    expect(poll).toHaveBeenCalledTimes(1)
    release()
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS)
    expect(poll).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it("si ferma all'uscita dalla vista", async () => {
    const { poll, scope } = setup('Running')
    scope.stop()
    await vi.advanceTimersByTimeAsync(RUN_POLL_INTERVAL_MS * 3)
    expect(poll).not.toHaveBeenCalled()
  })
})
