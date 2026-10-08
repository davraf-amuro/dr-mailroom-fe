import { defineStore } from 'pinia'

import { useTheme } from '@/composables/shared/useTheme'

/** Stato di interfaccia condiviso da tutte le viste (tema, in seguito avvisi globali). */
export const useUiStore = defineStore('ui', () => {
  const { isDark, toggleTheme } = useTheme()

  return { isDark, toggleTheme }
})
