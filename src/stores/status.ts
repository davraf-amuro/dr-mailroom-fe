import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { onApiAlarm } from '@/services/api/apiEvents'
import type { ApiOutcome } from '@/services/api/problem'
import { getStatus, retryDatabase, type DatabaseStatus } from '@/services/statusService'

/** Intervallo di interrogazione dello stato (specifica, "Banner di stato del servizio"). */
export const STATUS_POLL_INTERVAL_MS = 60_000

/**
 * - `unknown`: prima risposta non ancora arrivata
 * - `ready`: API e database raggiungibili
 * - `databaseDown`: API raggiungibile, database no
 * - `unreachable`: l'API non risponde (spenta, indirizzo errato o CORS)
 */
export type ServiceHealth = 'unknown' | 'ready' | 'databaseDown' | 'unreachable'

export const useStatusStore = defineStore('status', () => {
  const health = ref<ServiceHealth>('unknown')
  const lastError = ref<string | null>(null)
  const lastCheckedUtc = ref<string | null>(null)
  const retrying = ref(false)
  /** 401/403 da una qualsiasi chiamata: la chiave di config.json manca o è errata. */
  const keyRejected = ref(false)

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let stopListening: (() => void) | null = null

  const databaseDown = computed(() => health.value === 'databaseDown')

  function applyStatus(status: DatabaseStatus): void {
    health.value = status.databaseReady ? 'ready' : 'databaseDown'
    lastError.value = status.lastError
    lastCheckedUtc.value = status.lastCheckedUtc
  }

  function applyOutcome(outcome: ApiOutcome<DatabaseStatus>): void {
    switch (outcome.kind) {
      case 'ok':
        applyStatus(outcome.data)
        break
      case 'databaseUnavailable':
        health.value = 'databaseDown'
        lastError.value = outcome.detail
        break
      case 'networkError':
        health.value = 'unreachable'
        break
      default:
        // Una risposta inattesa dallo stato non dice nulla sul database: si lascia l'ultimo esito.
        break
    }
  }

  async function refresh(): Promise<void> {
    applyOutcome(await getStatus())
  }

  async function retry(): Promise<void> {
    retrying.value = true
    try {
      applyOutcome(await retryDatabase())
    } finally {
      retrying.value = false
    }
  }

  /** Avvia l'interrogazione periodica e l'ascolto dei segnali globali; idempotente. */
  function start(): void {
    if (pollTimer !== null) return
    void refresh()
    pollTimer = setInterval(() => void refresh(), STATUS_POLL_INTERVAL_MS)
    stopListening = onApiAlarm((alarm) => {
      if (alarm.kind === 'databaseUnavailable') {
        health.value = 'databaseDown'
        if (alarm.detail !== null) lastError.value = alarm.detail
      } else {
        keyRejected.value = true
      }
    })
  }

  function stop(): void {
    if (pollTimer !== null) clearInterval(pollTimer)
    pollTimer = null
    stopListening?.()
    stopListening = null
  }

  return {
    health,
    lastError,
    lastCheckedUtc,
    retrying,
    keyRejected,
    databaseDown,
    refresh,
    retry,
    start,
    stop,
  }
})
