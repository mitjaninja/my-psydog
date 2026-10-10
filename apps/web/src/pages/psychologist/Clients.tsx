import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { PsyClientListItem } from '@psydog/shared';
import { Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useMe } from '../../lib/me';

export function PsyClients() {
  const me = useMe();
  const clients = useQuery({
    queryKey: ['p', 'clients'],
    queryFn: () => api<PsyClientListItem[]>('/p/clients'),
  });

  if (clients.isPending) return <Loading />;

  return (
    <Screen title="Мои клиенты">
      {me.data?.psychologist && <Hint>{me.data.psychologist.displayName}</Hint>}
      {!clients.data && <ErrorNote />}
      {clients.data?.length === 0 && (
        <Hint>Пока никого. Создай ссылку-приглашение и отправь её клиенту.</Hint>
      )}
      <ul className="flex flex-col gap-2">
        {clients.data?.map((c) => (
          <li key={c.id}>
            <Link to={`/p/clients/${c.id}`}>
              <Card>
                <p className="font-medium">{c.alias}</p>
                <p className="text-sm text-hint">
                  {c.lastActivityAt
                    ? `Последняя отметка: ${formatDate(c.lastActivityAt)}`
                    : 'Пока без отметок'}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/p/invite"
        className="mt-auto rounded-2xl bg-button px-4 py-3 text-center text-button-text"
      >
        Пригласить клиента
      </Link>
    </Screen>
  );
}
