import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientSettings, SettingsBody } from '@psydog/shared';
import { ReminderPicker } from '../../components/ReminderPicker';
import { Button, Card, ErrorNote, Hint, Input, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';

export function Settings() {
  const settings = useQuery({
    queryKey: ['client', 'settings'],
    queryFn: () => api<ClientSettings>('/client/settings'),
  });
  const [name, setName] = useState('');
  const [hour, setHour] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (settings.data) {
      setName(settings.data.characterName);
      setHour(settings.data.reminderHour);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => {
      const body: SettingsBody = { characterName: name.trim(), reminderHour: hour };
      return api<ClientSettings>('/client/settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client'] }),
  });

  const wipe = useMutation({
    mutationFn: () => api('/client/data', { method: 'DELETE' }),
    onSuccess: async () => {
      qc.clear();
      navigate('/', { replace: true });
    },
  });

  if (settings.isPending) return <Loading />;

  return (
    <Screen title="Настройки">
      <Card className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-hint">Имя малыша</span>
          <Input maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-hint">Напоминание</span>
          <ReminderPicker value={hour} onChange={setHour} />
        </label>
        <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
          {save.isSuccess ? 'Сохранено' : 'Сохранить'}
        </Button>
        {save.isError && <ErrorNote />}
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-medium">Удалить мои данные</p>
        <Hint>
          Удалятся все отметки, практики, заметки и согласия. Психолог больше не увидит сводку.
          Вернуть их не получится.
        </Hint>
        {confirmDelete ? (
          <>
            <Button disabled={wipe.isPending} onClick={() => wipe.mutate()}>
              Да, удалить всё
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Оставить
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirmDelete(true)}>
            Удалить данные
          </Button>
        )}
        {wipe.isError && <ErrorNote />}
      </Card>

      <Link to="/home" className="mt-auto text-center text-hint">
        Вернуться к малышу
      </Link>
    </Screen>
  );
}
