import type { Component } from 'vue'
import { CircleCheck, CircleX, KeyRound, Pause } from '@lucide/vue'

import {
  MailboxStatusValue,
  type MailboxDto,
  type MailboxStatus,
} from '@/services/mailboxesService'

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

/** Azioni disponibili per stato: una casella Deleted non ne ha nessuna (D18). */
export function availableActions(status: MailboxStatus) {
  return {
    pause: status === MailboxStatusValue.Active,
    resume: status === MailboxStatusValue.Disabled,
    reconnect: status === MailboxStatusValue.TokenRevoked,
    remove: status !== MailboxStatusValue.Deleted,
  }
}
