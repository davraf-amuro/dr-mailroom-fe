import { computed, onScopeDispose, watch, type Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'

/** Rilettura dei giri in corso (specifica: ogni 3–5 s). */
export const RUN_POLL_INTERVAL_MS = 4_000

/**
 * Rilegge i giri `Running` finché ce n'è almeno uno: si ferma quando tutti sono in uno stato finale
 * (Completed, Failed, Skipped, Cancelled), si sospende con la scheda nascosta e riparte subito
 * quando torna visibile. Una rilettura non parte se la precedente non è finita.
 */
export function useRunPolling(
  hasRunning: Ref<boolean>,
  poll: () => Promise<void>,
  visibility: Ref<DocumentVisibilityState> = useDocumentVisibility(),
): void {
  let timer: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  async function tick(): Promise<void> {
    if (inFlight) return
    inFlight = true
    try {
      await poll()
    } finally {
      inFlight = false
    }
  }

  function stop(): void {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  const active = computed(() => hasRunning.value && visibility.value === 'visible')

  watch(
    active,
    (isActive, wasActive) => {
      stop()
      if (!isActive) return
      // Di ritorno sulla scheda lo stato può essere cambiato: rilettura immediata.
      if (wasActive === false) void tick()
      timer = setInterval(() => void tick(), RUN_POLL_INTERVAL_MS)
    },
    { immediate: true },
  )

  onScopeDispose(stop)
}
