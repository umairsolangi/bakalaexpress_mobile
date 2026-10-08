/**
 * Formats raw digits into CNIC mask: 12345-1234567-1
 */
export function formatCnic(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
}

/**
 * Strips all non-digit characters to return raw 13 digits.
 */
export function stripCnic(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13);
}

/**
 * Masks CNIC number except the last 4 digits for privacy on review screens.
 * Example: 42101-1234567-1 -> ********-67-1 or *********5671
 */
export function maskCnic(value: string): string {
  const digits = stripCnic(value);
  if (digits.length <= 4) {
    return digits;
  }
  const maskedPrefix = '*'.repeat(digits.length - 4);
  const lastFour = digits.slice(-4);
  return `${maskedPrefix}${lastFour}`;
}
