import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { shareURL } from '@telegram-apps/sdk-react';
import { Share2 } from 'lucide-react';
import type { CreateInviteResponse } from '@psydog/shared';
import { Actions, ErrorNote, Hint, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

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
            <CardContent className="font-mono text-sm break-all">{create.data.link}</CardContent>
          </Card>
          <Hint>Ссылка одноразовая и действует 14 дней.</Hint>
          <Button size="block" onClick={() => share(create.data.link)}>
            <Share2 />
            Поделиться
          </Button>
          <Button
            size="block"
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="alias">Подпись</Label>
            <Input
              id="alias"
              autoFocus
              maxLength={40}
              placeholder="Например: А., вторник"
              className="h-12 rounded-xl text-base"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
            <Hint>Как подписать клиента у себя. Клиент эту подпись не видит.</Hint>
          </div>
          <Button
            size="block"
            disabled={!alias.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            Создать ссылку
          </Button>
          {create.isError && <ErrorNote />}
        </>
      )}
      <Actions>
        <Button asChild variant="ghost" size="block" className="text-muted-foreground">
          <Link to="/p/clients">К списку клиентов</Link>
        </Button>
      </Actions>
    </Screen>
  );
}
