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
