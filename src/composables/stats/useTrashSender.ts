import { computed, ref, watch, type Ref } from 'vue'

import type { Notice } from '@/composables/shared/useNotice'
import {
  TrashMessages,
  endOfLocalDayExclusiveUtc,
  trashStartedText,
  untilDateLabel,
} from '@/composables/stats/trashPresentation'
import { getMailbox, getTrashAuthorizationUrl } from '@/services/mailboxesService'
import { listSenderMessages, trashSender } from '@/services/messagesService'
import { SortDirectionValue } from '@/services/statsService'

/** Casella e mittente su cui agisce "Elimina tutte". */
export interface TrashTarget {
  mailboxId: number | null
  senderAddress: string
}

/**
 * - `idle`: nessuna operazione
 * - `checking`: verifica dell'autorizzazione del cestino
 * - `starting`: richiesta di avvio del giro
 */
export type TrashPhase = 'idle' | 'checking' | 'starting'

/** Quali mail del mittente: tutte, oppure solo quelle senza allegati. */
export type TrashScope = 'all' | 'withoutAttachments'

export interface UseTrashSenderOptions {
  /** Esiti da mostrare nell'avviso della vista. */
  onNotice: (notice: Notice) => void
  /** Porta il browser alla pagina di consenso Google; sostituibile nei test. */
  navigate?: (url: string) => void
}

function isGlobalAlarm(kind: string): boolean {
  return kind === 'databaseUnavailable' || kind === 'unauthorized'
}

/**
 * "Elimina tutte" (D-T1 bis): conferma → se il cestino della casella non è autorizzato, secondo dialogo e consenso
 * Google → avvio del giro e avviso con quante mail andranno nel cestino. Il giro prosegue sul servizio: la vista
 * non ne segue l'avanzamento.
 */
export function useTrashSender(target: Ref<TrashTarget>, options: UseTrashSenderOptions) {
  const navigate = options.navigate ?? ((url: string) => window.location.assign(url))

  const confirmOpen = ref(false)
  const authorizeOpen = ref(false)
  const phase = ref<TrashPhase>('idle')
  const scope = ref<TrashScope>('all')
  const withoutAttachments = computed(() => scope.value === 'withoutAttachments')

  const busy = computed(() => phase.value !== 'idle')

  /** Giorno "fino al" del campo data (yyyy-mm-dd, ora locale); "" = tutte le mail. */
  const untilDate = ref('')
  /**
   * Mail coinvolte (fino al giorno scelto e/o senza allegati), contate dal server; null = tutte senza data o
   * conteggio non disponibile.
   */
  const untilCount = ref<number | null>(null)
  const receivedBeforeUtc = computed(() => endOfLocalDayExclusiveUtc(untilDate.value))
  const untilLabel = computed(() => untilDateLabel(untilDate.value))

  // Con la conferma aperta, ogni data scelta aggiorna il conteggio; le risposte superate si scartano.
  let countRequest = 0
  watch([untilDate, confirmOpen, scope], async () => {
    const id = ++countRequest
    const mailboxId = target.value.mailboxId
    const before = receivedBeforeUtc.value
    untilCount.value = null
    if (!confirmOpen.value || mailboxId === null || (before === null && !withoutAttachments.value))
      return
    const outcome = await listSenderMessages({
      mailboxId,
      senderAddress: target.value.senderAddress,
      receivedBeforeUtc: before ?? undefined,
      withoutAttachmentsOnly: withoutAttachments.value,
      sortDir: SortDirectionValue.Desc,
      page: 1,
      pageSize: 1,
    })
    if (id !== countRequest) return
    untilCount.value = outcome.kind === 'ok' ? Number(outcome.data.totalCount) : null
  })

  function report(kind: string, text: string, detail: string | null = null): void {
    if (isGlobalAlarm(kind)) return
    options.onNotice({ tone: kind === 'conflict' ? 'warning' : 'error', text: detail ?? text })
  }

  /** Primo passo: apre la conferma, per tutte le mail o solo per quelle senza allegati. */
  function request(next: TrashScope = 'all'): void {
    if (busy.value || target.value.mailboxId === null) return
    scope.value = next
    untilDate.value = ''
    confirmOpen.value = true
  }

  /** Conferma data: senza autorizzazione del cestino si passa al consenso, altrimenti si avvia il giro. */
  async function confirm(): Promise<void> {
    const mailboxId = target.value.mailboxId
    if (mailboxId === null) return
    phase.value = 'checking'
    const mailbox = await getMailbox(mailboxId)
    if (mailbox.kind !== 'ok') {
      phase.value = 'idle'
      confirmOpen.value = false
      report(mailbox.kind, TrashMessages.checkFailed)
      return
    }
    if (!mailbox.data.trashAuthorized) {
      phase.value = 'idle'
      confirmOpen.value = false
      authorizeOpen.value = true
      return
    }
    await start(mailboxId)
  }

  /** Consenso Google per il cestino: il backend riporta il browser su questa stessa vista. */
  async function authorize(): Promise<void> {
    const mailboxId = target.value.mailboxId
    if (mailboxId === null) return
    phase.value = 'checking'
    const outcome = await getTrashAuthorizationUrl(mailboxId, target.value.senderAddress)
    if (outcome.kind === 'ok') {
      navigate(outcome.data.authorizationUrl)
      return
    }
    phase.value = 'idle'
    authorizeOpen.value = false
    report(outcome.kind, TrashMessages.checkFailed, 'detail' in outcome ? outcome.detail : null)
  }

  /** Avvio del giro: a richiesta accettata basta dire quante mail andranno nel cestino. */
  async function start(mailboxId: number): Promise<void> {
    phase.value = 'starting'
    const outcome = await trashSender(
      mailboxId,
      target.value.senderAddress,
      receivedBeforeUtc.value,
      withoutAttachments.value,
    )
    confirmOpen.value = false
    phase.value = 'idle'
    if (outcome.kind !== 'accepted' && outcome.kind !== 'ok') {
      report(outcome.kind, TrashMessages.startFailed, 'detail' in outcome ? outcome.detail : null)
      return
    }
    options.onNotice({
      tone: 'info',
      text: trashStartedText(
        Number(outcome.data.messagesToTrash),
        target.value.senderAddress,
        untilLabel.value,
        withoutAttachments.value,
      ),
    })
  }

  return {
    confirmOpen,
    authorizeOpen,
    phase,
    busy,
    scope,
    withoutAttachments,
    untilDate,
    untilCount,
    untilLabel,
    request,
    confirm,
    authorize,
  }
}
