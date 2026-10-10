/** Дата момента; timeZone — чтобы показывать дни так, как их прожил клиент. */
export function formatDate(iso: string, timeZone?: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone });
}

/** Для дат вида YYYY-MM-DD (локальная дата клиента). */
export function formatDay(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
    timeZone: 'UTC',
  });
}
