import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { splitServerErrors } from '@/composables/filters/filterForm'
import { useNotice } from '@/composables/shared/useNotice'
import type { FieldErrors } from '@/services/api/problem'
import {
  createFilter,
  deleteFilter,
  listFilters,
  previewFilter,
  reapplyFilter,
  updateFilter,
  type FilterDto,
  type FilterId,
  type FilterListFilter,
  type FilterPreviewDto,
  type FilterPreviewRequest,
  type FilterRequest,
  type ProcessType,
  type RunsStartedDto,
} from '@/services/filtersService'
import { listMailboxSummaries, MailboxStatusValue } from '@/services/mailboxesService'
import type { MailboxSummaryDto } from '@/services/mailboxesService'
import { listAttachments, type AttachmentDto, type MessageId } from '@/services/messagesService'

export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

/** Testi della specifica, "Vista 2 — Filtri". */
export const FilterMessages = {
  mailboxDeleted: 'La casella di questo filtro è eliminata: il filtro non è modificabile.',
  created: 'Filtro creato: vale sulle mail nuove. Per le mail già lette usa «Riapplica».',
  updated: 'Filtro aggiornato.',
  deleted: 'Filtro eliminato. Le allerte già create restano.',
  notFound: 'Il filtro non esiste più: elenco aggiornato.',
  loadFailed: 'Impossibile leggere i filtri: riprova tra poco.',
  saveFailed: 'Il filtro non è stato salvato: riprova.',
  previewFailed: 'Impossibile provare il filtro: riprova tra poco.',
  reapplyConflict:
    'Impossibile riapplicare ora: la casella è eliminata o in pausa, oppure tutte le caselle sono già al lavoro.',
  reapplyFailed: 'Impossibile avviare la riapplicazione: riprova.',
  reapplyBadRequest: 'Scegli solo processi che il filtro ha.',
  operationFailed: 'Operazione non riuscita: riprova.',
  fieldErrorsSummary: 'Controlla i campi evidenziati.',
} as const

export type SaveResult =
  | { kind: 'saved'; filter: FilterDto | null }
  | { kind: 'invalid'; fields: FieldErrors }
  | { kind: 'failed' }

export type PreviewResult =
  { kind: 'ok' } | { kind: 'invalid'; fields: FieldErrors } | { kind: 'failed' }

export type ReapplyResult =
  | { kind: 'started'; started: RunsStartedDto }
  | { kind: 'rejected'; message: string }
  | { kind: 'failed' }

export type AttachmentsResult =
  { kind: 'ok'; items: AttachmentDto[] } | { kind: 'none' } | { kind: 'failed' }

/** Alcuni esiti hanno già il loro avviso globale nel banner di stato. */
function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

export const useFiltersStore = defineStore('filters', () => {
  const items = ref<FilterDto[]>([])
  const loadState = ref<LoadState>('idle')
  const filter = ref<FilterListFilter>({})
  const mailboxes = ref<MailboxSummaryDto[]>([])
  const saving = ref(false)
  const deletingId = ref<string | null>(null)
  const preview = ref<FilterPreviewDto | null>(null)
  const previewBusy = ref(false)
  const { notice, showNotice, clearNotice } = useNotice()

  const hasFilter = computed(
    () =>
      (filter.value.name?.trim() ?? '') !== '' ||
      (filter.value.senderAddress?.trim() ?? '') !== '' ||
      filter.value.mailboxId !== undefined ||
      filter.value.isEnabled !== undefined,
  )

  /** Caselle a cui si può attaccare un filtro: le eliminate sono escluse (specifica). */
  const selectableMailboxes = computed(() =>
    mailboxes.value.filter((m) => m.status !== MailboxStatusValue.Deleted),
  )

  const mailboxNames = computed(
    () => new Map(mailboxes.value.map((m) => [String(m.id), m.emailAddress])),
  )

  async function load(): Promise<void> {
    loadState.value = 'loading'
    const outcome = await listFilters(filter.value)
    if (outcome.kind === 'ok') {
      items.value = outcome.data
      loadState.value = outcome.data.length > 0 ? 'ready' : 'empty'
    } else if (outcome.kind === 'empty') {
      items.value = []
      loadState.value = 'empty'
    } else {
      loadState.value = 'error'
      if (!isGlobalAlarm(outcome.kind)) showNotice('error', FilterMessages.loadFailed)
    }
  }

  async function loadMailboxes(): Promise<void> {
    const outcome = await listMailboxSummaries()
    mailboxes.value = outcome.kind === 'ok' ? outcome.data : []
  }

  function setFilter(next: FilterListFilter): Promise<void> {
    filter.value = next
    return load()
  }

  function describeValidation(
    fields: FieldErrors,
    unmatched: string[],
    detail: string | null,
  ): string {
    if (unmatched.length > 0) return unmatched.join(' ')
    if (Object.keys(fields).length > 0) return FilterMessages.fieldErrorsSummary
    return detail ?? FilterMessages.saveFailed
  }

  /** POST (id nullo) o PUT: 400 → errori per campo, 409 → testo della specifica. */
  async function save(id: FilterId | null, body: FilterRequest): Promise<SaveResult> {
    saving.value = true
    try {
      const outcome = id === null ? await createFilter(body) : await updateFilter(id, body)
      switch (outcome.kind) {
        case 'ok':
          showNotice('ok', id === null ? FilterMessages.created : FilterMessages.updated)
          await load()
          return { kind: 'saved', filter: id === null ? (outcome.data as FilterDto) : null }
        case 'validation': {
          const { fields, unmatched } = splitServerErrors(outcome.fieldErrors)
          showNotice('error', describeValidation(fields, unmatched, outcome.detail))
          return { kind: 'invalid', fields }
        }
        case 'conflict':
          showNotice('warning', FilterMessages.mailboxDeleted)
          return { kind: 'failed' }
        case 'notFound':
          showNotice('warning', FilterMessages.notFound)
          await load()
          return { kind: 'failed' }
        default:
          if (!isGlobalAlarm(outcome.kind)) showNotice('error', FilterMessages.saveFailed)
          return { kind: 'failed' }
      }
    } finally {
      saving.value = false
    }
  }

  async function remove(id: FilterId): Promise<boolean> {
    deletingId.value = String(id)
    try {
      const outcome = await deleteFilter(id)
      switch (outcome.kind) {
        case 'ok':
          showNotice('ok', FilterMessages.deleted)
          await load()
          return true
        case 'conflict':
          showNotice('warning', FilterMessages.mailboxDeleted)
          return false
        case 'notFound':
          showNotice('warning', FilterMessages.notFound)
          await load()
          return false
        default:
          if (!isGlobalAlarm(outcome.kind)) showNotice('error', FilterMessages.operationFailed)
          return false
      }
    } finally {
      deletingId.value = null
    }
  }

  /** Dry-run: aggiorna `preview`; non scrive nulla sul server. */
  async function runPreview(body: FilterPreviewRequest): Promise<PreviewResult> {
    previewBusy.value = true
    try {
      const outcome = await previewFilter(body)
      if (outcome.kind === 'ok') {
        preview.value = outcome.data
        return { kind: 'ok' }
      }
      preview.value = null
      if (outcome.kind === 'validation') {
        return { kind: 'invalid', fields: splitServerErrors(outcome.fieldErrors).fields }
      }
      if (!isGlobalAlarm(outcome.kind)) showNotice('error', FilterMessages.previewFailed)
      return { kind: 'failed' }
    } finally {
      previewBusy.value = false
    }
  }

  function clearPreview(): void {
    preview.value = null
  }

  /** 202 → giri avviati; 409/400 → messaggio da mostrare nella modale. */
  async function reapply(id: FilterId, processes: ProcessType[]): Promise<ReapplyResult> {
    const outcome = await reapplyFilter(id, { processes })
    switch (outcome.kind) {
      case 'accepted':
      case 'ok':
        return { kind: 'started', started: outcome.data }
      case 'conflict':
        return { kind: 'rejected', message: outcome.detail ?? FilterMessages.reapplyConflict }
      case 'validation':
        return { kind: 'rejected', message: outcome.detail ?? FilterMessages.reapplyBadRequest }
      case 'notFound':
        showNotice('warning', FilterMessages.notFound)
        await load()
        return { kind: 'failed' }
      default:
        if (!isGlobalAlarm(outcome.kind)) showNotice('error', FilterMessages.reapplyFailed)
        return { kind: 'failed' }
    }
  }

  /** Allegati salvati di una mail: 404 = nessun allegato salvato. */
  async function loadAttachments(messageId: MessageId): Promise<AttachmentsResult> {
    const outcome = await listAttachments(messageId)
    if (outcome.kind === 'ok') {
      return outcome.data.length > 0 ? { kind: 'ok', items: outcome.data } : { kind: 'none' }
    }
    if (outcome.kind === 'empty' || outcome.kind === 'notFound') return { kind: 'none' }
    return { kind: 'failed' }
  }

  return {
    items,
    loadState,
    filter,
    hasFilter,
    mailboxes,
    selectableMailboxes,
    mailboxNames,
    saving,
    deletingId,
    preview,
    previewBusy,
    notice,
    showNotice,
    clearNotice,
    load,
    loadMailboxes,
    setFilter,
    save,
    remove,
    runPreview,
    clearPreview,
    reapply,
    loadAttachments,
  }
})
