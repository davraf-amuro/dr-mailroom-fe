import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SenderMessagesTable from '../SenderMessagesTable.vue'

const markup = '<img src=x onerror=alert(1)><b>Promo</b>'

function mountTable(sortDir: 'Asc' | 'Desc' = 'Desc') {
  return mount(SenderMessagesTable, {
    props: {
      senderAddress: 'a@x.it',
      sortDir,
      rows: [
        {
          id: 1,
          subject: markup,
          receivedAtUtc: '2026-01-01T08:00:00',
          labels: 'INBOX,CATEGORY_PROMOTIONS,Label_12',
          hasAttachments: true,
        },
        {
          id: 2,
          subject: null,
          receivedAtUtc: '2025-06-01T08:00:00',
          labels: null,
          hasAttachments: false,
        },
      ],
    },
  })
}

describe('SenderMessagesTable', () => {
  it('oggetti con markup restano testo; oggetto assente → "(senza oggetto)"', () => {
    const wrapper = mountTable()
    expect(wrapper.find('tbody img').exists()).toBe(false)
    expect(wrapper.find('tbody b').exists()).toBe(false)
    expect(wrapper.text()).toContain('<b>Promo</b>')
    expect(wrapper.text()).toContain('(senza oggetto)')
  })

  it('label di sistema tradotte, label utente come id', () => {
    const firstRow = mountTable().findAll('tbody tr')[0]!
    const labels = firstRow.findAll('li').map((li) => li.text())
    expect(labels).toEqual(['Posta in arrivo', 'Promozioni', 'Label_12'])
  })

  it('allegati annunciati a parole, non solo con l’icona', () => {
    const rows = mountTable().findAll('tbody tr')
    expect(rows[0]!.text()).toContain('Contiene allegati')
    expect(rows[1]!.text()).toContain('Nessun allegato')
  })

  it('data in <time datetime> e verso annunciato con aria-sort', async () => {
    const wrapper = mountTable('Asc')
    expect(wrapper.find('time').attributes('datetime')).toBe('2026-01-01T08:00:00')
    expect(wrapper.find('th[aria-sort]').attributes('aria-sort')).toBe('ascending')
    await wrapper.find('thead button').trigger('click')
    expect(wrapper.emitted('toggleSort')).toHaveLength(1)
  })
})
