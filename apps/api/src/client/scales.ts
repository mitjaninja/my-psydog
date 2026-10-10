import { NEED_IDS, type Need, type NeedScales } from '@psydog/shared';

export const SCALE_WINDOW_DAYS = 7;
export const SCALE_STEP = 25;

/** Шкалы 0–100: +25 за каждую практику потребности за последние 7 дней, максимум 100. */
export function computeScales(needsOfRecentCompletions: Need[]): NeedScales {
  const scales = Object.fromEntries(NEED_IDS.map((n) => [n, 0])) as NeedScales;
  for (const need of needsOfRecentCompletions) {
    scales[need] = Math.min(100, scales[need] + SCALE_STEP);
  }
  return scales;
}
