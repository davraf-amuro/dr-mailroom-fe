import { onScopeDispose, ref } from 'vue'

/** Intervallo minimo fra due annunci aria-live (specifica: al massimo ogni 10 s). */
export const ANNOUNCE_MIN_INTERVAL_MS = 10_000

/**
 * Testo per una regione aria-live aggiornato al massimo una volta ogni `minIntervalMs`:
 * il primo annuncio esce subito, quelli arrivati nel frattempo si fondono nell'ultimo, che esce allo scadere.
 */
export function useThrottledAnnouncer(minIntervalMs = ANNOUNCE_MIN_INTERVAL_MS) {
  const message = ref('')
  let lastAt = Number.NEGATIVE_INFINITY
  let pending: string | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  function emit(text: string): void {
    message.value = text
    lastAt = Date.now()
  }

  function flush(): void {
    timer = null
    if (pending === null) return
    emit(pending)
    pending = null
  }

  function announce(text: string): void {
    if (text === '') return
    const wait = lastAt + minIntervalMs - Date.now()
    if (wait <= 0 && timer === null) {
      emit(text)
      return
    }
    pending = text
    timer ??= setTimeout(flush, Math.max(wait, 0))
  }

  onScopeDispose(() => {
    if (timer !== null) clearTimeout(timer)
  })

  return { message, announce }
}
