/**
 * Configurazione letta a runtime da `config.json` (servito accanto a index.html),
 * così la stessa build gira con indirizzi e chiavi diversi senza essere ricompilata.
 * La chiave API resta in questa variabile di modulo, mai nello storage persistente del browser.
 */
export interface RuntimeConfig {
  apiBaseUrl: string
  apiKey: string
}

export const RUNTIME_CONFIG_PATH = '/config.json'

let current: RuntimeConfig | null = null

export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RuntimeConfigError'
  }
}

/** Valida il contenuto di config.json: arriva da fuori, quindi non si dà per buono. */
export function parseRuntimeConfig(raw: unknown): RuntimeConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new RuntimeConfigError('config.json non contiene un oggetto JSON')
  }

  const { apiBaseUrl, apiKey } = raw as Record<string, unknown>

  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim() === '') {
    throw new RuntimeConfigError('config.json: "apiBaseUrl" mancante o vuoto')
  }
  try {
    new URL(apiBaseUrl)
  } catch {
    throw new RuntimeConfigError('config.json: "apiBaseUrl" non è un indirizzo valido')
  }
  if (typeof apiKey !== 'string') {
    throw new RuntimeConfigError('config.json: "apiKey" deve essere una stringa')
  }

  return { apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''), apiKey }
}

export async function loadRuntimeConfig(
  path: string = RUNTIME_CONFIG_PATH,
): Promise<RuntimeConfig> {
  const response = await fetch(path, { cache: 'no-store' })
  if (!response.ok) {
    throw new RuntimeConfigError(`${path} non raggiungibile (HTTP ${response.status})`)
  }
  current = parseRuntimeConfig(await response.json())
  return current
}

export function getRuntimeConfig(): RuntimeConfig {
  if (current === null) {
    throw new RuntimeConfigError('Configurazione runtime non ancora caricata')
  }
  return current
}
