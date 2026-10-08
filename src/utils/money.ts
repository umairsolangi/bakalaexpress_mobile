/**
 * Money utilities adhering to integer paisa arithmetic (1 PKR = 100 Paisa).
 * Never uses raw floating-point arithmetic for totals.
 */

/**
 * Converts a string or numeric amount into integer paisa.
 * E.g., "280.00" -> 28000, "15.50" -> 1550, "15.5" -> 1550, 100 -> 10000.
 */
export function parseToPaisa(amount?: string | number | null): number {
  if (amount === null || amount === undefined || amount === '') {
    return 0;
  }
  const str = String(amount).trim();
  const [rupeesPart = '0', paisaPart = ''] = str.split('.');
  const cleanRupees = parseInt(rupeesPart.replace(/[^0-9-]/g, '') || '0', 10);
  const cleanPaisa = (paisaPart.slice(0, 2) + '00').slice(0, 2);
  const paisaInt = parseInt(cleanPaisa, 10) || 0;

  return cleanRupees >= 0
    ? cleanRupees * 100 + paisaInt
    : cleanRupees * 100 - paisaInt;
}

/**
 * Converts integer paisa back to a canonical 2-decimal string.
 * E.g., 28000 -> "280.00", 1550 -> "15.50".
 */
export function paisaToString(paisa: number): string {
  const isNegative = paisa < 0;
  const absPaisa = Math.abs(paisa);
  const rupees = Math.floor(absPaisa / 100);
  const remainingPaisa = absPaisa % 100;
  const paddedPaisa = remainingPaisa.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${rupees}.${paddedPaisa}`;
}

/**
 * Adds multiple monetary amounts together using integer paisa.
 */
export function addMoney(...amounts: (string | number | null | undefined)[]): string {
  const totalPaisa = amounts.reduce<number>((sum, val) => sum + parseToPaisa(val), 0);
  return paisaToString(totalPaisa);
}

/**
 * Multiplies a monetary amount by an integer quantity using integer paisa.
 */
export function multiplyMoney(amount: string | number | null | undefined, quantity: number): string {
  const paisa = parseToPaisa(amount);
  const totalPaisa = paisa * Math.round(quantity);
  return paisaToString(totalPaisa);
}

/**
 * Formats a monetary amount for display in UI.
 * Requirement: Display as "Rs 1,250" (no decimals when .00, otherwise 2).
 * Examples:
 * - "280.00" -> "Rs 280"
 * - "1250.00" -> "Rs 1,250"
 * - "1250.50" -> "Rs 1,250.50"
 * - 0 -> "Rs 0"
 */
export function formatMoney(amount?: string | number | null): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rs 0';
  }
  const totalPaisa = parseToPaisa(amount);
  const isNegative = totalPaisa < 0;
  const absPaisa = Math.abs(totalPaisa);
  const rupees = Math.floor(absPaisa / 100);
  const paisa = absPaisa % 100;

  // Format with thousand separators
  const formattedRupees = rupees.toLocaleString('en-US');

  if (paisa === 0) {
    return `${isNegative ? '-' : ''}Rs ${formattedRupees}`;
  }

  const formattedPaisa = paisa.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}Rs ${formattedRupees}.${formattedPaisa}`;
}
