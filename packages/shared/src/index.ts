// Общие типы и zod-схемы для web и api.
import { z } from 'zod';

export interface HealthResponse {
  ok: true;
}

export type Role = 'CLIENT' | 'PSYCHOLOGIST';

export interface MeResponse {
  id: string;
  tgId: string;
  firstName: string | null;
  role: Role | null;
  startParam: string | null;
  psychologist: { displayName: string } | null;
  client: { characterName: string; onboardedAt: string | null } | null;
}

// --- Роли и приглашения ---

export const registerPsychologistBody = z.object({
  displayName: z.string().trim().min(1).max(60),
});
export type RegisterPsychologistBody = z.infer<typeof registerPsychologistBody>;

export const createInviteBody = z.object({
  alias: z.string().trim().min(1).max(40),
});
export type CreateInviteBody = z.infer<typeof createInviteBody>;

export interface CreateInviteResponse {
  code: string;
  link: string;
}

export const acceptInviteResponse = z.object({ psychologistName: z.string() });
export type AcceptInviteResponse = z.infer<typeof acceptInviteResponse>;

export interface InvitePreview {
  psychologistName: string;
  status: 'active' | 'used' | 'expired';
}

export const INVITE_PREFIX = 'inv_';

// --- Потребности и состояния персонажа ---

export const NEED_IDS = ['SAFETY', 'AUTONOMY', 'EXPRESSION', 'PLAY', 'LIMITS'] as const;
export type Need = (typeof NEED_IDS)[number];

export const MOOD_IDS = ['CALM', 'JOYFUL', 'HIDING', 'SCARED'] as const;
export type Mood = (typeof MOOD_IDS)[number];

export const INPUT_TYPES = ['TEXT', 'LIST', 'CHECKLIST', 'TIMER'] as const;
export type InputType = (typeof INPUT_TYPES)[number];

/** Тексты потребностей для UI. TODO: проверка схема-терапевтом. */
export const NEEDS: Record<Need, { title: string; short: string; about: string }> = {
  SAFETY: {
    title: 'Безопасность и привязанность',
    short: 'Безопасность',
    about: 'Малышу хочется, чтобы его обняли, утешили и были рядом.',
  },
  AUTONOMY: {
    title: 'Автономия и компетентность',
    short: 'Самостоятельность',
    about: 'Малышу хочется что-то сделать самому и увидеть, что получается.',
  },
  EXPRESSION: {
    title: 'Выражение чувств и потребностей',
    short: 'Чувства',
    about: 'Малышу хочется рассказать, что он чувствует, и быть услышанным.',
  },
  PLAY: {
    title: 'Спонтанность и игра',
    short: 'Игра',
    about: 'Малышу хочется поиграть и порадоваться просто так.',
  },
  LIMITS: {
    title: 'Разумные границы',
    short: 'Границы',
    about: 'Малыш учится останавливаться и беречь себя.',
  },
};

// --- Онбординг и согласия ---

export const CONSENT_VERSION = '1.0';
export const CONSENT_TYPES = [
  'data_processing',
  'share_with_psychologist',
  'crisis_notify',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const DEFAULT_CHARACTER_NAME = 'Малыш';

export const characterName = z.string().trim().min(1).max(30);
export const reminderHour = z.number().int().min(0).max(23).nullable();
export const timezone = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}, 'Unknown timezone');

export const onboardingBody = z.object({
  consents: z.object({
    // Оба первых согласия обязательны: без них приложение не работает с психологом
    dataProcessing: z.literal(true),
    shareWithPsychologist: z.literal(true),
    crisisNotify: z.boolean(),
  }),
  characterName,
  reminderHour,
  timezone: timezone.optional(),
});
export type OnboardingBody = z.infer<typeof onboardingBody>;
