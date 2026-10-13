/** Tempo prima di liberare l'URL del blob: il browser deve aver avviato il download. */
export const OBJECT_URL_REVOKE_DELAY_MS = 1000

/**
 * Salva un blob come file: link temporaneo con `download`, clic, poi rimozione. Serve quando il file arriva
 * da una chiamata autenticata (header della chiave API), che un semplice link non può fare.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS)
}
