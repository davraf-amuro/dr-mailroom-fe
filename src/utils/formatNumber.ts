// Intl in italiano non separa le migliaia sotto 10.000 ("1500") e i tipi TS in uso non ammettono useGrouping 'always':
// raggruppamento esplicito, così "1.500" sta accanto a "13.000".
const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g
const THOUSANDS_SEPARATOR = '.'

/** Conteggio intero con separatore delle migliaia italiano: 1500 → "1.500", 13000 → "13.000". */
export function formatCount(value: number): string {
  return Math.round(value).toString().replace(THOUSANDS, THOUSANDS_SEPARATOR)
}
