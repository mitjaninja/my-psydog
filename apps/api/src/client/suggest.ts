import type { Mood, Need } from '@psydog/shared';

export interface SuggestPractice {
  id: string;
  need: Need;
  isComforting: boolean;
}

export interface SuggestInput {
  mood: Mood;
  lowNeed: Need | null;
  isHardDay: boolean;
}

export const CRITIC_SHIELD_ID = 'critic-shield';

function pick<T>(items: T[], rng: () => number): T | undefined {
  return items.length ? items[Math.floor(rng() * items.length)] : undefined;
}

/**
 * Подбор одной практики после чек-ина (SPEC, шаг 7):
 * 1) тяжёлый день или HIDING/SCARED → утешающая (для SCARED — сперва critic-shield);
 * 2) назначение психолога с той же lowNeed; 3) любое назначение;
 * 4) случайная практика с need = lowNeed (без lowNeed — любая).
 */
export function suggestPractice<P extends SuggestPractice>(
  input: SuggestInput,
  practices: P[],
  assigned: P[],
  rng: () => number = Math.random,
): P | undefined {
  if (input.isHardDay || input.mood === 'HIDING' || input.mood === 'SCARED') {
    if (input.mood === 'SCARED') {
      const shield = practices.find((p) => p.id === CRITIC_SHIELD_ID);
      if (shield) return shield;
    }
    const comforting = pick(
      practices.filter((p) => p.isComforting),
      rng,
    );
    if (comforting) return comforting;
  }
  if (input.lowNeed) {
    const sameNeed = pick(
      assigned.filter((p) => p.need === input.lowNeed),
      rng,
    );
    if (sameNeed) return sameNeed;
  }
  const anyAssigned = pick(assigned, rng);
  if (anyAssigned) return anyAssigned;
  const byNeed = input.lowNeed ? practices.filter((p) => p.need === input.lowNeed) : practices;
  return pick(byNeed, rng) ?? pick(practices, rng);
}
