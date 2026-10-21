import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SenderOverviewTable from '../SenderOverviewTable.vue'

const markup = '<img src=x onerror=alert(1)><b>Fattura</b>'

function mountTable(sentCount = 0) {
  return mount(SenderOverviewTable, {
    props: {
      sortBy: 'MailCount',
      sortDir: 'Desc',
      rows: [
        {
          senderAddress: 'a@x.it',
          senderName: '<i>Nome</i>',
          mailCount: 1500,
          sentCount,
          attachmentCount: 49,
          firstReceivedAtUtc: '2024-01-01T08:00:00',
          firstSubject: markup,
          lastReceivedAtUtc: '2026-01-01T08:00:00',
          lastSubject: null,
        },
      ],
    },
  })
}

describe('SenderOverviewTable', () => {
  it('oggetti e nomi con markup restano testo', () => {
    const wrapper = mountTable()
    expect(wrapper.find('tbody img').exists()).toBe(false)
    expect(wrapper.find('tbody b').exists()).toBe(false)
    expect(wrapper.find('tbody i').exists()).toBe(false)
    expect(wrapper.text()).toContain('<b>Fattura</b>')
    expect(wrapper.text()).toContain('(senza oggetto)')
  })

  it('date in <time datetime> e ordinamento annunciato con aria-sort', () => {
    const wrapper = mountTable()
    expect(wrapper.findAll('time').map((t) => t.attributes('datetime'))).toEqual([
      '2026-01-01T08:00:00',
      '2024-01-01T08:00:00',
    ])
    const sorts = wrapper.findAll('th[aria-sort]').map((th) => th.attributes('aria-sort'))
    expect(sorts).toEqual(['none', 'descending', 'none', 'none'])
  })

  it('le azioni emettono indirizzo per ordinamento, mail, dettaglio e "Crea filtro"', async () => {
    const wrapper = mountTable()
    await wrapper.findAll('thead button')[0]!.trigger('click')
    const buttons = wrapper.findAll('tbody button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    await buttons[2]!.trigger('click')
    expect(wrapper.emitted('sort')).toEqual([['SenderAddress']])
    expect(wrapper.emitted('messages')).toEqual([['a@x.it']])
    expect(wrapper.emitted('details')).toEqual([['a@x.it']])
    expect(wrapper.emitted('createFilter')).toEqual([['a@x.it']])
  })
})

describe('SenderOverviewTable: posta inviata', () => {
  it('nessuna inviata: nessun segno', () => {
    expect(mountTable().text()).not.toContain('inviat')
  })

  it('tutte inviate: badge testuale "Posta inviata"', () => {
    expect(mountTable(1500).find('tbody th').text()).toContain('Posta inviata')
  })

  it('in parte inviate: conteggio delle inviate', () => {
    expect(mountTable(12).find('tbody th').text()).toContain('12 inviate')
  })
})
