import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { MailboxStatus } from '@/services/mailboxesService'
import MailboxActions from '../MailboxActions.vue'
import MailboxStatusBadge from '../MailboxStatusBadge.vue'

describe('MailboxStatusBadge', () => {
  it.each<[MailboxStatus, string]>([
    ['Active', 'Attiva'],
    ['TokenRevoked', 'Token revocato'],
    ['Disabled', 'In pausa'],
    ['Deleted', 'Eliminata'],
  ])('%s ha un badge con testo "%s" e icona', (status, label) => {
    const wrapper = mount(MailboxStatusBadge, { props: { status } })
    expect(wrapper.text()).toBe(label)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('Deleted è barrato', () => {
    const wrapper = mount(MailboxStatusBadge, { props: { status: 'Deleted' } })
    expect(wrapper.classes()).toContain('line-through')
  })
})

describe('MailboxActions', () => {
  function labels(status: MailboxStatus): string[] {
    const wrapper = mount(MailboxActions, { props: { status, emailAddress: 'a@b.it' } })
    return wrapper.findAll('button').map((b) => b.text())
  }

  it('azioni per stato: Pausa, Riprendi, Ricollega; nessuna modifica su Deleted', () => {
    expect(labels('Active')).toEqual(['Pausa', 'Dettagli', 'Elimina'])
    expect(labels('Disabled')).toEqual(['Riprendi', 'Dettagli', 'Elimina'])
    expect(labels('TokenRevoked')).toEqual(['Ricollega', 'Dettagli', 'Elimina'])
    expect(labels('Deleted')).toEqual(['Dettagli'])
  })
})
