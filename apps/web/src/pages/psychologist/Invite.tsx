import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { shareURL } from '@telegram-apps/sdk-react';
import type { CreateInviteResponse } from '@psydog/shared';
import { Button, Card, ErrorNote, Hint, Input, Screen } from '../../components/ui';
import { api } from '../../lib/api';

export function PsyInvite() {
  const [alias, setAlias] = useState('');
  const create = useMutation({
    mutationFn: () =>
      api<CreateInviteResponse>('/invites', {
        method: 'POST',
        body: JSON.stringify({ alias: alias.trim() }),
      }),
  });

  function share(link: string) {
    if (shareURL.isAvailable()) shareURL(link, 'Приглашение познакомиться с малышом');
    else void navigator.clipboard?.writeText(link);
  }

  return (
    <Screen title="Пригласить клиента">
      {create.data ? (
        <>
          <Card>
            <p className="break-all font-mono text-sm">{create.data.link}</p>
          </Card>
          <Hint>Ссылка одноразовая и действует 14 дней.</Hint>
          <Button onClick={() => share(create.data.link)}>Поделиться</Button>
          <Button
            variant="secondary"
            onClick={() => {
              create.reset();
              setAlias('');
            }}
          >
            Ещё одно приглашение
          </Button>
        </>
      ) : (
        <>
          <Hint>
            Как подписать клиента у себя — например, «А., вторник». Клиент эту подпись не видит.
          </Hint>
          <Input
            autoFocus
            maxLength={40}
            placeholder="Подпись"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
          <Button disabled={!alias.trim() || create.isPending} onClick={() => create.mutate()}>
            Создать ссылку
          </Button>
          {create.isError && <ErrorNote />}
        </>
      )}
      <Link to="/p/clients" className="mt-auto text-center text-hint">
        К списку клиентов
      </Link>
    </Screen>
  );
}
