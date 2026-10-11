// Label di sistema di Gmail con il loro testo in italiano. Le label create dall'utente ("Label_<n>")
// non hanno qui un nome: per leggerlo servirebbe la lista delle label da Gmail, che l'API oggi non espone.
const SYSTEM_LABELS: Readonly<Record<string, string>> = {
  INBOX: 'Posta in arrivo',
  UNREAD: 'Da leggere',
  STARRED: 'Speciali',
  IMPORTANT: 'Importanti',
  SENT: 'Inviata',
  DRAFT: 'Bozza',
  SPAM: 'Spam',
  TRASH: 'Cestino',
  CHAT: 'Chat',
  CATEGORY_PERSONAL: 'Principale',
  CATEGORY_SOCIAL: 'Social',
  CATEGORY_PROMOTIONS: 'Promozioni',
  CATEGORY_UPDATES: 'Aggiornamenti',
  CATEGORY_FORUMS: 'Forum',
}

const LABEL_SEPARATOR = ','

/** Id delle label Gmail salvati separati da virgola → elenco senza voci vuote. */
export function splitLabels(labels: string | null | undefined): string[] {
  if (labels === null || labels === undefined) return []
  return labels
    .split(LABEL_SEPARATOR)
    .map((id) => id.trim())
    .filter((id) => id !== '')
}

/** True se l'id è una label di sistema di Gmail con un testo noto. */
export function isSystemLabel(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SYSTEM_LABELS, id)
}

/** Testo leggibile della label: italiano per quelle di sistema, l'id invariato per le altre. */
export function labelText(id: string): string {
  return isSystemLabel(id) ? SYSTEM_LABELS[id]! : id
}
