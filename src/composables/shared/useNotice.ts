import { ref } from 'vue'

/**
 * - `ok`: esito positivo
 * - `warning`: conflitto atteso (409), da leggere ma non da segnalare in rosso
 * - `error`: l'operazione non è riuscita
 */
export type NoticeTone = 'ok' | 'warning' | 'error' | 'info'

export interface Notice {
  tone: NoticeTone
  text: string
}

/** Avviso unico per vista o dominio: l'ultimo esito sostituisce il precedente. */
export function useNotice() {
  const notice = ref<Notice | null>(null)

  function showNotice(tone: NoticeTone, text: string): void {
    notice.value = { tone, text }
  }

  function clearNotice(): void {
    notice.value = null
  }

  return { notice, showNotice, clearNotice }
}
