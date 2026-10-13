import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { FilterMessageDto } from '@/services/filtersService'
import FilterMessagesTable from '../FilterMessagesTable.vue'

const archived: FilterMessageDto = {
  id: 1,
  mailboxId: 1,
  subject: 'Il tuo codice SCONTO10',
  receivedAtUtc: '2026-01-01T08:00:00',
  hasAttachments: false,
  isArchived: true,
}

const missing: FilterMessageDto = {
  id: 2,
  mailboxId: 1,
  subject: null,
  receivedAtUtc: '2025-12-01T08:00:00',
  hasAttachments: true,
  isArchived: false,
}

function mountTable(downloading: string | null = null) {
  return mount(FilterMessagesTable, {
    props: {
      rows: [archived, missing],
      filterName: 'Sconti',
      sortDir: 'Desc',
      isDownloading: (message: FilterMessageDto, format: string) =>
        downloading === `${message.id}:${format}`,
    },
  })
}

function rowButtons(wrapper: ReturnType<typeof mountTable>, index: number) {
  return wrapper.findAll('tbody tr')[index]!.findAll('button')
}

describe('FilterMessagesTable', () => {
  it('lo stato del contenuto è scritto a parole, non solo a colori', () => {
    const rows = mountTable().findAll('tbody tr')
    expect(rows[0]!.text()).toContain('Salvato')
    expect(rows[1]!.text()).toContain('Non salvato')
  })

  it('i pulsanti nominano la mail su cui agiscono', () => {
    const labels = rowButtons(mountTable(), 0).map((b) => b.attributes('aria-label'))
    expect(labels).toEqual([
      'Leggi il testo della mail «Il tuo codice SCONTO10»',
      'Scarica la mail «Il tuo codice SCONTO10» in formato .eml',
      'Scarica il testo della mail «Il tuo codice SCONTO10» in formato .txt',
    ])
    expect(rowButtons(mountTable(), 1)[0]!.attributes('aria-label')).toBe(
      'Leggi il testo della mail senza oggetto',
    )
  })

  it('senza contenuto salvato le azioni sono disabilitate e spiegano perché', () => {
    const wrapper = mountTable()
    for (const button of rowButtons(wrapper, 1)) {
      expect(button.attributes('disabled')).toBeDefined()
      const reasonId = button.attributes('aria-describedby')
      expect(reasonId).toBe('not-archived-2')
      expect(wrapper.find(`#${reasonId}`).text()).toContain('Archivia le mancanti')
    }
  })

  it('le azioni di una mail archiviata non hanno un motivo da leggere', () => {
    for (const button of rowButtons(mountTable(), 0)) {
      expect(button.attributes('aria-describedby')).toBeUndefined()
    }
  })

  it('il clic sull’intestazione della data chiede di invertire l’ordine', async () => {
    const wrapper = mountTable()
    const th = wrapper.findAll('th').find((h) => h.text().includes('Data ricevimento'))!
    expect(th.attributes('aria-sort')).toBe('descending')
    await th.find('button').trigger('click')
    expect(wrapper.emitted('toggleSort')).toHaveLength(1)
  })

  it('emette testo e download con la mail e il formato', async () => {
    const wrapper = mountTable()
    const [text, eml, txt] = rowButtons(wrapper, 0)
    await text!.trigger('click')
    await eml!.trigger('click')
    await txt!.trigger('click')
    expect(wrapper.emitted('showText')).toEqual([[archived]])
    expect(wrapper.emitted('download')).toEqual([
      [archived, 'eml'],
      [archived, 'txt'],
    ])
  })

  it('il download in corso rende occupato solo il suo pulsante', () => {
    const [, eml, txt] = rowButtons(mountTable('1:eml'), 0)
    expect(eml!.attributes('aria-busy')).toBe('true')
    expect(txt!.attributes('aria-busy')).toBeUndefined()
  })
})
