import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import type { FilterDto, ProcessType, RunsStartedDto } from '@/services/filtersService'
import { useFiltersStore } from '@/stores/filters'

/**
 * Nome della route di `router/routes/runs.ts`. Non si importa da lì: il ciclo route → vista → composable
 * farebbe perdere ai tipi l'estensione di `RouteMeta` nelle viste.
 */
const RUNS_ROUTE_NAME = 'runs'

/** Parametri con cui la vista Esecuzioni riceve i giri avviati dalla riapplica. */
export const RUNS_QUERY = { runIds: 'runIds', skippedMailboxIds: 'skippedMailboxIds' } as const

export const ReapplyMessages = {
  noProcess: 'Scegli almeno un processo da riapplicare.',
} as const

export interface ReapplyOptions {
  /** Porta alla vista Esecuzioni; sostituibile nei test. */
  navigate?: (query: Record<string, string>) => void
}

/** Query della vista Esecuzioni: `runIds` sempre, `skippedMailboxIds` solo se non vuoto. */
export function runsQueryFrom(started: RunsStartedDto): Record<string, string> {
  const query: Record<string, string> = { [RUNS_QUERY.runIds]: started.runIds.join(',') }
  if (started.skippedMailboxIds.length > 0) {
    query[RUNS_QUERY.skippedMailboxIds] = started.skippedMailboxIds.join(',')
  }
  return query
}

/** Modale "Riapplica": processi del filtro, avvio, poi vista Esecuzioni sui giri creati. */
export function useFilterReapply(options: ReapplyOptions = {}) {
  const router = useRouter()
  const navigate =
    options.navigate ??
    ((query: Record<string, string>) => void router.push({ name: RUNS_ROUTE_NAME, query }))
  const store = useFiltersStore()

  const target = ref<FilterDto | null>(null)
  const selected = ref<ProcessType[]>([])
  const busy = ref(false)
  const error = ref<string | null>(null)

  const open = computed({
    get: () => target.value !== null,
    set: (value: boolean) => {
      if (!value) target.value = null
    },
  })

  /** Checkbox dei soli processi del filtro, tutte selezionate (specifica). */
  function ask(filter: FilterDto): void {
    target.value = filter
    selected.value = [...(filter.processes ?? [])]
    error.value = null
  }

  async function confirm(): Promise<void> {
    const filter = target.value
    if (filter === null) return
    if (selected.value.length === 0) {
      error.value = ReapplyMessages.noProcess
      return
    }
    busy.value = true
    error.value = null
    try {
      const result = await store.reapply(filter.id, selected.value)
      if (result.kind === 'started') {
        target.value = null
        navigate(runsQueryFrom(result.started))
      } else if (result.kind === 'rejected') {
        error.value = result.message
      } else {
        target.value = null
      }
    } finally {
      busy.value = false
    }
  }

  return { target, open, selected, busy, error, ask, confirm }
}
