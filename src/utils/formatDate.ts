const dateTimeFormat = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const timeFormat = new Intl.DateTimeFormat('it-IT', { timeStyle: 'medium' })

// Fuso esplicito in coda: "Z", "+02:00", "-0500".
const TIME_ZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i

/**
 * Le date "…Utc" dell'API sono in UTC, ma alcune arrivano senza designatore di fuso
 * (es. "2026-10-08T19:45:17.1889184"): senza correzione il browser le leggerebbe come ora locale.
 */
export function parseUtc(utc: string | null | undefined): Date | null {
  if (utc === null || utc === undefined || utc === '') return null
  const date = new Date(TIME_ZONE_SUFFIX.test(utc) ? utc : `${utc}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Data UTC dell'API mostrata nell'ora locale; null → testo di ripiego. */
export function formatDateTime(utc: string | null | undefined, fallback = '—'): string {
  const date = parseUtc(utc)
  return date === null ? fallback : dateTimeFormat.format(date)
}

export function formatTime(utc: string | null | undefined, fallback = '—'): string {
  const date = parseUtc(utc)
  return date === null ? fallback : timeFormat.format(date)
}
