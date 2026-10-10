// Общие типы и схемы для web и api.

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
}
