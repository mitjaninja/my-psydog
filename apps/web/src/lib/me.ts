import { useQuery } from '@tanstack/react-query';
import { INVITE_PREFIX, type MeResponse } from '@psydog/shared';
import { api } from './api';

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });
}

/** Код приглашения из startapp. В dev-браузере — из ?startapp=inv_<code>. */
export function inviteCodeFrom(me: MeResponse): string | null {
  const param =
    me.startParam ??
    (import.meta.env.DEV ? new URLSearchParams(location.search).get('startapp') : null);
  return param?.startsWith(INVITE_PREFIX) ? param.slice(INVITE_PREFIX.length) : null;
}
