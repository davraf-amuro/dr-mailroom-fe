import { expect, test } from '@playwright/test'

import { mockApi, MockResponse } from './support/mockApi'

const MAILBOX = {
  id: 1,
  emailAddress: 'prova@example.com',
  status: 'Active',
  isConnected: true,
  backfillCompleted: true,
  backfillInProgress: false,
  messagesTotal: 120,
  messagesIndexed: 120,
  currentRun: null,
  lastRunAtUtc: '2026-10-10T08:00:00Z',
  lastError: null,
  lastErrorRunId: null,
}

function run(status: 'Running' | 'Completed', messagesRead: number) {
  return {
    id: 41,
    mailboxId: 1,
    trigger: 'Manual',
    filterId: null,
    requestedProcesses: null,
    status,
    startedAtUtc: '2026-10-11T09:00:00Z',
    endedAtUtc: status === 'Completed' ? '2026-10-11T09:00:09Z' : null,
    messagesRead,
    messagesProcessed: messagesRead,
    errorCount: 0,
    errorSummary: null,
  }
}

test('caselle: senza caselle compare l’hangar vuoto con il collegamento della prima', async ({
  page,
}) => {
  const api = await mockApi(page)

  await page.goto('/mailboxes')

  await expect(page.getByRole('button', { name: 'Collega la prima casella' })).toBeVisible()
  await expect(page.getByText('sola lettura')).toBeVisible()
  expect(api.unhandled).toEqual([])
})

test('filtri: il 400 del server segna il campo e lascia il filtro da correggere', async ({
  page,
}) => {
  const api = await mockApi(page)
  let posted: unknown = null
  api.on('POST', '/api/v1/filters', (route) => {
    posted = route.request().postDataJSON()
    return new MockResponse(
      400,
      {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { Name: ['Esiste già un filtro con questo nome.'] },
      },
      'application/problem+json',
    )
  })

  await page.goto('/filters')
  const form = page.getByRole('form', { name: 'Nuovo filtro' })
  await form.getByLabel('Nome del filtro').fill('Fatture')
  await form.getByLabel('Mittente', { exact: true }).fill('fatture@fornitore.it')
  // Solo l'allerta: con l'estrazione allegati servirebbe anche la sottocartella.
  await form.getByLabel('Estrai allegati').uncheck()
  await form.getByLabel("Crea un'allerta").check()
  await form.getByRole('button', { name: 'Crea filtro' }).click()

  const name = form.getByLabel('Nome del filtro')
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByText('Esiste già un filtro con questo nome.')).toBeVisible()
  await expect(name).toHaveValue('Fatture')
  expect(posted).toMatchObject({ name: 'Fatture', senderAddress: 'fatture@fornitore.it' })
  expect(api.unhandled).toEqual([])
})

test('esecuzioni: «Esegui ora» lancia il giro e il polling lo segue fino a Completed', async ({
  page,
}) => {
  const api = await mockApi(page)
  let reads = 0
  api.on('GET', '/api/v1/mailboxes', () => [MAILBOX])
  api.on('GET', '/api/v1/mailboxes/summary', () => [
    { id: 1, emailAddress: MAILBOX.emailAddress, status: 'Active' },
  ])
  api.on(
    'POST',
    '/api/v1/runs',
    () => new MockResponse(202, { runIds: [41], skippedMailboxIds: [] }),
  )
  api.on('GET', '/api/v1/runs/41', () => {
    reads += 1
    return reads < 3 ? run('Running', 30) : run('Completed', 120)
  })

  await page.goto('/runs')
  await page.getByRole('button', { name: 'Esegui ora' }).click()

  const card = page
    .getByRole('article')
    .filter({ hasText: 'Giro 41' })
    .or(page.locator('[aria-labelledby="run-41-title"]'))
  await expect(card.first()).toBeVisible()
  // Il polling (ogni 4 s) porta il giro da In corso a Completato.
  await expect(card.first().getByText('Missione completata')).toBeVisible({ timeout: 15_000 })
  expect(reads).toBeGreaterThanOrEqual(3)
  expect(api.unhandled).toEqual([])
})

test.describe('con movimento ridotto', () => {
  test.use({ reducedMotion: 'reduce' })

  test('banner: database giù mostra l’errore e il comando di nuovo tentativo', async ({ page }) => {
    const api = await mockApi(page)
    api.on('GET', '/api/v1/status', () => ({
      databaseReady: false,
      lastError: 'Timeout di connessione a SQL Server',
      lastCheckedUtc: '2026-10-11T09:00:00Z',
    }))

    await page.goto('/mailboxes')

    await expect(page.getByRole('heading', { name: 'Database non raggiungibile' })).toBeVisible()
    await expect(
      page.getByText('Timeout di connessione a SQL Server', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Riprova connessione' })).toBeVisible()
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(
      true,
    )
    expect(api.unhandled).toEqual([])
  })
})
