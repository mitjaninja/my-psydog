/** Локальная дата 'YYYY-MM-DD' в таймзоне клиента. */
export function localDateString(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Значение для колонки @db.Date: полночь UTC локальной даты. */
export function localDate(timezone: string, now = new Date()): Date {
  return new Date(`${localDateString(timezone, now)}T00:00:00.000Z`);
}

/** Локальный час 0–23 в таймзоне клиента. */
export function localHour(timezone: string, now = new Date()): number {
  const h = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return Number(h);
}

export const DAY_MS = 24 * 60 * 60 * 1000;
