import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../../components/Character';
import { CrisisButton } from '../../components/CrisisButton';
import { NeedScales } from '../../components/NeedScales';
import { Button, Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { useClientHome } from '../../lib/client';

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
  const { characterName, mood, checkedInToday, scales, assignments } = home.data;

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{characterName}</h1>
        <Link to="/settings" className="text-sm text-hint">
          Настройки
        </Link>
      </div>
      <Character mood={mood} size={190} />
      <Button onClick={() => navigate('/checkin')}>
        {checkedInToday ? `Как ${characterName} сейчас?` : `Как ${characterName} сегодня?`}
      </Button>

      <Card>
        <NeedScales scales={scales} />
      </Card>

      {assignments.length > 0 && (
        <Card>
          <p className="mb-2 font-medium">От психолога</p>
          <ul className="flex flex-col gap-2">
            {assignments.map((a) => (
              <li key={a.id}>
                <Link to={`/practice/${a.practice.id}`} className="flex justify-between gap-2">
                  <span>{a.practice.title}</span>
                  <span className="shrink-0 text-sm text-hint">{a.practice.durationMin} мин</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link to="/history" className="text-center text-hint">
        Что мы уже сделали
      </Link>
      <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
      <div className="mt-auto">
        <CrisisButton />
      </div>
    </Screen>
  );
}
