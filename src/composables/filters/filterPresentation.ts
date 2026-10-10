import {
  ProcessTypeValue,
  SubjectMatchTypeValue,
  type FilterDto,
  type ProcessType,
} from '@/services/filtersService'
import type { SubjectChoice } from './filterForm'

export const subjectChoiceOptions: { value: SubjectChoice; label: string }[] = [
  { value: '', label: 'Nessuna condizione' },
  { value: SubjectMatchTypeValue.StartsWith, label: 'Inizia con' },
  { value: SubjectMatchTypeValue.Contains, label: 'Contiene' },
  { value: SubjectMatchTypeValue.Regex, label: 'Espressione regolare' },
]

/** Verbo nella frase del filtro: «l'oggetto contiene "fattura"». */
const subjectVerb: Record<keyof typeof SubjectMatchTypeValue, string> = {
  StartsWith: 'inizia con',
  Contains: 'contiene',
  Regex: 'corrisponde a',
}

export const processLabels: Record<ProcessType, string> = {
  AttachmentExtraction: 'Estrai allegati',
  Alert: 'Crea allerta',
}

/** Forma breve per i badge dell'elenco (specifica: "Allegati", "Allerta"). */
export const processBadgeLabels: Record<ProcessType, string> = {
  AttachmentExtraction: 'Allegati',
  Alert: 'Allerta',
}

export interface SubjectCondition {
  verb: string
  value: string
}

export function subjectCondition(filter: FilterDto): SubjectCondition | null {
  if (filter.subjectMatchType === null || filter.subjectValue === null) return null
  return { verb: subjectVerb[filter.subjectMatchType], value: filter.subjectValue }
}

/** Nome della casella del filtro; null = vale per tutte. */
export function mailboxLabel(
  mailboxId: FilterDto['mailboxId'],
  names: ReadonlyMap<string, string>,
): string {
  if (mailboxId === null) return 'tutte le caselle'
  return names.get(String(mailboxId)) ?? `casella MR-${String(mailboxId).padStart(4, '0')}`
}

export function hasProcess(filter: FilterDto, process: ProcessType): boolean {
  return (filter.processes ?? []).includes(process)
}

/** Frase in chiaro per gli screen reader e per il nome accessibile della card. */
export function filterSentence(filter: FilterDto, mailbox: string): string {
  const parts = [`Quando scrive ${filter.senderAddress} su ${mailbox}`]
  const subject = subjectCondition(filter)
  if (subject !== null) parts.push(`e l'oggetto ${subject.verb} «${subject.value}»`)
  const actions: string[] = []
  if (hasProcess(filter, ProcessTypeValue.AttachmentExtraction)) {
    actions.push(`estrai gli allegati in ${filter.attachmentSubfolder ?? ''}`.trim())
  }
  if (hasProcess(filter, ProcessTypeValue.Alert)) actions.push("crea un'allerta")
  return `${parts.join(' ')}: ${actions.join(' e ')}`
}
