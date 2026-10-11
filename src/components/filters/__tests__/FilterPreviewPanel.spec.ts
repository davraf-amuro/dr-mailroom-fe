import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import FilterPreviewPanel from '../FilterPreviewPanel.vue'

function message(id: number, isSent: boolean) {
  return {
    id,
    mailboxId: 1,
    senderAddress: isSent ? 'me@x.it' : 'fornitore@x.it',
    subject: `Oggetto ${id}`,
    receivedAtUtc: '2026-10-01T08:00:00',
    hasAttachments: false,
    isSent,
  }
}

describe('FilterPreviewPanel', () => {
  it('segnala con testo solo le mail di posta inviata', () => {
    const wrapper = mount(FilterPreviewPanel, {
      props: {
        busy: false,
        requested: true,
        preview: { totalMatches: 2, messages: [message(1, true), message(2, false)] },
      },
    })
    const items = wrapper.findAll('li')
    expect(items[0]!.text()).toContain('Posta inviata')
    expect(items[1]!.text()).not.toContain('Posta inviata')
  })
})
