import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import { FilterMessagesMessages } from '@/composables/filters/filterMessagesPresentation'
import type { FilterMessageDto } from '@/services/filtersService'
import { formatDateTime } from '@/utils/formatDate'
import MessageTextDialog from '../MessageTextDialog.vue'

const message: FilterMessageDto = {
  id: 1,
  mailboxId: 1,
  subject: 'Il tuo codice',
  receivedAtUtc: '2026-01-01T08:00:00',
  hasAttachments: false,
  isArchived: true,
}

async function settle(): Promise<void> {
  await flushPromises()
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function mountDialog(props: Partial<InstanceType<typeof MessageTextDialog>['$props']> = {}) {
  return mount(MessageTextDialog, {
    attachTo: document.body,
    props: { open: true, message, loading: false, text: null, error: null, ...props },
  })
}

function dialog(): HTMLElement {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')!
}

describe('MessageTextDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('titolo con l’oggetto, testo con a capo preservati', async () => {
    mountDialog({ text: 'Riga 1\n\nCodice: SCONTO10' })
    await settle()
    const heading = dialog().querySelector('h2')!
    expect(heading.textContent).toContain('Il tuo codice')
    expect(heading.textContent).toContain(formatDateTime(message.receivedAtUtc))
    const pre = dialog().querySelector('pre')!
    expect(pre.textContent).toBe('Riga 1\n\nCodice: SCONTO10')
    expect(pre.getAttribute('tabindex')).toBe('0')
  })

  it('in caricamento niente testo e copia disabilitata', async () => {
    mountDialog({ loading: true })
    await settle()
    expect(dialog().querySelector('pre')).toBeNull()
    const copy = [...dialog().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Copia testo'),
    )!
    expect(copy.disabled).toBe(true)
  })

  it('errore → avviso al posto del testo', async () => {
    mountDialog({ error: FilterMessagesMessages.contentMissing })
    await settle()
    expect(dialog().textContent).toContain(FilterMessagesMessages.contentMissing)
    expect(dialog().querySelector('pre')).toBeNull()
  })

  it('chiudere l’avviso di errore chiude il dialogo', async () => {
    const onUpdate = vi.fn<(value: boolean) => void>()
    mountDialog({ error: FilterMessagesMessages.contentMissing, 'onUpdate:open': onUpdate })
    await settle()
    dialog().querySelector<HTMLButtonElement>('button[aria-label="Chiudi avviso"]')!.click()
    await settle()
    expect(onUpdate).toHaveBeenCalledWith(false)
  })

  it('copia il testo e lo annuncia; se la copia fallisce lo dice', async () => {
    const copy = vi.fn<(text: string) => Promise<void>>().mockResolvedValue()
    const wrapper = mountDialog({ text: 'SCONTO10', copy })
    await settle()
    const button = () =>
      [...dialog().querySelectorAll('button')].find((b) => b.textContent?.includes('Copia testo'))!

    button().click()
    await settle()
    expect(copy).toHaveBeenCalledWith('SCONTO10')
    expect(dialog().textContent).toContain(FilterMessagesMessages.copied)

    copy.mockRejectedValueOnce(new Error('negato'))
    button().click()
    await settle()
    expect(dialog().textContent).toContain(FilterMessagesMessages.copyFailed)
    wrapper.unmount()
  })
})
