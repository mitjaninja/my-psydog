import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, UserPlus } from 'lucide-react';
import type { PsyClientListItem } from '@psydog/shared';
import { Actions, ErrorNote, Hint, Loading, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useMe } from '@/lib/me';

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
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-base">{c.alias}</CardTitle>
                  <CardDescription>
                    {c.lastActivityAt
                      ? `Последняя отметка: ${formatDate(c.lastActivityAt)}`
                      : 'Пока без отметок'}
                  </CardDescription>
                  <CardAction className="self-center text-muted-foreground">
                    <ChevronRight />
                  </CardAction>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <Actions>
        <Button asChild size="block">
          <Link to="/p/invite">
            <UserPlus />
            Пригласить клиента
          </Link>
        </Button>
      </Actions>
    </Screen>
  );
}
