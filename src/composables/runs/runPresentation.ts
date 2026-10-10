import type { Component } from 'vue'
import { Ban, CircleCheck, CircleX, LoaderCircle, SkipForward } from '@lucide/vue'
import type { LocationQuery } from 'vue-router'

import { processBadgeLabels } from '@/composables/filters/filterPresentation'
import type { ProcessType } from '@/services/filtersService'
import {
  RunStatusValue,
  RunTriggerValue,
  type RunDto,
  type RunStatus,
  type RunTrigger,
} from '@/services/runsService'
import { parseUtc } from '@/utils/formatDate'

export interface RunStatusPresentation {
  label: string
  tone: 'ok' | 'alert' | 'neutral' | 'federal' | 'caution'
  icon: Component
}

/** Badge degli stati: testo + icona + colore; Cancelled grigio (specifica). */
export const runStatusPresentation: Record<RunStatus, RunStatusPresentation> = {
  [RunStatusValue.Running]: { label: 'In corso', tone: 'federal', icon: LoaderCircle },
  [RunStatusValue.Completed]: { label: 'Completato', tone: 'ok', icon: CircleCheck },
  [RunStatusValue.Failed]: { label: 'Fallito', tone: 'alert', icon: CircleX },
  [RunStatusValue.Skipped]: { label: 'Saltato', tone: 'neutral', icon: SkipForward },
  [RunStatusValue.Cancelled]: { label: 'Annullato', tone: 'neutral', icon: Ban },
}

export const runTriggerLabels: Record<RunTrigger, string> = {
  [RunTriggerValue.Scheduled]: 'Schedulato',
  [RunTriggerValue.Manual]: 'Manuale',
  [RunTriggerValue.Reapply]: 'Riapplica',
}

export const runStatusOptions = (Object.keys(runStatusPresentation) as RunStatus[]).map(
  (value) => ({ value, label: runStatusPresentation[value].label }),
)

export const runTriggerOptions = (Object.keys(runTriggerLabels) as RunTrigger[]).map((value) => ({
  value,
  label: runTriggerLabels[value],
}))

/** Stati in cui il giro non cambia più: il polling si ferma. */
export function isFinalStatus(status: RunStatus): boolean {
  return status !== RunStatusValue.Running
}

export function hasRunningRun(runs: Pick<RunDto, 'status'>[]): boolean {
  return runs.some((run) => run.status === RunStatusValue.Running)
}

/** Processi richiesti da una riapplica: "AttachmentExtraction,Alert" → "Allegati, Allerta". */
export function requestedProcessesText(requested: string | null): string {
  if (requested === null || requested.trim() === '') return ''
  return requested
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p !== '')
    .map((p) => processBadgeLabels[p as ProcessType] ?? p)
    .join(', ')
}

/** Origine leggibile: "Riapplica · Fatture · Allegati" per i giri di riapplica. */
export function runOriginText(
  run: Pick<RunDto, 'trigger' | 'filterId' | 'requestedProcesses'>,
  filterNames: Map<string, string>,
): string {
  const label = runTriggerLabels[run.trigger]
  if (run.trigger !== RunTriggerValue.Reapply) return label
  const parts = [label]
  if (run.filterId !== null) {
    parts.push(filterNames.get(String(run.filterId)) ?? `Filtro ${run.filterId}`)
  }
  const processes = requestedProcessesText(run.requestedProcesses)
  if (processes !== '') parts.push(processes)
  return parts.join(' · ')
}

/** Nome della casella dall'elenco ridotto; se manca, la sua matricola. */
export function mailboxName(mailboxId: RunDto['mailboxId'], names: Map<string, string>): string {
  return names.get(String(mailboxId)) ?? `Casella ${mailboxId}`
}

/** Millisecondi di una data UTC dell'API, per ordinare; 0 se assente. */
export function utcMillis(utc: string | null): number {
  return parseUtc(utc)?.getTime() ?? 0
}

/**
 * Elenco di id da una query (`?runIds=4,5`): solo interi positivi, senza duplicati.
 * Un valore assente o tutto non valido → elenco vuoto.
 */
export function parseIdList(query: LocationQuery, key: string): string[] {
  const raw = query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return []
  const ids = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /^[1-9]\d{0,17}$/.test(part))
  return [...new Set(ids)]
}

/**
 * Ora UTC senza designatore di fuso ("2026-10-09T22:00:00.000"): il binding di ASP.NET convertirebbe
 * una data con "Z" nell'ora locale del server, mentre le colonne …Utc vanno confrontate così come sono.
 */
function toUtcWithoutZone(local: string): string | undefined {
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, -1)
}

/** Inizio del giorno locale (input type="date") in UTC; stringa vuota → undefined. */
export function localDayStartUtc(day: string): string | undefined {
  return day === '' ? undefined : toUtcWithoutZone(`${day}T00:00:00`)
}

/** Fine del giorno locale (23:59:59.999) in UTC; stringa vuota → undefined. */
export function localDayEndUtc(day: string): string | undefined {
  return day === '' ? undefined : toUtcWithoutZone(`${day}T23:59:59.999`)
}
