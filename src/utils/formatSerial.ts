/** Cifre della matricola: "MR-0003" (design.md, "Lessico"). */
export const SERIAL_DIGITS = 4

/** Matricola di un'unità: prefisso + id con zeri iniziali. */
export function formatSerial(id: number | string, prefix = 'MR'): string {
  return `${prefix}-${String(id).padStart(SERIAL_DIGITS, '0')}`
}
