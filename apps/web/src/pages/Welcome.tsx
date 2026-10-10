import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Actions, ErrorNote, Hint, Screen } from '@/components/layout';
import { Character } from '@/components/Character';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

/** Пользователь без роли и без приглашения. */
export function Welcome() {
  const [isPsychologist, setIsPsychologist] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const register = useMutation({
    mutationFn: () =>
      api('/psychologist/register', {
        method: 'POST',
        body: JSON.stringify({ displayName: name.trim() }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/p/clients', { replace: true });
    },
  });

  if (isPsychologist) {
    return (
      <Screen title="Как тебя будут видеть клиенты?">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">Имя</Label>
          <Input
            id="displayName"
            autoFocus
            maxLength={60}
            placeholder="Например: Мария, психолог"
            className="h-12 rounded-xl text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Hint>Имя появится на экране приглашения.</Hint>
        </div>
        <Actions>
          <Button
            size="block"
            disabled={!name.trim() || register.isPending}
            onClick={() => register.mutate()}
          >
            Продолжить
          </Button>
          {register.isError && <ErrorNote />}
          <Button size="block" variant="ghost" onClick={() => setIsPsychologist(false)}>
            Назад
          </Button>
        </Actions>
      </Screen>
    );
  }

  return (
    <Screen title="Привет!">
      <Character mood="CALM" size={150} />
      <Card className="text-base">
        <CardContent>
          Здесь живёт малыш, о котором можно заботиться между встречами с психологом. Чтобы
          познакомиться с ним, попроси у своего психолога ссылку-приглашение.
        </CardContent>
      </Card>
      <Actions>
        <Button size="block" variant="secondary" onClick={() => setIsPsychologist(true)}>
          Я психолог
        </Button>
      </Actions>
    </Screen>
  );
}
