import { nextTick } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { START_LOCATION, type Router } from 'vue-router'

/**
 * Cambio di vista con la View Transitions API (design.md, "Motion": 200 ms).
 * Nessuna transizione se il browser non la supporta o se l'utente preferisce meno movimento.
 * Restituisce la funzione che rimuove gli hook dal router.
 */
export function useViewTransition(router: Router): () => void {
  const reducedMotion = usePreferredReducedMotion()
  let finishTransition: (() => void) | null = null

  const removeBefore = router.beforeResolve((to, from) => {
    if (from === START_LOCATION || to.path === from.path) return
    if (typeof document.startViewTransition !== 'function') return
    if (reducedMotion.value === 'reduce') return

    // La navigazione prosegue solo quando il browser ha catturato la vista vecchia.
    return new Promise<void>((resolveNavigation) => {
      document.startViewTransition(
        () =>
          new Promise<void>((resolveTransition) => {
            finishTransition = resolveTransition
            resolveNavigation()
          }),
      )
    })
  })

  // afterEach scatta anche sulle navigazioni fallite: la transizione si chiude sempre.
  const removeAfter = router.afterEach(async () => {
    if (finishTransition === null) return
    await nextTick()
    finishTransition()
    finishTransition = null
  })

  return () => {
    removeBefore()
    removeAfter()
  }
}
