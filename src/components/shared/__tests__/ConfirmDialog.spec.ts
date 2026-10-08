import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'

import ConfirmDialog from '../ConfirmDialog.vue'

// Ospite di prova: un pulsante d'origine che apre la conferma, come farà una vista.
const Host = defineComponent({
  components: { ConfirmDialog },
  setup() {
    const open = ref(false)
    const confirmed = ref(0)
    return { open, confirmed }
  },
  template: `
    <button id="origin" type="button" @click="open = true">Elimina</button>
    <ConfirmDialog
      v-model:open="open"
      title="Eliminare la casella?"
      description="L'operazione non si annulla dal frontend."
      confirm-label="Elimina"
      tone="danger"
      @confirm="confirmed++"
    />
  `,
})

async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('ConfirmDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('apre una alertdialog con titolo e descrizione e sposta il focus dentro', async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    const origin = document.getElementById('origin') as HTMLButtonElement
    origin.focus()
    await wrapper.find('#origin').trigger('click')
    await settle()

    const dialog = document.querySelector('[role="alertdialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Eliminare la casella?')
    expect(dialog!.contains(document.activeElement)).toBe(true)
    wrapper.unmount()
  })

  it("Esc chiude la finestra e il focus torna al pulsante d'origine", async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    const origin = document.getElementById('origin') as HTMLButtonElement
    origin.focus()
    await wrapper.find('#origin').trigger('click')
    await settle()

    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await settle()

    expect(document.querySelector('[role="alertdialog"]')).toBeNull()
    expect(document.activeElement).toBe(origin)
    wrapper.unmount()
  })

  it('il pulsante di conferma emette confirm senza chiudere da solo', async () => {
    const wrapper = mount(Host, { attachTo: document.body })
    await wrapper.find('#origin').trigger('click')
    await settle()

    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')]
    buttons.find((b) => b.textContent?.trim() === 'Elimina')!.click()
    await settle()

    expect(wrapper.vm.confirmed).toBe(1)
    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull()
    wrapper.unmount()
  })
})
