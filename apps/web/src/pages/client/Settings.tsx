import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientSettings, SettingsBody } from '@psydog/shared';
import { ReminderPicker } from '@/components/ReminderPicker';
import { Actions, ErrorNote, Loading, Screen } from '@/components/layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export function Settings() {
  const settings = useQuery({
    queryKey: ['client', 'settings'],
    queryFn: () => api<ClientSettings>('/client/settings'),
  });
  const [hour, setHour] = useState<number | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (settings.data) {
      setHour(settings.data.reminderHour);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => {
      const body: SettingsBody = { reminderHour: hour };
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
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder">Напоминание</Label>
            <ReminderPicker id="reminder" value={hour} onChange={setHour} />
          </div>
          <Button size="block" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isSuccess ? 'Сохранено' : 'Сохранить'}
          </Button>
          {save.isError && <ErrorNote />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Удалить мои данные</CardTitle>
          <CardDescription>
            Удалятся все отметки, практики, заметки и согласия. Психолог больше не увидит сводку.
            Вернуть их не получится.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t-0 bg-transparent pb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="block" variant="outline">
                Удалить данные
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить всё?</AlertDialogTitle>
                <AlertDialogDescription>
                  Отметки, практики, заметки и согласия удалятся без возможности восстановления.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Оставить</AlertDialogCancel>
                <AlertDialogAction disabled={wipe.isPending} onClick={() => wipe.mutate()}>
                  Да, удалить всё
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
        {wipe.isError && (
          <CardContent>
            <ErrorNote />
          </CardContent>
        )}
      </Card>

      <Actions>
        <Button asChild variant="ghost" size="block" className="text-muted-foreground">
          <Link to="/home">Вернуться к малышу</Link>
        </Button>
      </Actions>
    </Screen>
  );
}
