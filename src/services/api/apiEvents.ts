/**
 * Segnali globali emessi dal client HTTP, indipendenti dalla vista che ha fatto la chiamata:
 * il banner di stato e l'avviso sulla chiave li ascoltano senza conoscere i servizi.
 */
export type ApiAlarm =
  | { kind: 'databaseUnavailable'; detail: string | null }
  | { kind: 'unauthorized'; status: 401 | 403 }

type Listener = (alarm: ApiAlarm) => void

const listeners = new Set<Listener>()

/** Registra un ascoltatore; restituisce la funzione per rimuoverlo. */
export function onApiAlarm(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitApiAlarm(alarm: ApiAlarm): void {
  for (const listener of listeners) listener(alarm)
}
