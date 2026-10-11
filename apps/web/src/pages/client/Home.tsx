import { Link, useNavigate } from 'react-router-dom';
import { CHARACTER_NAME } from '@psydog/shared';
import { ChevronRight, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { Character } from '@/components/Character';
import { CrisisButton } from '@/components/CrisisButton';
import { NeedScales } from '@/components/NeedScales';
import { ErrorNote, Hint, Loading, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientHome } from '@/lib/client';

export function ClientHome() {
  const home = useClientHome();
  const navigate = useNavigate();

  if (home.isPending) return <Loading />;
  if (!home.data)
    return (
      <Screen>
        <ErrorNote />
        <CrisisButton />
      </Screen>
    );
  const { mood, checkedInToday, scales, assignments } = home.data;

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{CHARACTER_NAME}</h1>
        <Button variant="ghost" size="icon-lg" asChild>
          <Link to="/settings" aria-label="Настройки">
            <SettingsIcon />
          </Link>
        </Button>
      </div>
      <Character mood={mood} size={190} />
      <Button size="block" onClick={() => navigate('/checkin')}>
        {checkedInToday ? `Как ${CHARACTER_NAME} сейчас?` : `Как ${CHARACTER_NAME} сегодня?`}
      </Button>

      <Card>
        <CardContent>
          <NeedScales scales={scales} />
        </CardContent>
      </Card>

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>От психолога</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 px-2">
            {assignments.map((a) => (
              <Button
                key={a.id}
                asChild
                variant="ghost"
                className="h-auto justify-between px-2 py-2 text-base font-normal"
              >
                <Link to={`/practice/${a.practice.id}`}>
                  <span className="truncate">{a.practice.title}</span>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                    {a.practice.durationMin} мин
                    <ChevronRight />
                  </span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Button asChild variant="ghost" size="block" className="text-muted-foreground">
        <Link to="/history">
          <HistoryIcon />
          Что мы уже сделали
        </Link>
      </Button>
      <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
      <div className="mt-auto">
        <CrisisButton />
      </div>
    </Screen>
  );
}
