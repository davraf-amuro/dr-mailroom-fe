import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SortableTable from '../SortableTable.vue'

const columns = [
  { key: 'sender', label: 'Mittente', sortable: true },
  { key: 'count', label: 'Mail', sortable: true, align: 'end' as const },
  { key: 'note', label: 'Nota' },
]
const rows = [
  { id: 1, sender: 'beta@x.it', count: 9, note: 'a' },
  { id: 2, sender: 'Alfa@x.it', count: 120, note: 'b' },
  { id: 3, sender: 'gamma@x.it', count: 30, note: 'c' },
]

function firstColumn(wrapper: ReturnType<typeof mount>, index: number): string[] {
  return wrapper.findAll('tbody tr').map((tr) => tr.findAll('td')[index]!.text())
}

describe('SortableTable', () => {
  it('le intestazioni ordinabili sono pulsanti con aria-sort, le altre no', () => {
    const wrapper = mount(SortableTable, {
      props: { columns, rows, rowKey: 'id', caption: 'Mittenti' },
    })
    const headers = wrapper.findAll('th')
    expect(headers[0]!.attributes('aria-sort')).toBe('none')
    expect(headers[0]!.find('button').exists()).toBe(true)
    expect(headers[2]!.attributes('aria-sort')).toBeUndefined()
    expect(headers[2]!.find('button').exists()).toBe(false)
    expect(wrapper.find('caption').text()).toBe('Mittenti')
  })

  it('il clic ordina in modo crescente e poi decrescente, aggiornando aria-sort', async () => {
    const wrapper = mount(SortableTable, {
      props: {
        columns,
        rows,
        rowKey: 'id',
        caption: 'Mittenti',
        'onUpdate:sort': (value: unknown) => wrapper.setProps({ sort: value as never }),
      },
    })

    await wrapper.findAll('th')[1]!.find('button').trigger('click')
    expect(wrapper.findAll('th')[1]!.attributes('aria-sort')).toBe('ascending')
    expect(firstColumn(wrapper, 1)).toEqual(['9', '30', '120'])

    await wrapper.findAll('th')[1]!.find('button').trigger('click')
    expect(wrapper.findAll('th')[1]!.attributes('aria-sort')).toBe('descending')
    expect(firstColumn(wrapper, 1)).toEqual(['120', '30', '9'])
  })

  it('ordina il testo senza distinguere maiuscole', async () => {
    const wrapper = mount(SortableTable, {
      props: {
        columns,
        rows,
        rowKey: 'id',
        caption: 'Mittenti',
        sort: { key: 'sender', direction: 'ascending' },
      },
    })
    expect(firstColumn(wrapper, 0)).toEqual(['Alfa@x.it', 'beta@x.it', 'gamma@x.it'])
  })
})
