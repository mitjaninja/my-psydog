import { useQuery } from '@tanstack/react-query';
import { INVITE_PREFIX, type MeResponse } from '@psydog/shared';
import { api } from './api';

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });
}

/**
 * Код приглашения: из start_param подписанной initData (ссылка t.me/<bot>/app?startapp=…)
 * или из ?startapp= в URL (кнопка бота после /start inv_<code>). Код сам по себе — секрет.
 */
export function inviteCodeFrom(me: MeResponse): string | null {
  const param = me.startParam ?? new URLSearchParams(location.search).get('startapp');
  return param?.startsWith(INVITE_PREFIX) ? param.slice(INVITE_PREFIX.length) : null;
}
