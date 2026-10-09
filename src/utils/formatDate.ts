const dateTimeFormat = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const timeFormat = new Intl.DateTimeFormat('it-IT', { timeStyle: 'medium' })

/** Data UTC dell'API mostrata nell'ora locale; null → testo di ripiego. */
export function formatDateTime(utc: string | null | undefined, fallback = '—'): string {
  if (utc === null || utc === undefined || utc === '') return fallback
  const date = new Date(utc)
  return Number.isNaN(date.getTime()) ? fallback : dateTimeFormat.format(date)
}

export function formatTime(utc: string | null | undefined, fallback = '—'): string {
  if (utc === null || utc === undefined || utc === '') return fallback
  const date = new Date(utc)
  return Number.isNaN(date.getTime()) ? fallback : timeFormat.format(date)
}
