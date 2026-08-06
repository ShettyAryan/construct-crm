import {
  addDays,
  endOfDay,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/** Indian Standard Time */
export const TIMEZONE = "Asia/Kolkata";

/** Display a stored UTC instant in IST */
export function formatIST(
  date: Date | string | number,
  pattern = "dd MMM yyyy"
): string {
  return formatInTimeZone(new Date(date), TIMEZONE, pattern);
}

export function formatISTDate(date: Date | string | number): string {
  return formatIST(date, "dd MMM yyyy");
}

export function formatISTDateTime(date: Date | string | number): string {
  return formatIST(date, "dd MMM yyyy · h:mm a");
}

export function formatISTShort(date: Date | string | number): string {
  return formatIST(date, "dd MMM");
}

/** Current wall-clock date in IST as YYYY-MM-DD (for `<input type="date">`) */
export function todayISTDateInput(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
}

/** Current wall-clock datetime in IST as YYYY-MM-DDTHH:mm (for datetime-local) */
export function nowISTDateTimeInput(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parse a date-only or datetime-local string as IST wall time → UTC Date for storage.
 * Accepts `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` / `YYYY-MM-DDTHH:mm:ss`.
 */
export function parseISTInput(value: string): Date {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Empty date");

  const hasTime = trimmed.includes("T");
  const normalized = hasTime
    ? trimmed.length === 16
      ? `${trimmed}:00`
      : trimmed
    : `${trimmed}T00:00:00`;

  return fromZonedTime(normalized, TIMEZONE);
}

/** Format a stored Date for `<input type="date">` in IST */
export function toISTDateInput(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TIMEZONE, "yyyy-MM-dd");
}

/** Format a stored Date for `<input type="datetime-local">` in IST */
export function toISTDateTimeInput(date: Date | string | number): string {
  return formatInTimeZone(new Date(date), TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

/** Start / end of “today” and end of “+N days” in IST, as UTC Dates for queries */
export function getISTDayBounds(daysAhead = 0) {
  const nowInIST = toZonedTime(new Date(), TIMEZONE);
  const base = addDays(nowInIST, daysAhead);
  return {
    start: fromZonedTime(startOfDay(nowInIST), TIMEZONE),
    end: fromZonedTime(endOfDay(nowInIST), TIMEZONE),
    endAhead: fromZonedTime(endOfDay(base), TIMEZONE),
  };
}
