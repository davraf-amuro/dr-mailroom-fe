import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { readSenderPrefill, SENDER_QUERY_KEY } from './filterForm'

/**
 * Al caricamento della vista legge `?sender=<indirizzo>` (azione "Crea filtro" delle statistiche):
 * un indirizzo valido va a `onSender`, uno non valido viene ignorato.
 * In ogni caso la query viene ripulita, così un ricaricamento non ripete la precompilazione.
 */
export function useSenderPrefill(onSender: (address: string) => void): void {
  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    if (route.query[SENDER_QUERY_KEY] === undefined) return
    const address = readSenderPrefill(route.query)
    if (address !== null) onSender(address)
    const query = { ...route.query }
    delete query[SENDER_QUERY_KEY]
    void router.replace({ query })
  })
}
