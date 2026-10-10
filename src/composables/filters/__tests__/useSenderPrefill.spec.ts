import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { useSenderPrefill } from '../useSenderPrefill'

/** Monta la vista di prova su `/filters` con la query data e restituisce il router e il campo mittente. */
async function mountAt(path: string) {
  const sender = ref('')
  const View = defineComponent({
    setup() {
      useSenderPrefill((address) => {
        sender.value = address
      })
      return () => h('div')
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/filters', name: 'filters', component: View }],
  })
  await router.push(path)
  await router.isReady()
  mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] } })
  await flushPromises()
  return { router, sender }
}

describe('useSenderPrefill (/filters?sender=)', () => {
  it('indirizzo valido → campo mittente valorizzato e query ripulita', async () => {
    const { router, sender } = await mountAt('/filters?sender=fatture%40fornitore.it&altro=1')
    expect(sender.value).toBe('fatture@fornitore.it')
    expect(router.currentRoute.value.query).toEqual({ altro: '1' })
  })

  it('indirizzo non valido → ignorato, ma la query viene ripulita', async () => {
    const { router, sender } = await mountAt('/filters?sender=non-una-email')
    expect(sender.value).toBe('')
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('più indirizzi nel parametro → ignorato', async () => {
    const { sender } = await mountAt('/filters?sender=a%40b.it%2Cc%40d.it')
    expect(sender.value).toBe('')
  })

  it('senza parametro non cambia nulla', async () => {
    const { router, sender } = await mountAt('/filters?x=1')
    expect(sender.value).toBe('')
    expect(router.currentRoute.value.query).toEqual({ x: '1' })
  })
})
