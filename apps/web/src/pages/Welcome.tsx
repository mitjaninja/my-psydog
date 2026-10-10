import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ErrorNote, Hint, Input, Screen } from '../components/ui';
import { api } from '../lib/api';

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
        <Hint>Имя появится на экране приглашения. Например: «Мария, психолог».</Hint>
        <Input
          autoFocus
          maxLength={60}
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button disabled={!name.trim() || register.isPending} onClick={() => register.mutate()}>
          Продолжить
        </Button>
        {register.isError && <ErrorNote />}
        <Button variant="secondary" onClick={() => setIsPsychologist(false)}>
          Назад
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title="Привет!">
      <Card>
        <p>
          Здесь живёт малыш, о котором можно заботиться между встречами с психологом. Чтобы
          познакомиться с ним, попроси у своего психолога ссылку-приглашение.
        </p>
      </Card>
      <div className="mt-auto">
        <Button variant="secondary" onClick={() => setIsPsychologist(true)}>
          Я психолог
        </Button>
      </div>
    </Screen>
  );
}
