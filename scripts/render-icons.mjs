// Rigenera le icone raster da design/app-icon.svg e public/favicon.svg.
// Uso: node scripts/render-icons.mjs  (richiede il Chromium di Playwright: npx playwright install chromium)
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const publicDir = `${root}public/`

const APP_ICON_SIZES = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]
const FAVICON_ICO_SIZES = [16, 32, 48]

async function renderSvg(page, svg, size, colorScheme = 'light') {
  await page.emulateMedia({ colorScheme })
  await page.setViewportSize({ width: size, height: size })
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${dataUrl}" width="${size}" height="${size}" style="display:block"></body></html>`,
  )
  await page.locator('img').evaluate((img) => img.decode())
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
}

// ICO con voci PNG (supportate da tutti i browser attuali): header 6 byte + 16 byte per voce.
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  let offset = 6 + 16 * entries.length
  const directory = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })
  return Buffer.concat([header, ...directory, ...entries.map((e) => e.png)])
}

const browser = await chromium.launch()
const page = await browser.newPage()
try {
  const appIcon = await readFile(`${root}design/app-icon.svg`, 'utf8')
  for (const { file, size } of APP_ICON_SIZES) {
    await writeFile(`${publicDir}${file}`, await renderSvg(page, appIcon, size))
  }

  const favicon = await readFile(`${publicDir}favicon.svg`, 'utf8')
  const icoEntries = []
  for (const size of FAVICON_ICO_SIZES) {
    icoEntries.push({ size, png: await renderSvg(page, favicon, size) })
  }
  await writeFile(`${publicDir}favicon.ico`, buildIco(icoEntries))
  console.log('Icone rigenerate in public/')
} finally {
  await browser.close()
}
