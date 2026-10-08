import { useDark, useToggle } from '@vueuse/core'

/** Chiave della preferenza di tema: è una scelta di interfaccia, non un dato sensibile. */
export const THEME_STORAGE_KEY = 'dr-mailroom-theme'

/**
 * Tema chiaro ("hangar") o scuro ("ponte notturno").
 * Senza scelta esplicita segue prefers-color-scheme; la scelta resta tra una sessione e l'altra.
 */
export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: THEME_STORAGE_KEY,
  })
  const toggleTheme = useToggle(isDark)

  return { isDark, toggleTheme }
}
