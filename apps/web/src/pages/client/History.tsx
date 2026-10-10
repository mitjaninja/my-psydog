import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NEEDS, type HistoryDay } from '@psydog/shared';
import { Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDay } from '../../lib/format';

export function History() {
  const history = useQuery({
    queryKey: ['client', 'history'],
    queryFn: () => api<HistoryDay[]>('/client/history'),
  });

  if (history.isPending) return <Loading />;

  return (
    <Screen title="Что мы уже сделали">
      {!history.data && <ErrorNote />}
      {history.data?.length === 0 && (
        <Hint>Здесь будут практики, которые ты сделаешь для малыша.</Hint>
      )}
      {history.data?.map((day) => (
        <section key={day.date} className="flex flex-col gap-2">
          <h2 className="text-sm text-hint">{formatDay(day.date)}</h2>
          {day.items.map((item) => (
            <Card key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-hint">{NEEDS[item.need].short}</p>
              {item.note && <p className="mt-2 whitespace-pre-line">{item.note}</p>}
              {item.note && item.shareNote && (
                <p className="mt-1 text-xs text-hint">Видно психологу</p>
              )}
            </Card>
          ))}
        </section>
      ))}
      <Link to="/home" className="mt-auto text-center text-hint">
        Вернуться к малышу
      </Link>
    </Screen>
  );
}
