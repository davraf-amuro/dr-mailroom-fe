import { onScopeDispose, watch, type Ref } from 'vue'

import { MailboxStatusValue, type MailboxDto } from '@/services/mailboxesService'

/** Rilettura dell'elenco con un giro in corso: le mail lette avanzano a ogni pagina (~500). */
export const MAILBOX_RUN_POLL_INTERVAL_MS = 15_000

/** Rilettura con lettura dello storico in sospeso ma nessun giro attivo: si accorge del prossimo giro schedulato. */
export const MAILBOX_BACKFILL_IDLE_POLL_INTERVAL_MS = 60_000

/** Intervallo di rilettura per l'elenco corrente; null = nessun avanzamento da seguire. */
export function mailboxPollInterval(mailboxes: MailboxDto[]): number | null {
  if (mailboxes.some((m) => m.currentRun !== null)) return MAILBOX_RUN_POLL_INTERVAL_MS
  if (mailboxes.some((m) => m.status === MailboxStatusValue.Active && m.backfillInProgress)) {
    return MAILBOX_BACKFILL_IDLE_POLL_INTERVAL_MS
  }
  return null
}

/**
 * Rilegge l'elenco finché c'è un avanzamento da seguire; l'intervallo segue lo stato delle caselle
 * e il timer si ferma con lo scope (uscita dalla vista).
 */
export function useMailboxPolling(items: Ref<MailboxDto[]>, refresh: () => Promise<void>): void {
  let timer: ReturnType<typeof setInterval> | null = null

  function stop(): void {
    if (timer !== null) clearInterval(timer)
    timer = null
  }

  watch(
    () => mailboxPollInterval(items.value),
    (interval) => {
      stop()
      if (interval !== null) timer = setInterval(() => void refresh(), interval)
    },
    { immediate: true },
  )

  onScopeDispose(stop)
}
