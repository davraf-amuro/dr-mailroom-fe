import type { LocationQuery } from 'vue-router'

import type { FieldErrors } from '@/services/api/problem'
import {
  ProcessTypeValue,
  SubjectMatchTypeValue,
  type FilterDto,
  type FilterPreviewRequest,
  type FilterRequest,
  type ProcessType,
} from '@/services/filtersService'

/** Limiti e regole del server (D15): il frontend le anticipa. */
export const FILTER_LIMITS = {
  nameMax: 100,
  senderMax: 320,
  subjectValueMax: 500,
  subfolderMax: 200,
} as const

/** Query string con cui "Crea filtro" (vista Statistiche) apre il costruttore. */
export const SENDER_QUERY_KEY = 'sender'

/** Chiavi dei campi, uguali a quelle degli errori 400 del server (camelCase). */
export const FilterField = {
  name: 'name',
  senderAddress: 'senderAddress',
  mailboxId: 'mailboxId',
  subjectMatchType: 'subjectMatchType',
  subjectValue: 'subjectValue',
  attachmentSubfolder: 'attachmentSubfolder',
  processes: 'processes',
  isEnabled: 'isEnabled',
} as const

export type FilterFieldKey = (typeof FilterField)[keyof typeof FilterField]

export const FilterErrorMessages = {
  nameRequired: 'Dai un nome al filtro.',
  nameTooLong: `Il nome può avere al massimo ${FILTER_LIMITS.nameMax} caratteri.`,
  senderRequired: 'Indica il mittente.',
  senderInvalid: 'Indica un solo indirizzo email valido.',
  senderTooLong: `L'indirizzo può avere al massimo ${FILTER_LIMITS.senderMax} caratteri.`,
  subjectTypeMissing: "Scegli come confrontare l'oggetto oppure togli il testo.",
  subjectValueMissing: "Scrivi il testo da cercare nell'oggetto.",
  subjectValueTooLong: `Il testo può avere al massimo ${FILTER_LIMITS.subjectValueMax} caratteri.`,
  processesMissing: "Scegli almeno un'azione: estrarre gli allegati o creare un'allerta.",
  subfolderMissing: 'Indica la cartella in cui salvare gli allegati.',
  subfolderTooLong: `La cartella può avere al massimo ${FILTER_LIMITS.subfolderMax} caratteri.`,
  subfolderInvalid:
    'Usa un percorso relativo, senza «..», senza lettera di unità e senza caratteri non validi.',
} as const

export type SubjectChoice = '' | keyof typeof SubjectMatchTypeValue

/** Stato del costruttore: valori grezzi dei controlli. */
export interface FilterFormState {
  name: string
  senderAddress: string
  /** Stringa vuota = "Tutte le caselle". */
  mailboxId: string
  subjectMatchType: SubjectChoice
  subjectValue: string
  extractAttachments: boolean
  attachmentSubfolder: string
  createAlert: boolean
  isEnabled: boolean
}

export function emptyFilterForm(): FilterFormState {
  return {
    name: '',
    senderAddress: '',
    mailboxId: '',
    subjectMatchType: '',
    subjectValue: '',
    extractAttachments: true,
    attachmentSubfolder: '',
    createAlert: false,
    isEnabled: true,
  }
}

export function formFromFilter(filter: FilterDto): FilterFormState {
  const processes = filter.processes ?? []
  return {
    name: filter.name,
    senderAddress: filter.senderAddress,
    mailboxId: filter.mailboxId === null ? '' : String(filter.mailboxId),
    subjectMatchType: filter.subjectMatchType ?? '',
    subjectValue: filter.subjectValue ?? '',
    extractAttachments: processes.includes(ProcessTypeValue.AttachmentExtraction),
    attachmentSubfolder: filter.attachmentSubfolder ?? '',
    createAlert: processes.includes(ProcessTypeValue.Alert),
    isEnabled: filter.isEnabled,
  }
}

// Un solo indirizzo: niente spazi, virgole o punti e virgola; dominio con almeno un punto.
const SINGLE_EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/

export function isValidSenderAddress(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length <= FILTER_LIMITS.senderMax && SINGLE_EMAIL.test(trimmed)
}

const INVALID_PATH_CHARS = /[<>:"|?*]/
const DRIVE_LETTER = /^[a-zA-Z]:/

function hasControlChars(value: string): boolean {
  return [...value].some((char) => char.charCodeAt(0) < 32)
}

/** Sottocartella relativa: niente radice, `..`, unità o caratteri non validi per un percorso. */
export function isRelativeSubfolder(value: string): boolean {
  const path = value.trim()
  if (path === '' || path.startsWith('/') || path.startsWith('\\')) return false
  if (DRIVE_LETTER.test(path) || INVALID_PATH_CHARS.test(path) || hasControlChars(path))
    return false
  return !path.split(/[\\/]/).includes('..')
}

function fail(key: FilterFieldKey, message: string, into: FieldErrors): void {
  into[key] = [message]
}

/** Condizione sull'oggetto: errori su tipo e valore (condivisi con l'anteprima). */
function validateSubject(form: FilterFormState, errors: FieldErrors): void {
  const value = form.subjectValue.trim()
  if (form.subjectMatchType === '') {
    if (value !== '')
      fail(FilterField.subjectMatchType, FilterErrorMessages.subjectTypeMissing, errors)
    return
  }
  if (value === '') {
    fail(FilterField.subjectValue, FilterErrorMessages.subjectValueMissing, errors)
  } else if (value.length > FILTER_LIMITS.subjectValueMax) {
    fail(FilterField.subjectValue, FilterErrorMessages.subjectValueTooLong, errors)
  }
  // La regex la valida solo il server (motore .NET): il suo 400 arriva accanto al campo
}

function validateSender(form: FilterFormState, errors: FieldErrors): void {
  const sender = form.senderAddress.trim()
  if (sender === '') fail(FilterField.senderAddress, FilterErrorMessages.senderRequired, errors)
  else if (sender.length > FILTER_LIMITS.senderMax)
    fail(FilterField.senderAddress, FilterErrorMessages.senderTooLong, errors)
  else if (!isValidSenderAddress(sender))
    fail(FilterField.senderAddress, FilterErrorMessages.senderInvalid, errors)
}

function validateSubfolder(form: FilterFormState, errors: FieldErrors): void {
  const folder = form.attachmentSubfolder.trim()
  if (folder === '')
    fail(FilterField.attachmentSubfolder, FilterErrorMessages.subfolderMissing, errors)
  else if (folder.length > FILTER_LIMITS.subfolderMax)
    fail(FilterField.attachmentSubfolder, FilterErrorMessages.subfolderTooLong, errors)
  else if (!isRelativeSubfolder(folder))
    fail(FilterField.attachmentSubfolder, FilterErrorMessages.subfolderInvalid, errors)
}

/** Regole del filtro (D15) per salvare. Oggetto vuoto = nessun errore. */
export function validateFilterForm(form: FilterFormState): FieldErrors {
  const errors: FieldErrors = {}
  const name = form.name.trim()
  if (name === '') fail(FilterField.name, FilterErrorMessages.nameRequired, errors)
  else if (name.length > FILTER_LIMITS.nameMax)
    fail(FilterField.name, FilterErrorMessages.nameTooLong, errors)

  validateSender(form, errors)
  validateSubject(form, errors)

  if (!form.extractAttachments && !form.createAlert) {
    fail(FilterField.processes, FilterErrorMessages.processesMissing, errors)
  }
  if (form.extractAttachments) validateSubfolder(form, errors)
  return errors
}

/** Regole dell'anteprima: come il filtro, senza nome, processi e sottocartella. */
export function validatePreviewForm(form: FilterFormState): FieldErrors {
  const errors: FieldErrors = {}
  validateSender(form, errors)
  validateSubject(form, errors)
  return errors
}

function selectedProcesses(form: FilterFormState): ProcessType[] {
  const processes: ProcessType[] = []
  if (form.extractAttachments) processes.push(ProcessTypeValue.AttachmentExtraction)
  if (form.createAlert) processes.push(ProcessTypeValue.Alert)
  return processes
}

function mailboxIdOf(form: FilterFormState): number | null {
  return form.mailboxId === '' ? null : Number(form.mailboxId)
}

/**
 * Body di POST/PUT. Con "Nessuna condizione" tipo e valore vanno omessi (null);
 * la sottocartella viaggia solo se si estraggono gli allegati.
 */
export function buildFilterRequest(form: FilterFormState): FilterRequest {
  const hasSubject = form.subjectMatchType !== ''
  return {
    name: form.name.trim(),
    senderAddress: form.senderAddress.trim(),
    mailboxId: mailboxIdOf(form),
    subjectMatchType: hasSubject ? form.subjectMatchType : null,
    subjectValue: hasSubject ? form.subjectValue.trim() : null,
    attachmentSubfolder: form.extractAttachments ? form.attachmentSubfolder.trim() : null,
    isEnabled: form.isEnabled,
    processes: selectedProcesses(form),
  }
}

export function buildPreviewRequest(form: FilterFormState): FilterPreviewRequest {
  const hasSubject = form.subjectMatchType !== ''
  return {
    senderAddress: form.senderAddress.trim(),
    mailboxId: mailboxIdOf(form),
    subjectMatchType: hasSubject ? form.subjectMatchType : null,
    subjectValue: hasSubject ? form.subjectValue.trim() : null,
  }
}

const FILTER_FIELD_KEYS: readonly string[] = Object.values(FilterField)

/** Separa gli errori 400 per campo (chiavi camelCase) da quelli senza un campo corrispondente. */
export function splitServerErrors(serverErrors: FieldErrors): {
  fields: FieldErrors
  unmatched: string[]
} {
  const fields: FieldErrors = {}
  const unmatched: string[] = []
  for (const [key, messages] of Object.entries(serverErrors)) {
    if (FILTER_FIELD_KEYS.includes(key)) fields[key] = messages
    else unmatched.push(...messages)
  }
  return { fields, unmatched }
}

function firstValue(query: LocationQuery, key: string): string | null {
  const value = query[key]
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : null
}

/** Mittente da `?sender=`: l'indirizzo se valido, altrimenti null (la query viene ignorata). */
export function readSenderPrefill(query: LocationQuery): string | null {
  const raw = firstValue(query, SENDER_QUERY_KEY)?.trim()
  return raw !== undefined && raw !== '' && isValidSenderAddress(raw) ? raw : null
}
