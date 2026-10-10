import { Navigate } from 'react-router-dom';
import { ErrorNote, Loading, Screen } from '../components/ui';
import { inviteCodeFrom, useMe } from '../lib/me';

/** Точка входа: решает, куда вести пользователя по роли и приглашению. */
export function Gate() {
  const me = useMe();
  if (me.isPending) return <Loading />;
  if (!me.data)
    return (
      <Screen>
        <ErrorNote />
      </Screen>
    );

  const { role, client } = me.data;
  if (role === 'PSYCHOLOGIST') return <Navigate to="/p/clients" replace />;
  if (role === 'CLIENT') {
    return <Navigate to={client?.onboardedAt ? '/home' : '/onboarding'} replace />;
  }
  const code = inviteCodeFrom(me.data);
  return <Navigate to={code ? `/invite/${code}` : '/welcome'} replace />;
}
