import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const KARACHI_TIMEZONE = 'Asia/Karachi';

/**
 * Format an ISO UTC timestamp to Asia/Karachi presentation format.
 */
export function formatKarachiDateTime(
  timestamp?: string | null,
  template = 'DD MMM YYYY, hh:mm A'
): string {
  if (!timestamp) return '';
  return dayjs(timestamp).tz(KARACHI_TIMEZONE).format(template);
}

/**
 * Format time only in Asia/Karachi.
 */
export function formatKarachiTime(timestamp?: string | null, template = 'hh:mm A'): string {
  if (!timestamp) return '';
  return dayjs(timestamp).tz(KARACHI_TIMEZONE).format(template);
}

/**
 * Format shop operating hours (e.g., "09:00:00" -> "9:00 AM").
 */
export function formatShopTime(timeString?: string | null): string {
  if (!timeString) return '';
  // Time format from backend is "HH:mm:ss" or "HH:mm"
  const clean = timeString.trim();
  const [hours, minutes] = clean.split(':').map(Number);
  if (isNaN(hours)) return timeString;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = (minutes || 0).toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export { dayjs };
