import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { useNotice } from '@/composables/shared/useNotice'
import type { ApiOutcome } from '@/services/api/problem'
import {
  deleteMailbox,
  getConnectUrl,
  getMailbox,
  listMailboxes,
  MailboxStatusValue,
  pauseMailbox,
  resumeMailbox,
  type MailboxDto,
  type MailboxId,
  type MailboxListFilter,
} from '@/services/mailboxesService'

export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** Testi della specifica, "Vista 1 — Caselle". */
export const MailboxMessages = {
  deleteConflict: 'Attendi la fine del giro in corso.',
  pauseConflict: 'La casella non si può mettere in pausa: è eliminata o ha il token revocato.',
  resumeConflict: 'La casella non è in pausa.',
  paused: 'Casella in pausa: i giri in corso vengono annullati.',
  resumed: 'Casella ripresa: il lavoro riparte al prossimo giro.',
  deleted: 'Casella eliminata: statistiche e storico restano consultabili.',
  notFound: 'La casella non esiste più: elenco aggiornato.',
  connectFailed: 'Impossibile avviare il collegamento con Google: riprova.',
  loadFailed: 'Impossibile leggere le caselle: riprova tra poco.',
} as const

type MailboxAction = 'pause' | 'resume' | 'delete'

export const useMailboxesStore = defineStore('mailboxes', () => {
  const items = ref<MailboxDto[]>([])
  const loadState = ref<LoadState>('idle')
  const filter = ref<MailboxListFilter>({})
  /** Azione in corso per casella: il pulsante relativo resta "occupato". */
  const busy = ref<Record<string, MailboxAction | undefined>>({})
  const connecting = ref(false)
  /** Dettaglio aperto (GET /mailboxes/{id}): null finché non arriva. */
  const detail = ref<MailboxDto | null>(null)
  const detailLoading = ref(false)
  const { notice, showNotice, clearNotice } = useNotice()

  const hasFilter = computed(
    () => (filter.value.emailAddress?.trim() ?? '') !== '' || filter.value.status !== undefined,
  )

  const counts = computed(() => {
    const result = { active: 0, tokenRevoked: 0, paused: 0, deleted: 0 }
    for (const mailbox of items.value) {
      if (mailbox.status === MailboxStatusValue.Active) result.active++
      else if (mailbox.status === MailboxStatusValue.TokenRevoked) result.tokenRevoked++
      else if (mailbox.status === MailboxStatusValue.Disabled) result.paused++
      else result.deleted++
    }
    return result
  })

  async function load(): Promise<void> {
    loadState.value = 'loading'
    const outcome = await listMailboxes(filter.value)
    if (outcome.kind === 'ok') {
      items.value = outcome.data
      loadState.value = outcome.data.length > 0 ? 'ready' : 'empty'
    } else if (outcome.kind === 'empty') {
      items.value = []
      loadState.value = 'empty'
    } else {
      loadState.value = 'error'
      // 503 e 401 hanno già il loro avviso globale nel banner.
      if (outcome.kind !== 'databaseUnavailable' && outcome.kind !== 'unauthorized') {
        showNotice('error', MailboxMessages.loadFailed)
      }
    }
  }

  /**
   * Rilettura periodica (avanzamento dei giri): niente stato "loading" né avvisi;
   * un errore lascia l'ultimo elenco, il banner di stato segnala già API o database giù.
   */
  async function refreshSilently(): Promise<void> {
    const outcome = await listMailboxes(filter.value)
    if (outcome.kind === 'ok') {
      items.value = outcome.data
      loadState.value = outcome.data.length > 0 ? 'ready' : 'empty'
    }
  }

  function replaceItem(updated: MailboxDto): void {
    items.value = items.value.map((m) => (String(m.id) === String(updated.id) ? updated : m))
  }

  /** Rilegge una casella dopo un'azione; se non esiste più, rilegge l'elenco. */
  async function refreshItem(id: MailboxId): Promise<void> {
    const outcome = await getMailbox(id)
    if (outcome.kind === 'ok') replaceItem(outcome.data)
    else await load()
  }

  async function runAction(
    id: MailboxId,
    action: MailboxAction,
    call: (id: MailboxId) => Promise<ApiOutcome<unknown>>,
    messages: { done: string; conflict: string; useServerDetail: boolean },
  ): Promise<boolean> {
    const key = String(id)
    busy.value = { ...busy.value, [key]: action }
    try {
      const outcome = await call(id)
      switch (outcome.kind) {
        case 'ok':
          showNotice('ok', messages.done)
          await refreshItem(id)
          return true
        case 'conflict':
          showNotice(
            'warning',
            messages.useServerDetail ? (outcome.detail ?? messages.conflict) : messages.conflict,
          )
          await refreshItem(id)
          return false
        case 'notFound':
          showNotice('warning', MailboxMessages.notFound)
          await load()
          return false
        case 'databaseUnavailable':
        case 'unauthorized':
          return false
        default:
          showNotice('error', 'Operazione non riuscita: riprova.')
          return false
      }
    } finally {
      busy.value = { ...busy.value, [key]: undefined }
    }
  }

  function pause(id: MailboxId): Promise<boolean> {
    return runAction(id, 'pause', pauseMailbox, {
      done: MailboxMessages.paused,
      conflict: MailboxMessages.pauseConflict,
      useServerDetail: true,
    })
  }

  function resume(id: MailboxId): Promise<boolean> {
    return runAction(id, 'resume', resumeMailbox, {
      done: MailboxMessages.resumed,
      conflict: MailboxMessages.resumeConflict,
      useServerDetail: true,
    })
  }

  /** Il 409 dell'eliminazione ha un testo fisso nella specifica, non il detail del server. */
  function remove(id: MailboxId): Promise<boolean> {
    return runAction(id, 'delete', deleteMailbox, {
      done: MailboxMessages.deleted,
      conflict: MailboxMessages.deleteConflict,
      useServerDetail: false,
    })
  }

  /** Chiede a Google l'URL di consenso; restituisce null se non è stato possibile. */
  async function requestConnectUrl(): Promise<string | null> {
    connecting.value = true
    try {
      const outcome = await getConnectUrl()
      if (outcome.kind === 'ok') return outcome.data.authorizationUrl
      if (outcome.kind !== 'databaseUnavailable' && outcome.kind !== 'unauthorized') {
        showNotice('error', MailboxMessages.connectFailed)
      }
      return null
    } finally {
      connecting.value = false
    }
  }

  /** Carica il dettaglio; se la casella non esiste più avvisa e rilegge l'elenco (false). */
  async function loadDetail(id: MailboxId): Promise<boolean> {
    detail.value = null
    detailLoading.value = true
    try {
      const outcome = await getMailbox(id)
      if (outcome.kind === 'ok') {
        detail.value = outcome.data
        replaceItem(outcome.data)
        return true
      }
      if (outcome.kind === 'notFound') {
        showNotice('warning', MailboxMessages.notFound)
        await load()
      }
      return false
    } finally {
      detailLoading.value = false
    }
  }

  function setFilter(next: MailboxListFilter): Promise<void> {
    filter.value = next
    return load()
  }

  return {
    items,
    loadState,
    filter,
    hasFilter,
    counts,
    busy,
    connecting,
    notice,
    showNotice,
    clearNotice,
    load,
    refreshSilently,
    setFilter,
    pause,
    resume,
    remove,
    requestConnectUrl,
    detail,
    detailLoading,
    loadDetail,
  }
})
