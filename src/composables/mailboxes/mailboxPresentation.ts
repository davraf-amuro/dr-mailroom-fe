import type { Component } from 'vue'
import { CircleCheck, CircleX, KeyRound, Pause } from '@lucide/vue'

import {
  MailboxStatusValue,
  type MailboxDto,
  type MailboxStatus,
} from '@/services/mailboxesService'
import { formatDateTime } from '@/utils/formatDate'
import { formatCount } from '@/utils/formatNumber'

export interface StatusPresentation {
  label: string
  tone: 'ok' | 'alert' | 'neutral' | 'federal' | 'caution'
  icon: Component
  /** Deleted: badge grigio barrato (specifica, colonna "Stato"). */
  struck: boolean
}

/** Badge degli stati: testo + icona + colore, mai il solo colore. */
export const mailboxStatusPresentation: Record<MailboxStatus, StatusPresentation> = {
  [MailboxStatusValue.Active]: { label: 'Attiva', tone: 'ok', icon: CircleCheck, struck: false },
  [MailboxStatusValue.TokenRevoked]: {
    label: 'Token revocato',
    tone: 'caution',
    icon: KeyRound,
    struck: false,
  },
  [MailboxStatusValue.Disabled]: { label: 'In pausa', tone: 'neutral', icon: Pause, struck: false },
  [MailboxStatusValue.Deleted]: {
    label: 'Eliminata',
    tone: 'neutral',
    icon: CircleX,
    struck: true,
  },
}

/** Opzioni del filtro per stato, nell'ordine dei badge. */
export const mailboxStatusOptions = (Object.keys(mailboxStatusPresentation) as MailboxStatus[]).map(
  (value) => ({ value, label: mailboxStatusPresentation[value].label }),
)

export type BackfillState = 'completed' | 'inProgress' | 'notStarted'

export const backfillLabels: Record<BackfillState, string> = {
  completed: 'Completato',
  inProgress: 'In corso (riprende dal punto salvato)',
  notStarted: 'Da avviare',
}

export function backfillState(
  mailbox: Pick<MailboxDto, 'backfillCompleted' | 'backfillInProgress'>,
): BackfillState {
  if (mailbox.backfillCompleted) return 'completed'
  return mailbox.backfillInProgress ? 'inProgress' : 'notStarted'
}

/** Giro in corso: "Giro 9 · dal 9 ott 2026, 19:30 · 1.500 mail lette in questo giro". */
export function currentRunText(run: NonNullable<MailboxDto['currentRun']>): string {
  return `Giro ${run.id} · dal ${formatDateTime(run.startedAtUtc)} · ${formatCount(Number(run.messagesRead))} mail lette in questo giro`
}

/** Contesto dell'ultimo errore: giro (se noto) e data dell'ultimo giro concluso, che è quello che l'ha registrato. */
export function lastErrorContext(
  mailbox: Pick<MailboxDto, 'lastErrorRunId' | 'lastRunAtUtc'>,
): string {
  const when = formatDateTime(mailbox.lastRunAtUtc, '')
  if (mailbox.lastErrorRunId === null) return when
  return when === '' ? `Giro ${mailbox.lastErrorRunId}` : `Giro ${mailbox.lastErrorRunId} · ${when}`
}

/** Massimo mostrato durante la lettura: il totale Gmail include Spam e Cestino, il 100% lo dice solo "Completato". */
export const BACKFILL_MAX_PERCENT_IN_PROGRESS = 99

export interface BackfillProgress {
  value: number
  /** Assente finché Gmail non ha restituito il totale: barra indeterminata. */
  max?: number
  valueText: string
}

/** Valori della barra di lettura dello storico: mail indicizzate su totale Gmail (approssimato, "~"). */
export function backfillProgress(
  mailbox: Pick<MailboxDto, 'messagesIndexed' | 'messagesTotal'>,
): BackfillProgress {
  const indexed = Number(mailbox.messagesIndexed)
  const total = mailbox.messagesTotal === null ? null : Number(mailbox.messagesTotal)

  if (total === null || !(total > 0)) {
    return { value: indexed, valueText: `${formatCount(indexed)} mail lette` }
  }

  const max = Math.max(total, indexed)
  const percent = Math.min(BACKFILL_MAX_PERCENT_IN_PROGRESS, Math.floor((indexed / max) * 100))
  return {
    value: indexed,
    max,
    valueText: `${formatCount(indexed)} / ~${formatCount(total)} mail · ${percent}%`,
  }
}

/** Azioni disponibili per stato: una casella Deleted non ne ha nessuna (D18). */
export function availableActions(status: MailboxStatus) {
  return {
    pause: status === MailboxStatusValue.Active,
    resume: status === MailboxStatusValue.Disabled,
    reconnect: status === MailboxStatusValue.TokenRevoked,
    remove: status !== MailboxStatusValue.Deleted,
  }
}
